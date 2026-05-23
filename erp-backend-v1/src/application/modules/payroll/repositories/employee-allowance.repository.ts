import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { UserEnrichmentService } from '../../../common/services/user-enrichment.service';
import { IEmployeeAllowanceRepository } from './index';
import { EmployeeAllowanceEntity, AllowanceTypeEntity } from '../entities';
import {
  CreateEmployeeAllowanceDto,
  UpdateEmployeeAllowanceDto,
  EmployeeAllowanceFiltersDto,
} from '../dto';
import { AllowanceFrequency, Prisma } from '@prisma/client';

type EmployeeAllowanceWithRelations = Prisma.EmployeeAllowanceGetPayload<{
  include: {
    allowanceType: true;
    employee: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        employeeNumber: true;
      };
    };
  };
}>;

/**
 * Employee Allowance Repository Implementation
 * Handles all database operations for employee allowances
 *
 * Features:
 * - CRUD operations with validation
 * - Approval workflow (pending -> approved/rejected)
 * - Active allowance tracking
 * - Effective date management
 * - Decimal precision for allowance amounts
 */
@Injectable()
export class EmployeeAllowanceRepository implements IEmployeeAllowanceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly userEnrichment: UserEnrichmentService,
  ) {
    this.logger.setContext(EmployeeAllowanceRepository.name);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new employee allowance
   * IMPORTANT: Converts number to Prisma.Decimal for accurate storage
   */
  async create(
    data: CreateEmployeeAllowanceDto,
    userId: string,
  ): Promise<EmployeeAllowanceEntity> {
    try {
      // Validate employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: data.employeeId },
      });

      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${data.employeeId} not found`,
        );
      }

      // Validate allowance type exists
      const allowanceType = await this.prisma.allowanceType.findUnique({
        where: { id: data.allowanceTypeId },
      });

      if (!allowanceType) {
        throw new NotFoundException(
          `Allowance type with ID ${data.allowanceTypeId} not found`,
        );
      }

      if (!allowanceType.isActive) {
        throw new BadRequestException(
          'Cannot assign an inactive allowance type',
        );
      }

      if (data.amount === undefined || data.amount <= 0) {
        throw new BadRequestException(
          'Allowance amount must be greater than zero',
        );
      }

      const allowance = await this.prisma.employeeAllowance.create({
        data: {
          employeeId: data.employeeId,
          allowanceTypeId: data.allowanceTypeId,
          amount: new Prisma.Decimal(data.amount),
          frequency: data.frequency,
          effectiveFrom: new Date(data.effectiveFrom),
          effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
          status: 'PENDING', // All new allowances start as PENDING
          notes: data.notes,
          createdBy: userId,
        },
        include: {
          allowanceType: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
            },
          },
        },
      });

      this.logger.log(
        `Employee allowance created: ${allowance.id} for employee ${data.employeeId}`,
      );
      return this.mapToEntity(allowance);
    } catch (error) {
      this.logger.error(
        `Failed to create employee allowance: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Find employee allowance by ID (excludes soft-deleted)
   */
  async findById(id: string): Promise<EmployeeAllowanceEntity | null> {
    const allowance = await this.prisma.employeeAllowance.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });

    return allowance ? this.mapToEntity(allowance) : null;
  }

  /**
   * Find all employee allowances with filtering and pagination
   */
  async findAll(filters: EmployeeAllowanceFiltersDto): Promise<{
    data: EmployeeAllowanceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      employeeId,
      allowanceTypeId,
      frequency,
      isActive,
      isApproved,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const where: Prisma.EmployeeAllowanceWhereInput = {
      deletedAt: null, // Exclude soft-deleted allowances
    };

    if (employeeId) where.employeeId = employeeId;
    if (allowanceTypeId) where.allowanceTypeId = allowanceTypeId;
    if (frequency) where.frequency = frequency;
    if (isActive !== undefined) {
      const now = new Date();
      if (isActive) {
        where.status = 'APPROVED';
        where.effectiveFrom = { lte: now };
        where.OR = [{ effectiveTo: null }, { effectiveTo: { gte: now } }];
      } else {
        where.OR = [
          { status: { not: 'APPROVED' } },
          { effectiveFrom: { gt: now } },
          { effectiveTo: { lt: now } },
        ];
      }
    }

    // Approval status filter
    if (isApproved !== undefined) {
      if (isApproved) {
        where.approvedBy = { not: null };
      } else {
        where.approvedBy = null;
      }
    }

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'effectiveFrom';
    const finalSortOrder = sortOrder || 'desc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [allowances, total] = await Promise.all([
      this.prisma.employeeAllowance.findMany({
        where,
        skip,
        take: finalLimit,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
          allowanceType: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
            },
          },
        },
      }),
      this.prisma.employeeAllowance.count({ where }),
    ]);

    return {
      data: allowances.map((allowance) => this.mapToEntity(allowance)),
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages: Math.ceil(total / finalLimit),
    };
  }

  /**
   * Update employee allowance
   */
  async update(
    id: string,
    data: UpdateEmployeeAllowanceDto,
  ): Promise<EmployeeAllowanceEntity> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundException(
          `Employee allowance with ID ${id} not found`,
        );
      }

      // Prepare update data
      const updateData: Prisma.EmployeeAllowanceUpdateInput = {};
      if (data.amount !== undefined)
        updateData.amount = new Prisma.Decimal(data.amount);
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.effectiveFrom !== undefined)
        updateData.effectiveFrom = new Date(data.effectiveFrom);
      if (data.effectiveTo !== undefined)
        updateData.effectiveTo = data.effectiveTo
          ? new Date(data.effectiveTo)
          : null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      updateData.rowVersion = { increment: 1 };

      if (typeof data.rowVersion === 'number') {
        const result = await this.prisma.employeeAllowance.updateMany({
          where: {
            id,
            rowVersion: data.rowVersion,
            deletedAt: null,
          },
          data: updateData,
        });

        if (result.count === 0) {
          throw new ConflictException(
            'Employee allowance was modified by another user. Please refresh and retry.',
          );
        }
      } else {
        await this.prisma.employeeAllowance.update({
          where: { id },
          data: updateData,
        });
      }

      const updated = await this.prisma.employeeAllowance.findUnique({
        where: { id },
        include: {
          allowanceType: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
            },
          },
        },
      });

      if (!updated || updated.deletedAt) {
        throw new NotFoundException(
          `Employee allowance with ID ${id} not found`,
        );
      }

      this.logger.log(`Employee allowance updated: ${id}`);
      return this.mapToEntity(updated);
    } catch (error) {
      this.logger.error(
        `Failed to update employee allowance: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Soft delete employee allowance
   */
  async delete(
    id: string,
    userId?: string,
    rowVersion?: number,
  ): Promise<void> {
    try {
      const allowance = await this.findById(id);
      if (!allowance) {
        throw new NotFoundException(
          `Employee allowance with ID ${id} not found`,
        );
      }

      if (typeof rowVersion === 'number') {
        const result = await this.prisma.employeeAllowance.updateMany({
          where: {
            id,
            rowVersion,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
            rowVersion: { increment: 1 },
          },
        });

        if (result.count === 0) {
          throw new ConflictException(
            'Employee allowance was modified by another user. Please refresh and retry.',
          );
        }
      } else {
        await this.prisma.employeeAllowance.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
            rowVersion: { increment: 1 },
          },
        });
      }

      this.logger.log(`Employee allowance soft deleted: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete employee allowance: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Restore a soft-deleted employee allowance
   */
  async restore(id: string): Promise<EmployeeAllowanceEntity> {
    try {
      // Find including soft-deleted
      const existing = await this.prisma.employeeAllowance.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Employee allowance with ID ${id} not found`,
        );
      }

      if (!existing.deletedAt) {
        throw new BadRequestException(
          `Employee allowance with ID ${id} is not deleted`,
        );
      }

      const restored = await this.prisma.employeeAllowance.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: null,
          rowVersion: { increment: 1 },
        },
        include: {
          allowanceType: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
            },
          },
        },
      });

      this.logger.log(`Employee allowance restored: ${id}`);
      return this.mapToEntity(restored);
    } catch (error) {
      this.logger.error(
        `Failed to restore employee allowance: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Find all soft-deleted employee allowances
   */
  async findDeleted(filters: EmployeeAllowanceFiltersDto): Promise<{
    data: EmployeeAllowanceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      employeeId,
      allowanceTypeId,
      frequency,
      isActive,
      isApproved,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause for deleted only
    const where: Prisma.EmployeeAllowanceWhereInput = {
      deletedAt: { not: null },
    };

    if (employeeId) where.employeeId = employeeId;
    if (allowanceTypeId) where.allowanceTypeId = allowanceTypeId;
    if (frequency) where.frequency = frequency;
    if (isActive !== undefined) {
      const now = new Date();
      if (isActive) {
        where.status = 'APPROVED';
        where.effectiveFrom = { lte: now };
        where.OR = [{ effectiveTo: null }, { effectiveTo: { gte: now } }];
      } else {
        where.OR = [
          { status: { not: 'APPROVED' } },
          { effectiveFrom: { gt: now } },
          { effectiveTo: { lt: now } },
        ];
      }
    }

    // Approval status filter
    if (isApproved !== undefined) {
      if (isApproved) {
        where.approvedBy = { not: null };
      } else {
        where.approvedBy = null;
      }
    }

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'deletedAt';
    const finalSortOrder = sortOrder || 'desc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [allowances, total] = await Promise.all([
      this.prisma.employeeAllowance.findMany({
        where,
        skip,
        take: finalLimit,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
          allowanceType: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeNumber: true,
            },
          },
        },
      }),
      this.prisma.employeeAllowance.count({ where }),
    ]);

    // Map to entities
    const entities = allowances.map((allowance) => this.mapToEntity(allowance));

    // Enrich with user data for audit fields
    const enrichedEntities = await this.userEnrichment.enrichWithUsers(
      entities,
      ['createdBy', 'deletedBy', 'approvedBy', 'rejectedBy'],
    );

    const totalPages = Math.ceil(total / finalLimit);

    return {
      data: enrichedEntities,
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages,
    };
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Find all allowances for an employee (any status)
   */
  async findByEmployeeId(
    employeeId: string,
  ): Promise<EmployeeAllowanceEntity[]> {
    const allowances = await this.prisma.employeeAllowance.findMany({
      where: {
        employeeId,
        deletedAt: null,
      },
      orderBy: [{ createdAt: 'desc' }, { effectiveFrom: 'desc' }],
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });

    return allowances.map((allowance) => this.mapToEntity(allowance));
  }

  /**
   * Find active allowances for an employee
   */
  async findActiveByEmployeeId(
    employeeId: string,
  ): Promise<EmployeeAllowanceEntity[]> {
    const now = new Date();

    const allowances = await this.prisma.employeeAllowance.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        deletedAt: null,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });

    return allowances.map((allowance) => this.mapToEntity(allowance));
  }

  /**
   * Find active allowances for an employee at a specific date (month/year)
   * Used for historical payroll calculations
   *
   * Two different rules depending on frequency:
   *
   * Recurring (MONTHLY / QUARTERLY / ANNUALLY / DAILY / WEEKLY):
   *   - effectiveFrom <= first day of target month  (started on or before this month)
   *   - effectiveTo is null OR effectiveTo >= first day of target month  (not yet expired)
   *
   * ONE_TIME:
   *   - effectiveFrom falls anywhere within the target month
   *     (effectiveTo is auto-set to last day of effectiveFrom month, so we only
   *      need to check that effectiveFrom is in [monthStart, monthEnd])
   *   - This handles the case where a ONE_TIME allowance is created mid-month
   *     (e.g. effectiveFrom = 15 March) and must still appear in March payroll.
   */
  async findActiveByEmployeeIdAtDate(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<EmployeeAllowanceEntity[]> {
    const monthStart = new Date(year, month - 1, 1); // e.g. 2026-03-01
    const monthEnd = new Date(year, month, 0); // e.g. 2026-03-31

    const allowances = await this.prisma.employeeAllowance.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        deletedAt: null,
        OR: [
          // ── Recurring allowances ──────────────────────────────────────────
          // Started on or before the first of this month and not yet expired
          {
            frequency: { not: AllowanceFrequency.ONE_TIME },
            effectiveFrom: { lte: monthStart },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
          },
          // ── ONE_TIME allowances ───────────────────────────────────────────
          // effectiveFrom falls anywhere within the target month
          // (works whether the allowance was created on the 1st or the 28th)
          {
            frequency: AllowanceFrequency.ONE_TIME,
            effectiveFrom: { gte: monthStart, lte: monthEnd },
          },
        ],
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });

    return allowances.map((allowance) => this.mapToEntity(allowance));
  }

  /**
   * Find all pending approval allowances
   */
  async findPendingApprovals(): Promise<EmployeeAllowanceEntity[]> {
    const allowances = await this.prisma.employeeAllowance.findMany({
      where: {
        approvedBy: null,
        status: 'PENDING',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });

    return allowances.map((allowance) => this.mapToEntity(allowance));
  }

  /**
   * Get aggregate allowance-assignment statistics for list KPI cards.
   * Pagination-independent by design.
   */
  async getStatistics(filters?: {
    employeeId?: string;
    allowanceTypeId?: string;
    frequency?: string;
  }): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const where: Prisma.EmployeeAllowanceWhereInput = {
      deletedAt: null,
    };

    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.allowanceTypeId)
      where.allowanceTypeId = filters.allowanceTypeId;
    if (
      filters?.frequency &&
      Object.values(AllowanceFrequency).includes(
        filters.frequency as AllowanceFrequency,
      )
    ) {
      where.frequency = filters.frequency as AllowanceFrequency;
    }

    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.employeeAllowance.count({ where }),
      this.prisma.employeeAllowance.count({
        where: { ...where, status: 'PENDING' },
      }),
      this.prisma.employeeAllowance.count({
        where: { ...where, status: 'APPROVED' },
      }),
      this.prisma.employeeAllowance.count({
        where: { ...where, status: 'REJECTED' },
      }),
    ]);

    return { total, pending, approved, rejected };
  }

  // ============================================================================
  // APPROVAL WORKFLOW OPERATIONS
  // ============================================================================

  /**
   * Approve employee allowance
   */
  async approve(
    id: string,
    userId: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeAllowanceEntity> {
    const allowance = await this.findById(id);
    if (!allowance) {
      throw new NotFoundException(`Employee allowance with ID ${id} not found`);
    }

    if (allowance.approvedBy) {
      throw new BadRequestException('Allowance has already been approved');
    }

    if (typeof expectedRowVersion === 'number') {
      const result = await this.prisma.employeeAllowance.updateMany({
        where: {
          id,
          rowVersion: expectedRowVersion,
          deletedAt: null,
        },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          rowVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Employee allowance was modified by another user. Please refresh and retry.',
        );
      }
    } else {
      await this.prisma.employeeAllowance.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          rowVersion: { increment: 1 },
        },
      });
    }

    const updated = await this.prisma.employeeAllowance.findUnique({
      where: { id },
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });

    if (!updated || updated.deletedAt) {
      throw new NotFoundException(`Employee allowance with ID ${id} not found`);
    }

    this.logger.log(
      `Employee allowance approved: ${id} by user ${userId}, status: APPROVED`,
    );
    return this.mapToEntity(updated);
  }

  /**
   * Reject employee allowance
   */
  async reject(
    id: string,
    userId: string,
    reason: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeAllowanceEntity> {
    const allowance = await this.findById(id);
    if (!allowance) {
      throw new NotFoundException(`Employee allowance with ID ${id} not found`);
    }

    if (allowance.approvedBy) {
      throw new BadRequestException('Allowance has already been processed');
    }

    if (typeof expectedRowVersion === 'number') {
      const result = await this.prisma.employeeAllowance.updateMany({
        where: {
          id,
          rowVersion: expectedRowVersion,
          deletedAt: null,
        },
        data: {
          status: 'REJECTED',
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectedReason: reason,
          rowVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Employee allowance was modified by another user. Please refresh and retry.',
        );
      }
    } else {
      await this.prisma.employeeAllowance.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectedReason: reason,
          rowVersion: { increment: 1 },
        },
      });
    }

    const updated = await this.prisma.employeeAllowance.findUnique({
      where: { id },
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeNumber: true,
          },
        },
      },
    });

    if (!updated || updated.deletedAt) {
      throw new NotFoundException(`Employee allowance with ID ${id} not found`);
    }

    this.logger.log(`Employee allowance rejected: ${id} by user ${userId}`);
    return this.mapToEntity(updated);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map Prisma object to Entity
   * IMPORTANT: Converts Decimal to number for easier handling
   */
  private mapToEntity(
    prismaAllowance: EmployeeAllowanceWithRelations,
  ): EmployeeAllowanceEntity {
    return new EmployeeAllowanceEntity({
      id: prismaAllowance.id,
      employeeId: prismaAllowance.employeeId,
      allowanceTypeId: prismaAllowance.allowanceTypeId,
      amount: Number(prismaAllowance.amount),
      frequency: prismaAllowance.frequency,
      effectiveFrom: prismaAllowance.effectiveFrom,
      effectiveTo: prismaAllowance.effectiveTo ?? undefined,
      status: prismaAllowance.status,
      approvedBy: prismaAllowance.approvedBy ?? undefined,
      approvedAt: prismaAllowance.approvedAt ?? undefined,
      rejectedBy: prismaAllowance.rejectedBy ?? undefined,
      rejectedAt: prismaAllowance.rejectedAt ?? undefined,
      rejectionReason: prismaAllowance.rejectedReason ?? undefined,
      deletedAt: prismaAllowance.deletedAt ?? undefined,
      deletedBy: prismaAllowance.deletedBy ?? undefined,
      notes: prismaAllowance.notes ?? undefined,
      createdAt: prismaAllowance.createdAt,
      updatedAt: prismaAllowance.updatedAt,
      createdBy: prismaAllowance.createdBy,
      rowVersion: prismaAllowance.rowVersion,
      allowanceType: prismaAllowance.allowanceType
        ? new AllowanceTypeEntity({
            ...prismaAllowance.allowanceType,
            description: prismaAllowance.allowanceType.description ?? undefined,
            defaultAmount:
              prismaAllowance.allowanceType.defaultAmount !== null &&
              prismaAllowance.allowanceType.defaultAmount !== undefined
                ? Number(prismaAllowance.allowanceType.defaultAmount)
                : undefined,
          })
        : undefined,
      employee: prismaAllowance.employee,
    });
  }
}
