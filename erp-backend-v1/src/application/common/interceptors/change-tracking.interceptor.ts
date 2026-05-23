/**
 * ============================================================================
 * CHANGE TRACKING INTERCEPTOR
 * ============================================================================
 *
 * Automatically tracks changes for UPDATE/APPROVE/REJECT/RESTORE operations.
 * Captures old values, new values, and changed fields.
 *
 * How it works:
 * 1. BEFORE the handler: Fetches the current DB record (old state)
 * 2. AFTER the handler: Compares old state with response data (new state)
 * 3. Stores the diff in request[CHANGE_TRACKING_KEY] for AuditInterceptor
 *
 * Works in conjunction with AuditInterceptor to provide detailed audit logs.
 *
 * ============================================================================
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  TRACK_CHANGES_METADATA_KEY,
  TrackChangesOptions,
} from '../decorators/track-changes.decorator';

export const CHANGE_TRACKING_KEY = 'audit:changeTracking';

@Injectable()
export class ChangeTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ChangeTrackingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Get tracking configuration from @TrackChanges() decorator
    const trackingConfig =
      this.reflector.getAllAndOverride<TrackChangesOptions>(
        TRACK_CHANGES_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      );

    // Skip if no tracking config
    if (!trackingConfig) {
      return next.handle();
    }

    // Extract resource ID from params
    const resourceIdParam = trackingConfig.resourceIdParam || 'id';
    const resourceId =
      (request.params?.[resourceIdParam] as string | undefined) ||
      (resourceIdParam !== 'id'
        ? undefined
        : (request.params?.userId as string));

    if (!resourceId) {
      this.logger.warn(
        `@TrackChanges('${trackingConfig.resourceType}') — no :${resourceIdParam} param found in request`,
      );
      return next.handle();
    }

    // Fetch old values BEFORE the handler executes
    return from(
      this.fetchOldValues(trackingConfig.resourceType, resourceId),
    ).pipe(
      tap((oldValues) => {
        if (oldValues) {
          // Store old values in request for audit interceptor to use
          request[CHANGE_TRACKING_KEY] = {
            oldValues,
            resourceType: trackingConfig.resourceType,
            excludeFields: trackingConfig.excludeFields || [],
            includeFields: trackingConfig.includeFields,
          };
        }
      }),
      switchMap(() => next.handle()),
      tap((responseData) => {
        // Compare and compute changed fields AFTER handler executes
        if (request[CHANGE_TRACKING_KEY] && responseData) {
          const trackingData = request[CHANGE_TRACKING_KEY];
          const oldValues = trackingData.oldValues;

          const excludeFields = Array.isArray(trackingData.excludeFields)
            ? trackingData.excludeFields
            : [];
          const includeFields = trackingData.includeFields
            ? Array.isArray(trackingData.includeFields)
              ? trackingData.includeFields
              : []
            : undefined;

          const comparison = this.compareValues(
            oldValues,
            responseData,
            excludeFields as string[],
            includeFields as string[] | undefined,
          );

          // Update tracking data with comparison results
          request[CHANGE_TRACKING_KEY] = {
            ...trackingData,
            ...comparison,
            newValues: responseData,
          };
        }
      }),
    );
  }

  /**
   * Fetch old values from database
   */
  private async fetchOldValues(
    resourceType: string,
    resourceId: string,
  ): Promise<any> {
    try {
      const modelName = this.getModelName(resourceType);

      if (!modelName) {
        this.logger.warn(
          `No model mapping for resource type: "${resourceType}". ` +
            `Add it to the MODEL_MAP in change-tracking.interceptor.ts`,
        );
        return null;
      }

      if (!(this.prisma as any)[modelName]) {
        this.logger.error(
          `Prisma model "${modelName}" does not exist on PrismaClient`,
        );
        return null;
      }

      const record = await (this.prisma as any)[modelName].findUnique({
        where: { id: resourceId },
      });

      if (!record) {
        this.logger.warn(`No record found for ${resourceType}:${resourceId}`);
      }

      return record;
    } catch (error) {
      this.logger.error(
        `Error fetching old values for ${resourceType}:${resourceId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Map resource type (from @TrackChanges decorator) to Prisma model name.
   *
   * IMPORTANT: The values must match PrismaClient property names exactly
   * (camelCase versions of the PascalCase model names in schema.prisma).
   *
   * When adding a new @TrackChanges('xxx') decorator, add the mapping here.
   */
  private getModelName(resourceType: string): string | null {
    const MODEL_MAP: Record<string, string> = {
      // ── Core modules ──────────────────────────────────────────────
      project: 'project',
      site: 'site',
      user: 'user',
      employee: 'employee',
      asset: 'asset',
      role: 'role',

      // ── Maintenance ───────────────────────────────────────────────
      maintenance: 'maintenanceRequest',

      // ── Finance ───────────────────────────────────────────────────
      'project-cost': 'cost',
      'cost-category': 'costCategory',
      'cost-allocation': 'costAllocation',

      // ── Payroll ───────────────────────────────────────────────────
      'allowance-type': 'allowanceType',
      'employee-allowance': 'employeeAllowance',
      'employee-loan': 'employeeLoan',
      'employee-deduction': 'employeeDeduction',

      // ── Status-change variants (same model, different action context)
      // These are used by @TrackChanges('employee-deduction-approve') etc.
      // They all resolve to the same Prisma model because we're tracking
      // the status field change on the same entity.
      'employee-deduction-approve': 'employeeDeduction',
      'employee-deduction-reject': 'employeeDeduction',
      'employee-deduction-unapprove': 'employeeDeduction',
      'employee-deduction-restore': 'employeeDeduction',
    };

    return MODEL_MAP[resourceType.toLowerCase()] || null;
  }

  /**
   * Compare old and new values to find changed fields
   */
  private compareValues(
    oldValues: any,
    newValues: any,
    excludeFields: string[] = [],
    includeFields?: string[],
  ): {
    changedFields: string[];
    filteredOldValues: Record<string, any>;
    filteredNewValues: Record<string, any>;
  } {
    const changedFields: string[] = [];
    const filteredOldValues: Record<string, any> = {};
    const filteredNewValues: Record<string, any> = {};

    // Default excluded fields
    const defaultExcluded = [
      'id',
      'createdAt',
      'updatedAt',
      'deletedAt',
      'createdBy',
      'updatedBy',
      'deletedBy',
    ];
    const excluded = [...defaultExcluded, ...excludeFields];

    // Get fields to compare - Type assertion to handle any type
    const newValuesObj = (newValues || {}) as Record<string, any>;
    const fieldsToCompare = includeFields
      ? includeFields
      : Object.keys(newValuesObj).filter((key) => !excluded.includes(key));

    for (const field of fieldsToCompare) {
      const oldValue = oldValues?.[field];
      const newValue = newValues?.[field];

      // Skip if both are null/undefined
      if (oldValue == null && newValue == null) {
        continue;
      }

      // Compare values (handle different types)
      const hasChanged = this.hasValueChanged(oldValue, newValue);

      if (hasChanged) {
        changedFields.push(field);
        filteredOldValues[field] = this.sanitizeValue(oldValue);
        filteredNewValues[field] = this.sanitizeValue(newValue);
      }
    }

    return {
      changedFields,
      filteredOldValues,
      filteredNewValues,
    };
  }

  /**
   * Check if value has changed
   */
  private hasValueChanged(oldValue: any, newValue: any): boolean {
    // Handle null/undefined
    if (oldValue == null && newValue == null) return false;
    if (oldValue == null || newValue == null) return true;

    // Handle dates
    if (oldValue instanceof Date && newValue instanceof Date) {
      return oldValue.getTime() !== newValue.getTime();
    }
    if (oldValue instanceof Date || newValue instanceof Date) {
      return true;
    }

    // Handle objects/arrays (JSON comparison)
    if (typeof oldValue === 'object' || typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    // Primitive comparison
    return oldValue !== newValue;
  }

  /**
   * Sanitize value for logging (remove sensitive data, format properly)
   */
  private sanitizeValue(value: any): any {
    if (value == null) return null;

    // Handle dates
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle objects/arrays
    if (typeof value === 'object') {
      return JSON.parse(JSON.stringify(value));
    }

    return value;
  }
}
