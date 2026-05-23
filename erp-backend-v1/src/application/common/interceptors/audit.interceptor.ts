/**
 * ============================================================================
 * AUDIT INTERCEPTOR - AUTOMATIC AUDIT LOGGING
 * ============================================================================
 *
 * Global interceptor that automatically logs all mutating requests (POST, PUT,
 * PATCH, DELETE) for a complete audit trail. GET requests are SKIPPED by default
 * to avoid flooding the audit_logs table with noise — they are only logged when
 * explicitly opted-in via @AuditLog({ action: VIEW }).
 *
 * Design decisions:
 * ─────────────────
 * 1. GET requests produce ~90% of traffic but carry zero audit value; skipping
 *    them keeps the table lean and queries fast.
 * 2. oldValues / newValues are ONLY populated from ChangeTrackingInterceptor data.
 *    We never fall back to request.body or response.data because that produces
 *    semantically misleading records (e.g. CREATE having "oldValues").
 * 3. For CREATE actions, we store a cleaned snapshot of the created entity in
 *    newValues (extracted from the response) so admins can see what was added.
 * 4. Audit log creation is fire-and-forget: errors are caught and logged but
 *    never bubble up to the client.
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
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { AuditAction, AuditStatus, Prisma } from '@prisma/client';
import {
  AUDIT_LOG_METADATA_KEY,
  AuditLogOptions,
} from '../decorators/audit-log.decorator';
import { CHANGE_TRACKING_KEY } from './change-tracking.interceptor';

// ── Type definitions ─────────────────────────────────────────────────────

interface AuditUser {
  id?: string;
  email?: string;
  fullName?: string;
}

interface AuditRequest {
  url: string;
  method: string;
  id?: string;
  user?: AuditUser;
  headers: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  ip?: string;
  [key: string]: unknown;
}

interface ChangeTrackingData {
  filteredOldValues?: Record<string, unknown>;
  filteredNewValues?: Record<string, unknown>;
  changedFields?: string[];
}

interface AuditLogEntry {
  user?: AuditUser;
  requestId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  httpMethod: string;
  url: string;
  ipAddress: string;
  userAgent: string;
  status: AuditStatus;
  errorMessage?: string;
  duration: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields?: string[];
  resourceName?: string;
}

/** Fields that should never appear in audit snapshots (security + noise) */
const SENSITIVE_FIELDS = [
  'password',
  'hashedPassword',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'oldPassword',
  'refreshToken',
  'accessToken',
  'token',
];

/** System / timestamp fields excluded from CREATE snapshots */
const SYSTEM_FIELDS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'deletedBy',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  // ─── String helpers ──────────────────────────────────────────────────

  /** Safely truncate string to fit database column constraints */
  private truncateString(
    value: string | undefined,
    maxLength: number,
  ): string | undefined {
    if (!value) return value;
    return value.length > maxLength ? value.substring(0, maxLength) : value;
  }

  // ─── Action mapping ──────────────────────────────────────────────────

  /**
   * Centralised action map: METHOD:keyword → AuditAction.
   * The keyword is matched against the last URL segment to detect
   * approve/reject/restore/login/logout patterns automatically.
   */
  private readonly ACTION_MAP: Record<string, AuditAction> = {
    // Standard CRUD
    'POST:create': AuditAction.CREATE,
    'PUT:update': AuditAction.UPDATE,
    'PATCH:update': AuditAction.UPDATE,
    'DELETE:delete': AuditAction.DELETE,

    // RBAC specific
    'POST:assign-role': AuditAction.ASSIGN_ROLE,
    'DELETE:revoke-role': AuditAction.REVOKE_ROLE,
    'POST:grant-permission': AuditAction.GRANT_CUSTOM_PERMISSION,
    'DELETE:revoke-permission': AuditAction.REVOKE_CUSTOM_PERMISSION,
    'POST:grant-custom-permission': AuditAction.GRANT_CUSTOM_PERMISSION,
    'DELETE:revoke-custom-permission': AuditAction.REVOKE_CUSTOM_PERMISSION,

    // Auth specific
    'POST:login': AuditAction.LOGIN,
    'POST:logout': AuditAction.LOGOUT,

    // Approval workflow
    'POST:approve': AuditAction.APPROVE,
    'POST:reject': AuditAction.REJECT,
    'PATCH:approve': AuditAction.APPROVE,
    'PATCH:reject': AuditAction.REJECT,

    // Export / Import
    'GET:export': AuditAction.EXPORT,
    'POST:import': AuditAction.IMPORT,

    // Restore soft-deleted records
    'POST:restore': AuditAction.RESTORE,
    'PATCH:restore': AuditAction.RESTORE,
  };

  // ─── Main intercept logic ────────────────────────────────────────────

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditRequest>();

    // Read per-endpoint decorator config (if any)
    const auditConfig = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ── Skip rules (order matters for performance) ──
    // 1. Explicitly disabled via @AuditLog({ enabled: false })
    if (auditConfig?.enabled === false) {
      return next.handle();
    }

    // 2. Infrastructure endpoints (health, swagger, etc.)
    if (this.shouldSkipAudit(request.url, request.method)) {
      return next.handle();
    }

    // 3. GET requests are skipped UNLESS the decorator explicitly opts in.
    //    This single rule eliminates ~90% of noise in the audit table.
    if (request.method === 'GET' && !auditConfig?.action) {
      return next.handle();
    }

    const startTime = Date.now();
    const user = request.user; // Populated by JWT Guard
    const httpMethod = request.method;
    const url = request.url;
    const ipAddress = this.getIpAddress(request);
    const requestId = this.extractRequestId(request);
    const ua = request.headers['user-agent'];
    const userAgent: string = Array.isArray(ua) ? ua[0] : ua || 'Unknown';

    // Extract resource info from URL (or decorator override)
    const { resourceType, resourceId } = this.extractResourceInfo(
      url,
      auditConfig,
    );

    // Determine the semantic action (CREATE / UPDATE / DELETE / APPROVE …)
    const action = this.determineAction(httpMethod, url, auditConfig);

    return next.handle().pipe(
      tap((responseData) => {
        const duration = Date.now() - startTime;

        // Change tracking data injected by ChangeTrackingInterceptor
        const changeTracking = request[CHANGE_TRACKING_KEY] as
          | ChangeTrackingData
          | undefined;

        // Build oldValues / newValues depending on the action type
        const { oldValues, newValues, changedFields } =
          this.resolveAuditPayload(action, changeTracking, responseData);

        // For LOGIN/LOGOUT, request.user is not populated by JWT Guard
        // (the user is authenticating, no token exists yet).
        // Extract user info from the login response instead.
        let auditUser = user;
        if (
          (action === AuditAction.LOGIN || action === AuditAction.LOGOUT) &&
          !user &&
          responseData
        ) {
          const resp = responseData as Record<string, unknown>;
          const respUser = resp?.user as Record<string, unknown> | undefined;
          if (respUser) {
            const firstName = ((respUser.firstName as string) || '').trim();
            const lastName = ((respUser.lastName as string) || '').trim();
            const fullName = [firstName, lastName].filter(Boolean).join(' ');
            auditUser = {
              id: respUser.id as string,
              email: (respUser.email as string) || 'Anonymous',
              fullName: fullName || (respUser.email as string) || 'Anonymous',
            };
          }
        }

        this.createAuditLog({
          user: auditUser,
          requestId,
          action,
          resourceType,
          resourceId,
          httpMethod,
          url,
          ipAddress,
          userAgent,
          status: AuditStatus.SUCCESS,
          duration,
          oldValues,
          newValues,
          changedFields,
          resourceName: this.extractResourceName(responseData, request.body),
        }).catch((error) => {
          this.logger.error('Failed to create audit log', error);
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // For LOGIN failures, request.user won't exist — extract from body
        let failedUser = user;
        if (action === AuditAction.LOGIN && !user && request.body) {
          const bodyEmail = request.body?.email as string | undefined;
          if (bodyEmail) {
            failedUser = {
              id: undefined as unknown as string,
              email: bodyEmail,
              fullName: bodyEmail,
            };
          }
        }

        // Log the failed attempt (important for security auditing)
        this.createAuditLog({
          user: failedUser,
          requestId,
          action,
          resourceType,
          resourceId,
          httpMethod,
          url,
          ipAddress,
          userAgent,
          status: AuditStatus.FAILED,
          errorMessage: error.message,
          duration,
        }).catch((logError) => {
          this.logger.error('Failed to create audit log for error', logError);
        });

        return throwError(() => error);
      }),
    );
  }

  // ─── Payload resolution ──────────────────────────────────────────────

  /**
   * Determines what to store in oldValues / newValues based on the action type.
   *
   * Key rules:
   * - UPDATE: Use ChangeTracking data (filteredOldValues → filteredNewValues)
   * - CREATE: newValues = cleaned response snapshot, oldValues = null
   * - DELETE: oldValues = null (unless ChangeTracking captured it), newValues = null
   * - APPROVE/REJECT/RESTORE: Same as UPDATE (status field changes)
   * - LOGIN/LOGOUT: No payload
   *
   * We NEVER fall back to request.body as oldValues — that was the root cause
   * of misleading audit records in the previous implementation.
   */
  private resolveAuditPayload(
    action: AuditAction,
    changeTracking: ChangeTrackingData | undefined,
    responseData: unknown,
  ): {
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    changedFields?: string[];
  } {
    // If ChangeTrackingInterceptor ran successfully, use its precise diff
    if (
      changeTracking &&
      changeTracking.changedFields &&
      changeTracking.changedFields.length > 0
    ) {
      return {
        oldValues: changeTracking.filteredOldValues,
        newValues: changeTracking.filteredNewValues,
        changedFields: changeTracking.changedFields,
      };
    }

    // For CREATE, snapshot the newly created entity (minus sensitive/system fields)
    if (action === AuditAction.CREATE && responseData) {
      const snapshot = this.cleanSnapshot(responseData);
      if (Object.keys(snapshot).length > 0) {
        return { newValues: snapshot, changedFields: Object.keys(snapshot) };
      }
    }

    // For LOGIN/LOGOUT, extract session metadata from the response
    if (
      (action === AuditAction.LOGIN || action === AuditAction.LOGOUT) &&
      responseData
    ) {
      const loginMeta = this.extractLoginMetadata(responseData, action);
      if (Object.keys(loginMeta).length > 0) {
        return { newValues: loginMeta };
      }
    }

    // For all other cases, return empty — no misleading data
    return {};
  }

  /**
   * Creates a clean snapshot of an entity for audit storage.
   * Removes sensitive fields, system timestamps, and nested objects
   * (which could be huge relation payloads).
   */
  private cleanSnapshot(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

    const snapshot: Record<string, unknown> = {};
    const excludeSet = new Set([...SENSITIVE_FIELDS, ...SYSTEM_FIELDS]);

    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      if (excludeSet.has(key)) continue;
      // Skip nested objects/arrays (relations) to keep audit entries lean
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        // Allow plain Date objects (serialised as strings by Prisma)
        if (!(value instanceof Date)) continue;
      }
      // Skip large arrays (e.g. items[], permissions[])
      if (Array.isArray(value)) continue;
      snapshot[key] = value;
    }

    return snapshot;
  }

  /**
   * Extracts meaningful metadata from LOGIN/LOGOUT responses.
   * For LOGIN: user email, roles, session info (never tokens).
   * For LOGOUT: just a confirmation flag.
   */
  private extractLoginMetadata(
    responseData: unknown,
    action: AuditAction,
  ): Record<string, unknown> {
    const meta: Record<string, unknown> = {};
    const data = responseData as Record<string, unknown> | null;
    if (!data) return meta;

    if (action === AuditAction.LOGIN) {
      // Extract from LoginResponseDto shape: { user: { ... }, tokens: { ... } }
      const user = data.user as Record<string, unknown> | undefined;
      if (user) {
        if (user.email) meta.email = user.email;
        const fName = (user.firstName as string) || '';
        const lName = (user.lastName as string) || '';
        if (fName || lName) {
          meta.fullName = `${fName} ${lName}`.trim();
        }
        if (Array.isArray(user.roles) && user.roles.length > 0) {
          meta.roles = (user.roles as string[]).join(', ');
        }
        if (typeof user.isActive === 'boolean') {
          meta.accountActive = user.isActive;
        }
      }
      // Token metadata (never store actual tokens)
      const tokens = data.tokens as Record<string, unknown> | undefined;
      if (tokens) {
        if (tokens.expiresIn) {
          const expiry =
            typeof tokens.expiresIn === 'number'
              ? tokens.expiresIn
              : Number(tokens.expiresIn);
          meta.sessionDuration = `${expiry}s`;
        }
        if (tokens.tokenType) meta.tokenType = tokens.tokenType;
      }
      meta.loginMethod = 'credentials';
      meta.loginTime = new Date().toISOString();
    }

    if (action === AuditAction.LOGOUT) {
      meta.logoutTime = new Date().toISOString();
      meta.sessionEnded = true;
    }

    return meta;
  }

  // ─── Resource name extraction ────────────────────────────────────────

  /**
   * Extract a human-readable resource name from response or request body.
   * Tries common naming fields in priority order.
   */
  private extractResourceName(
    responseData: unknown,
    requestBody: unknown,
  ): string | undefined {
    const nameFields = ['name', 'title', 'code', 'email', 'label'];
    const response = responseData as Record<string, unknown> | null;
    const body = requestBody as Record<string, unknown> | null;

    // For nested responses (e.g. login: { user: { email: ... } })
    const nestedUser = response?.['user'] as
      | Record<string, unknown>
      | undefined;

    for (const field of nameFields) {
      const value = response?.[field] || body?.[field] || nestedUser?.[field];
      if (value && typeof value === 'string') {
        return this.truncateString(value, 500);
      }
    }
    return undefined;
  }

  // ─── Database write ──────────────────────────────────────────────────

  /**
   * Persist audit log entry. Fire-and-forget: never throws.
   */
  private async createAuditLog(data: AuditLogEntry): Promise<void> {
    try {
      const userName: string =
        data.user?.fullName || data.user?.email || 'Anonymous';

      await this.prisma.auditLog.create({
        data: {
          userId: data.user?.id,
          userEmail: this.truncateString(data.user?.email || 'Anonymous', 255),
          userName: this.truncateString(userName, 200),
          action: data.action,
          resourceType:
            this.truncateString(data.resourceType, 100) || 'unknown',
          resourceId: data.resourceId,
          resourceName: data.resourceName
            ? this.truncateString(data.resourceName, 500)
            : undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestId: this.truncateString(data.requestId, 100),
          requestMethod: this.truncateString(data.httpMethod, 10),
          requestUrl: this.truncateString(data.url, 1000),
          durationMs: data.duration,
          status: data.status,
          errorMessage: data.errorMessage,
          oldValues:
            (data.oldValues as Prisma.InputJsonValue | undefined) ?? undefined,
          newValues:
            (data.newValues as Prisma.InputJsonValue | undefined) ?? undefined,
          changedFields:
            data.changedFields && data.changedFields.length > 0
              ? data.changedFields
              : undefined,
        },
      });
    } catch (error) {
      this.logger.error('Error creating audit log', error);
      // Don't throw — audit logging must never break the user's request
    }
  }

  // ─── Skip logic ──────────────────────────────────────────────────────

  /**
   * Infrastructure endpoints that should never produce audit entries.
   */
  private shouldSkipAudit(url: string, method: string): boolean {
    // CORS preflight
    if (method === 'OPTIONS') return true;

    const skipPatterns = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/api/docs',
      '/swagger',
      '/.well-known',
    ];
    return skipPatterns.some((pattern) => url.includes(pattern));
  }

  // ─── Resource extraction ─────────────────────────────────────────────

  /**
   * Extract resource type and ID from the request URL.
   * Decorator config overrides the URL-inferred type but we always parse
   * the URL for the resource ID.
   *
   * Example: /api/v1/employees/abc-123 → { resourceType: 'employee', resourceId: 'abc-123' }
   */
  private extractResourceInfo(
    url: string,
    config?: AuditLogOptions,
  ): { resourceType: string; resourceId?: string } {
    // Strip query string for clean parsing
    const cleanUrl = url.split('?')[0];
    const urlParts = cleanUrl
      .split('/')
      .filter((part) => part && part !== 'api');

    let resourceType = 'unknown';
    let resourceId: string | undefined;

    for (let i = 0; i < urlParts.length; i++) {
      const part = urlParts[i];

      // Skip version identifiers (v1, v2, …)
      if (/^v\d+$/.test(part)) continue;

      const nextPart = urlParts[i + 1];
      if (nextPart) {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            nextPart,
          );
        const isNumericId = /^\d+$/.test(nextPart);

        if (isUuid || isNumericId) {
          resourceType = part;
          resourceId = nextPart;
          break;
        }
      }

      // Use first meaningful segment as fallback resource type
      if (resourceType === 'unknown') {
        resourceType = part;
      }
    }

    // Decorator config takes priority for resource type
    if (config?.resourceType) {
      resourceType = config.resourceType;
    } else {
      // Normalise: kebab-case → kebab-case (keep as-is), singularise trailing 's'
      if (
        resourceType.endsWith('s') &&
        !['rbac', 'status', 'address'].includes(resourceType)
      ) {
        resourceType = resourceType.slice(0, -1);
      }
    }

    return { resourceType, resourceId };
  }

  // ─── Action detection ────────────────────────────────────────────────

  /**
   * Determines the audit action from (in priority order):
   * 1. Explicit decorator action — @AuditLog({ action: APPROVE })
   * 2. URL keyword matching — /approve, /reject, /restore, /login, /logout
   * 3. HTTP method fallback — POST→CREATE, PUT→UPDATE, DELETE→DELETE
   */
  private determineAction(
    method: string,
    url: string,
    config?: AuditLogOptions,
  ): AuditAction {
    // 1. Decorator override
    if (config?.action) return config.action;

    // 2. URL keyword detection — check the last meaningful URL segment
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1]?.toLowerCase() || '';

    // Match against known action keywords in the URL
    const urlKeywordMap: Record<string, AuditAction> = {
      approve: AuditAction.APPROVE,
      reject: AuditAction.REJECT,
      restore: AuditAction.RESTORE,
      login: AuditAction.LOGIN,
      logout: AuditAction.LOGOUT,
      export: AuditAction.EXPORT,
      import: AuditAction.IMPORT,
      'assign-role': AuditAction.ASSIGN_ROLE,
      'revoke-role': AuditAction.REVOKE_ROLE,
      'grant-permission': AuditAction.GRANT_CUSTOM_PERMISSION,
      'grant-custom-permission': AuditAction.GRANT_CUSTOM_PERMISSION,
      'revoke-permission': AuditAction.REVOKE_CUSTOM_PERMISSION,
      'revoke-custom-permission': AuditAction.REVOKE_CUSTOM_PERMISSION,
    };

    if (urlKeywordMap[lastSegment]) {
      return urlKeywordMap[lastSegment];
    }

    // Also check second-to-last segment for nested patterns like :id/approve
    const secondLast = segments[segments.length - 2]?.toLowerCase() || '';
    // Only check if lastSegment looks like an ID (we might have /approve/:id)
    // but more commonly it's /:id/approve — lastSegment is "approve" already.
    // Handle pattern: /force-logout/:targetUserId (keyword is before the ID)
    if (urlKeywordMap[secondLast]) {
      return urlKeywordMap[secondLast];
    }

    // Check for compound patterns in the full URL
    for (const [keyword, action] of Object.entries(urlKeywordMap)) {
      if (segments.some((s) => s === keyword)) return action;
    }

    // 3. HTTP method fallback
    const methodMap: Record<string, AuditAction> = {
      POST: AuditAction.CREATE,
      PUT: AuditAction.UPDATE,
      PATCH: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
      GET: AuditAction.VIEW,
    };

    return methodMap[method] || AuditAction.VIEW;
  }

  // ─── IP extraction ───────────────────────────────────────────────────

  private getIpAddress(request: AuditRequest): string {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedIp =
      typeof forwarded === 'string' ? forwarded.split(',')[0] : undefined;
    return (
      forwardedIp ||
      (request.headers['x-real-ip'] as string | undefined) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'Unknown'
    );
  }

  private extractRequestId(request: AuditRequest): string | undefined {
    const fromMiddleware = request.id;
    if (
      typeof fromMiddleware === 'string' &&
      fromMiddleware.trim().length > 0
    ) {
      return fromMiddleware;
    }

    const fromHeader = request.headers['x-request-id'];
    if (typeof fromHeader === 'string' && fromHeader.trim().length > 0) {
      return fromHeader;
    }

    if (Array.isArray(fromHeader) && fromHeader[0]?.trim().length) {
      return fromHeader[0];
    }

    return undefined;
  }
}
