import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { UserEnrichmentService } from '../../../common/services/user-enrichment.service';
import { IEmployeeDeductionRepository } from './index';
import { EmployeeDeductionEntity } from '../entities';
import {
  CreateEmployeeDeductionDto,
  UpdateEmployeeDeductionDto,
  EmployeeDeductionFiltersDto,
} from '../dto';
import { Prisma, DeductionType, DeductionStatus } from '@prisma/client';

type EmployeeDeductionWithEmployee = Prisma.EmployeeDeductionGetPayload<{
  include: {
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
 * Employee Deduction Repository Implementation
 * Handles all database operations for employee deductions
 *
 * Features:
 * - CRUD operations with validation
 * - Loan repayment tracking
 * - Date range queries
 * - Deduction type aggregations
 * - Decimal precision for deduction amounts
 */
@Injectable()
export class EmployeeDeductionRepository implements IEmployeeDeductionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly userEnrichment: UserEnrichmentService,
  ) {
    this.logger.setContext(EmployeeDeductionRepository.name);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new employee deduction
   * IMPORTANT: Converts number to Prisma.Decimal for accurate storage
   */
  async create(
    data: CreateEmployeeDeductionDto,
    userId: string,
  ): Promise<EmployeeDeductionEntity> {
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

      // Validate loan if provided
      if (data.loanId) {
        const loan = await this.prisma.employeeLoan.findUnique({
          where: { id: data.loanId },
        });

        if (!loan) {
          throw new NotFoundException(
            `Employee loan with ID ${data.loanId} not found`,
          );
        }
      }

      // Auto-approve system deduction types (TAX, INSURANCE, LOAN_REPAYMENT)
      const autoApprovedTypes: DeductionType[] = [
        DeductionType.TAX,
        DeductionType.INSURANCE,
        DeductionType.LOAN_REPAYMENT,
      ];
      const isAutoApproved = autoApprovedTypes.includes(data.deductionType);

      const deduction = await this.prisma.employeeDeduction.create({
        data: {
          employeeId: data.employeeId,
          deductionType: data.deductionType,
          amount: new Prisma.Decimal(data.amount),
          deductionDate: new Date(data.deductionDate),
          loanId: data.loanId,
          reason: data.reason,
          notes: data.notes,
          status: isAutoApproved
            ? DeductionStatus.APPROVED
            : DeductionStatus.PENDING,
          approvedBy: isAutoApproved
            ? data.approvedBy || userId
            : data.approvedBy,
          approvedAt: isAutoApproved
            ? new Date()
            : data.approvedAt
              ? new Date(data.approvedAt)
              : null,
          createdBy: userId,
        },
        include: {
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
        `Employee deduction created: ${deduction.id} for employee ${data.employeeId}`,
      );
      return this.mapToEntity(deduction);
    } catch (error) {
      this.logger.error(
        `Failed to create employee deduction: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Find employee deduction by ID
   */
  async findById(id: string): Promise<EmployeeDeductionEntity | null> {
    const deduction = await this.prisma.employeeDeduction.findUnique({
      where: { id },
      include: {
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

    return deduction ? this.mapToEntity(deduction) : null;
  }

  /**
   * Find all employee deductions with filtering and pagination
   */
  async findAll(filters: EmployeeDeductionFiltersDto): Promise<{
    data: EmployeeDeductionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      employeeId,
      deductionType,
      loanId,
      status,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const where: Prisma.EmployeeDeductionWhereInput = {
      deletedAt: null, // Exclude soft-deleted records
    };

    if (employeeId) where.employeeId = employeeId;
    if (deductionType) where.deductionType = deductionType;
    if (loanId) where.loanId = loanId;
    if (status) where.status = status;

    // Date range filter
    if (startDate || endDate) {
      where.deductionDate = {};
      if (startDate) where.deductionDate.gte = new Date(startDate);
      if (endDate) where.deductionDate.lte = new Date(endDate);
    }

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'deductionDate';
    const finalSortOrder = sortOrder || 'desc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [deductions, total] = await Promise.all([
      this.prisma.employeeDeduction.findMany({
        where,
        skip,
        take: finalLimit,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
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
      this.prisma.employeeDeduction.count({ where }),
    ]);

    return {
      data: deductions.map((deduction) => this.mapToEntity(deduction)),
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages: Math.ceil(total / finalLimit),
    };
  }

  /**
   * Update employee deduction
   */
  async update(
    id: string,
    data: UpdateEmployeeDeductionDto,
  ): Promise<EmployeeDeductionEntity> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundException(
          `Employee deduction with ID ${id} not found`,
        );
      }

      // Prepare update data
      const updateData: Prisma.EmployeeDeductionUpdateInput = {};
      if (data.amount !== undefined)
        updateData.amount = new Prisma.Decimal(data.amount);
      if (data.deductionDate !== undefined)
        updateData.deductionDate = new Date(data.deductionDate);
      if (data.reason !== undefined) updateData.reason = data.reason;
      if (data.notes !== undefined) updateData.notes = data.notes;
      updateData.rowVersion = { increment: 1 };

      const expectedRowVersion = data.rowVersion;
      let updated: EmployeeDeductionWithEmployee;

      if (expectedRowVersion !== undefined) {
        const result = await this.prisma.employeeDeduction.updateMany({
          where: { id, rowVersion: expectedRowVersion },
          data: updateData,
        });

        if (result.count === 0) {
          throw new ConflictException(
            'This record was modified by another user. Please refresh and retry.',
          );
        }

        updated = await this.prisma.employeeDeduction.findUniqueOrThrow({
          where: { id },
          include: {
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
      } else {
        updated = await this.prisma.employeeDeduction.update({
          where: { id },
          data: updateData,
          include: {
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
      }

      this.logger.log(`Employee deduction updated: ${id}`);
      return this.mapToEntity(updated);
    } catch (error) {
      this.logger.error(
        `Failed to update employee deduction: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete employee deduction (Soft Delete)
   * Sets deletedAt and deletedBy instead of removing from database
   */
  async delete(
    id: string,
    userId?: string,
    rowVersion?: number,
  ): Promise<void> {
    try {
      const deduction = await this.findById(id);
      if (!deduction) {
        throw new NotFoundException(
          `Employee deduction with ID ${id} not found`,
        );
      }

      if (typeof rowVersion === 'number') {
        const result = await this.prisma.employeeDeduction.updateMany({
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
            'Employee deduction was modified by another user. Please refresh and retry.',
          );
        }
      } else {
        await this.prisma.employeeDeduction.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
            rowVersion: { increment: 1 },
          },
        });
      }

      this.logger.log(
        `Employee deduction soft deleted: ${id} by user ${userId || 'system'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete employee deduction: ${error.message}`,
      );
      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Find all deductions for an employee
   */
  async findByEmployeeId(
    employeeId: string,
  ): Promise<EmployeeDeductionEntity[]> {
    const deductions = await this.prisma.employeeDeduction.findMany({
      where: { employeeId, deletedAt: null },
      orderBy: {
        deductionDate: 'desc',
      },
      include: {
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

    return deductions.map((deduction) => this.mapToEntity(deduction));
  }

  /**
   * Find all deductions for a specific loan
   */
  async findByLoanId(loanId: string): Promise<EmployeeDeductionEntity[]> {
    const deductions = await this.prisma.employeeDeduction.findMany({
      where: { loanId, deletedAt: null },
      orderBy: {
        deductionDate: 'asc',
      },
      include: {
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

    return deductions.map((deduction) => this.mapToEntity(deduction));
  }

  /**
   * Find deductions within a date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    employeeId?: string,
  ): Promise<EmployeeDeductionEntity[]> {
    const where: Prisma.EmployeeDeductionWhereInput = {
      deductionDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: DeductionStatus.APPROVED,
      deletedAt: null,
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const deductions = await this.prisma.employeeDeduction.findMany({
      where,
      orderBy: {
        deductionDate: 'desc',
      },
      include: {
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

    return deductions.map((deduction) => this.mapToEntity(deduction));
  }

  /**
   * Get total deductions by type for an employee
   */
  async getTotalByType(
    employeeId: string,
    deductionType: DeductionType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const where: Prisma.EmployeeDeductionWhereInput = {
      employeeId,
      deductionType,
      status: DeductionStatus.APPROVED,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.deductionDate = {};
      if (startDate) where.deductionDate.gte = new Date(startDate);
      if (endDate) where.deductionDate.lte = new Date(endDate);
    }

    const deductions = await this.prisma.employeeDeduction.findMany({
      where,
      select: {
        amount: true,
      },
    });

    const total = deductions.reduce(
      (sum, deduction) => sum + Number(deduction.amount),
      0,
    );

    return total;
  }

  /**
   * Approve an employee deduction
   * Sets approvedBy and approvedAt fields
   */
  async approve(
    id: string,
    userId: string,
    notes?: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeDeductionEntity> {
    let deduction: EmployeeDeductionWithEmployee;
    if (expectedRowVersion !== undefined) {
      const result = await this.prisma.employeeDeduction.updateMany({
        where: { id, rowVersion: expectedRowVersion },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          notes: notes || undefined,
          rowVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'This record was modified by another user. Please refresh and retry.',
        );
      }

      deduction = await this.prisma.employeeDeduction.findUniqueOrThrow({
        where: { id },
        include: {
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
    } else {
      deduction = await this.prisma.employeeDeduction.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          notes: notes || undefined,
          rowVersion: { increment: 1 },
        },
        include: {
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
    }

    this.logger.log(`Employee deduction approved: ${id} by user ${userId}`);
    return this.mapToEntity(deduction);
  }

  /**
   * Reject an employee deduction
   * Sets status to REJECTED with reason
   */
  async reject(
    id: string,
    userId: string,
    rejectionReason: string,
    expectedRowVersion?: number,
  ): Promise<void> {
    this.logger.log(
      `Employee deduction rejected: ${id} by user ${userId}. Reason: ${rejectionReason}`,
    );

    if (expectedRowVersion !== undefined) {
      const result = await this.prisma.employeeDeduction.updateMany({
        where: { id, rowVersion: expectedRowVersion },
        data: {
          status: 'REJECTED',
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectedReason: rejectionReason,
          rowVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'This record was modified by another user. Please refresh and retry.',
        );
      }
      return;
    }

    await this.prisma.employeeDeduction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectedReason: rejectionReason,
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * Unapprove an employee deduction
   * Resets status to PENDING
   * Only allowed if salary has not been paid
   */
  async unapprove(
    id: string,
    notes?: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeDeductionEntity> {
    let deduction: EmployeeDeductionWithEmployee;
    if (expectedRowVersion !== undefined) {
      const result = await this.prisma.employeeDeduction.updateMany({
        where: { id, rowVersion: expectedRowVersion },
        data: {
          status: 'PENDING',
          approvedBy: null,
          approvedAt: null,
          notes: notes || undefined,
          rowVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'This record was modified by another user. Please refresh and retry.',
        );
      }

      deduction = await this.prisma.employeeDeduction.findUniqueOrThrow({
        where: { id },
        include: {
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
    } else {
      deduction = await this.prisma.employeeDeduction.update({
        where: { id },
        data: {
          status: 'PENDING',
          approvedBy: null,
          approvedAt: null,
          notes: notes || undefined,
          rowVersion: { increment: 1 },
        },
        include: {
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
    }

    this.logger.log(`Employee deduction unapproved: ${id}`);
    return this.mapToEntity(deduction);
  }

  /**
   * Restore a soft-deleted employee deduction
   * Sets deletedAt and deletedBy to null
   * Only accessible to SUPERADMIN
   */
  async restore(id: string): Promise<EmployeeDeductionEntity> {
    try {
      // First check if the deduction exists (including deleted ones)
      const existing = await this.prisma.employeeDeduction.findFirst({
        where: { id },
        include: {
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

      if (!existing) {
        throw new NotFoundException(
          `Employee deduction with ID ${id} not found`,
        );
      }

      if (!existing.deletedAt) {
        throw new BadRequestException(
          `Employee deduction with ID ${id} is not deleted`,
        );
      }

      const deduction = await this.prisma.employeeDeduction.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedBy: null,
          rowVersion: { increment: 1 },
        },
        include: {
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

      this.logger.log(`Employee deduction restored: ${id}`);
      return this.mapToEntity(deduction);
    } catch (error) {
      this.logger.error(
        `Failed to restore employee deduction: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Find all soft-deleted employee deductions
   * Only accessible to SUPERADMIN
   */
  async findDeleted(filters: EmployeeDeductionFiltersDto): Promise<{
    data: EmployeeDeductionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      employeeId,
      deductionType,
      loanId,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause - ONLY deleted records
    const where: Prisma.EmployeeDeductionWhereInput = {
      deletedAt: { not: null },
    };

    if (employeeId) where.employeeId = employeeId;
    if (deductionType) where.deductionType = deductionType;
    if (loanId) where.loanId = loanId;

    // Date range filter
    if (startDate || endDate) {
      where.deductionDate = {};
      if (startDate) where.deductionDate.gte = new Date(startDate);
      if (endDate) where.deductionDate.lte = new Date(endDate);
    }

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'deletedAt';
    const finalSortOrder = sortOrder || 'desc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [deductions, total] = await Promise.all([
      this.prisma.employeeDeduction.findMany({
        where,
        skip,
        take: finalLimit,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
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
      this.prisma.employeeDeduction.count({ where }),
    ]);

    // Map to entities
    const entities = deductions.map((deduction) => this.mapToEntity(deduction));

    // Enrich with user data for audit fields
    const enrichedEntities = await this.userEnrichment.enrichWithUsers(
      entities,
      ['createdBy', 'deletedBy', 'approvedBy', 'rejectedBy'],
    );

    return {
      data: enrichedEntities,
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages: Math.ceil(total / finalLimit),
    };
  }

  /**
   * Get aggregate deduction statistics for list KPI cards.
   * Pagination-independent by design.
   */
  async getStatistics(filters?: {
    employeeId?: string;
    deductionType?: DeductionType;
    loanId?: string;
  }): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const where: Prisma.EmployeeDeductionWhereInput = {
      deletedAt: null,
    };

    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.deductionType) where.deductionType = filters.deductionType;
    if (filters?.loanId) where.loanId = filters.loanId;

    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.employeeDeduction.count({ where }),
      this.prisma.employeeDeduction.count({
        where: { ...where, status: DeductionStatus.PENDING },
      }),
      this.prisma.employeeDeduction.count({
        where: { ...where, status: DeductionStatus.APPROVED },
      }),
      this.prisma.employeeDeduction.count({
        where: { ...where, status: DeductionStatus.REJECTED },
      }),
    ]);

    return { total, pending, approved, rejected };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map Prisma object to Entity
   * IMPORTANT: Converts Decimal to number for easier handling
   */
  private mapToEntity(
    prismaDeduction: EmployeeDeductionWithEmployee,
  ): EmployeeDeductionEntity {
    return new EmployeeDeductionEntity({
      id: prismaDeduction.id,
      employeeId: prismaDeduction.employeeId,
      deductionType: prismaDeduction.deductionType,
      amount: Number(prismaDeduction.amount),
      deductionDate: prismaDeduction.deductionDate,
      loanId: prismaDeduction.loanId ?? undefined,
      repaymentSource: prismaDeduction.repaymentSource ?? undefined,
      reason: prismaDeduction.reason ?? undefined,
      notes: prismaDeduction.notes ?? undefined,
      status: prismaDeduction.status,
      rowVersion: prismaDeduction.rowVersion,
      approvedBy: prismaDeduction.approvedBy ?? undefined,
      approvedAt: prismaDeduction.approvedAt ?? undefined,
      rejectedBy: prismaDeduction.rejectedBy ?? undefined,
      rejectedAt: prismaDeduction.rejectedAt ?? undefined,
      rejectedReason: prismaDeduction.rejectedReason ?? undefined,
      deletedAt: prismaDeduction.deletedAt ?? undefined,
      deletedBy: prismaDeduction.deletedBy ?? undefined,
      createdAt: prismaDeduction.createdAt,
      createdBy: prismaDeduction.createdBy,
      employee: prismaDeduction.employee,
    });
  }
}
