import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { UserEnrichmentService } from '../../../common/services/user-enrichment.service';
import { IEmployeeLoanRepository } from './index';
import { EmployeeLoanEntity } from '../entities';
import {
  CreateEmployeeLoanDto,
  UpdateEmployeeLoanDto,
  EmployeeLoanFiltersDto,
} from '../dto';
import {
  Prisma,
  LoanStatus,
  DeductionType,
  LoanRepaymentSource,
} from '@prisma/client';

type EmployeeLoanWithEmployee = Prisma.EmployeeLoanGetPayload<{
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
 * Employee Loan Repository Implementation
 * Handles all database operations for employee loans
 *
 * CRITICAL FEATURES:
 * - CRUD operations with validation
 * - Approval workflow (pending -> approved/rejected)
 * - Installment payment processing with transactions
 * - Automatic deduction creation for loan repayments
 * - Status management (PENDING → APPROVED/REJECTED → COMPLETED)
 * - COMPLETED status set automatically when last installment is paid
 * - Decimal precision for loan amounts
 *
 * TRANSACTION LOGIC:
 * - payInstallment() uses Prisma transaction to ensure atomic operations
 * - Creates EmployeeDeduction with type LOAN_REPAYMENT (auto-APPROVED)
 * - Updates paidInstallments, remainingAmount, and status (→ COMPLETED when done)
 * - COMPLETED loans are excluded from payroll queries via status filter
 */
@Injectable()
export class EmployeeLoanRepository implements IEmployeeLoanRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly userEnrichment: UserEnrichmentService,
  ) {
    this.logger.setContext(EmployeeLoanRepository.name);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new employee loan
   * IMPORTANT: Converts numbers to Prisma.Decimal for accurate storage
   */
  async create(
    data: CreateEmployeeLoanDto,
    userId: string,
  ): Promise<EmployeeLoanEntity> {
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

      // Calculate installment amount
      const installmentAmount = data.amount / data.installments;

      // Calculate end date if not provided (assuming monthly installments)
      const startDate = new Date(data.startDate);
      const endDate = data.endDate
        ? new Date(data.endDate)
        : new Date(
            startDate.setMonth(startDate.getMonth() + data.installments),
          );

      const loan = await this.prisma.employeeLoan.create({
        data: {
          employeeId: data.employeeId,
          amount: new Prisma.Decimal(data.amount),
          remainingAmount: new Prisma.Decimal(data.amount),
          installments: data.installments,
          paidInstallments: 0,
          installmentAmount: new Prisma.Decimal(installmentAmount),
          startDate: new Date(data.startDate),
          endDate: endDate,
          status: LoanStatus.PENDING,
          purpose: data.purpose,
          notes: data.notes,
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
        `Employee loan created: ${loan.id} for employee ${data.employeeId}`,
      );
      return this.mapToEntity(loan);
    } catch (error) {
      this.logger.error(`Failed to create employee loan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find employee loan by ID
   */
  async findById(id: string): Promise<EmployeeLoanEntity | null> {
    const loan = await this.prisma.employeeLoan.findUnique({
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

    if (!loan) return null;

    // Map to entity
    const entity = this.mapToEntity(loan);

    // Enrich with user data
    const [enriched] = await this.userEnrichment.enrichWithUsers(
      [entity],
      ['createdBy', 'approvedBy'],
    );

    return enriched || entity;
  }

  /**
   * Find all employee loans with filtering and pagination
   */
  async findAll(filters: EmployeeLoanFiltersDto): Promise<{
    data: EmployeeLoanEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { employeeId, status, page, limit, sortBy, sortOrder } = filters;

    // Build where clause
    const where: Prisma.EmployeeLoanWhereInput = {};

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'startDate';
    const finalSortOrder = sortOrder || 'desc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [loans, total] = await Promise.all([
      this.prisma.employeeLoan.findMany({
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
      this.prisma.employeeLoan.count({ where }),
    ]);

    // Map to entities
    const entities = loans.map((loan) => this.mapToEntity(loan));

    // Enrich with user data
    const enrichedEntities = await this.userEnrichment.enrichWithUsers(
      entities,
      ['createdBy', 'approvedBy'],
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
   * Update employee loan
   */
  async update(
    id: string,
    data: UpdateEmployeeLoanDto,
  ): Promise<EmployeeLoanEntity> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundException(`Employee loan with ID ${id} not found`);
      }

      const payloadFields = Object.keys(data).filter(
        (key) => key !== 'rowVersion',
      );

      // Only allow notes updates when loan is no longer pending.
      if (
        existing.status !== LoanStatus.PENDING &&
        payloadFields.some((key) => key !== 'notes')
      ) {
        throw new BadRequestException(
          'Can only update notes for approved loans',
        );
      }

      if (payloadFields.length === 0) {
        throw new BadRequestException('No updatable fields were provided');
      }

      // Prepare update data
      const updateData: Prisma.EmployeeLoanUpdateInput = {};
      if (data.amount !== undefined) {
        updateData.amount = new Prisma.Decimal(data.amount);
        updateData.remainingAmount = new Prisma.Decimal(data.amount);
      }
      if (data.installments !== undefined) {
        updateData.installments = data.installments;
        const amount =
          data.amount !== undefined ? data.amount : existing.amount;
        updateData.installmentAmount = new Prisma.Decimal(
          amount / data.installments,
        );
      }
      if (data.startDate !== undefined)
        updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined)
        updateData.endDate = new Date(data.endDate);
      if (data.purpose !== undefined) updateData.purpose = data.purpose;
      if (data.notes !== undefined) updateData.notes = data.notes;
      updateData.rowVersion = { increment: 1 };

      const expectedRowVersion = data.rowVersion;
      let updated: EmployeeLoanWithEmployee;
      if (expectedRowVersion !== undefined) {
        const result = await this.prisma.employeeLoan.updateMany({
          where: { id, rowVersion: expectedRowVersion },
          data: updateData,
        });

        if (result.count === 0) {
          throw new ConflictException(
            'This record was modified by another user. Please refresh and retry.',
          );
        }

        updated = await this.prisma.employeeLoan.findUniqueOrThrow({
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
        updated = await this.prisma.employeeLoan.update({
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

      this.logger.log(`Employee loan updated: ${id}`);
      return this.mapToEntity(updated);
    } catch (error) {
      this.logger.error(`Failed to update employee loan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete employee loan
   * Only PENDING or REJECTED loans can be deleted
   */
  async delete(id: string, rowVersion?: number): Promise<void> {
    try {
      const loan = await this.findById(id);
      if (!loan) {
        throw new NotFoundException(`Employee loan with ID ${id} not found`);
      }

      if (loan.status === LoanStatus.APPROVED) {
        throw new BadRequestException('Cannot delete an approved loan');
      }

      if (typeof rowVersion === 'number') {
        const result = await this.prisma.employeeLoan.deleteMany({
          where: { id, rowVersion },
        });

        if (result.count === 0) {
          throw new ConflictException(
            'Employee loan was modified by another user. Please refresh and retry.',
          );
        }
      } else {
        await this.prisma.employeeLoan.delete({
          where: { id },
        });
      }

      this.logger.log(`Employee loan deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete employee loan: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Find all loans for an employee (all statuses)
   */
  async findAllByEmployeeId(employeeId: string): Promise<EmployeeLoanEntity[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
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

    return loans.map((loan) => this.mapToEntity(loan));
  }

  /**
   * Find active (approved with remaining balance) loans for an employee
   */
  async findActiveByEmployeeId(
    employeeId: string,
  ): Promise<EmployeeLoanEntity[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: {
        employeeId,
        status: LoanStatus.APPROVED,
        remainingAmount: { gt: 0 },
      },
      orderBy: {
        startDate: 'desc',
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

    return loans.map((loan) => this.mapToEntity(loan));
  }

  /**
   * Find active loans for an employee at a specific date (month/year)
   * Used for historical payroll calculations
   *
   * A loan is considered active at a date if:
   * 1. Status is APPROVED (COMPLETED loans are fully paid — never included)
   * 2. startDate <= target month
   * 3. endDate >= target month (loan must not have ended yet)
   * 4. remainingAmount > 0 (guards against edge cases where endDate hasn't passed yet
   *    but all installments are already paid — prevents double-deducting)
   */
  async findActiveByEmployeeIdAtDate(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<EmployeeLoanEntity[]> {
    // Create date representing the first day of the target month
    const targetDate = new Date(year, month - 1, 1);

    const loans = await this.prisma.employeeLoan.findMany({
      where: {
        employeeId,
        status: LoanStatus.APPROVED,
        remainingAmount: { gt: 0 }, // Exclude fully-paid loans that still fall in date range
        // Loan must have started before or during the target month
        startDate: {
          lte: targetDate,
        },
        // Loan must not have ended before the target month
        endDate: {
          gte: targetDate,
        },
      },
      orderBy: {
        startDate: 'desc',
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

    return loans.map((loan) => this.mapToEntity(loan));
  }

  /**
   * Find all pending approval loans
   */
  async findPendingApprovals(): Promise<EmployeeLoanEntity[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: {
        status: LoanStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
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

    return loans.map((loan) => this.mapToEntity(loan));
  }

  /**
   * Find loans by status
   */
  async findByStatus(status: LoanStatus): Promise<EmployeeLoanEntity[]> {
    const loans = await this.prisma.employeeLoan.findMany({
      where: { status },
      orderBy: {
        startDate: 'desc',
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

    return loans.map((loan) => this.mapToEntity(loan));
  }

  /**
   * Get aggregate loan statistics for list KPI cards.
   * Pagination-independent by design.
   */
  async getStatistics(filters?: { employeeId?: string }): Promise<{
    total: number;
    pending: number;
    active: number;
    completed: number;
  }> {
    const where: Prisma.EmployeeLoanWhereInput = {};

    if (filters?.employeeId) where.employeeId = filters.employeeId;

    const [total, pending, active, completed] = await Promise.all([
      this.prisma.employeeLoan.count({ where }),
      this.prisma.employeeLoan.count({
        where: { ...where, status: LoanStatus.PENDING },
      }),
      this.prisma.employeeLoan.count({
        where: {
          ...where,
          status: LoanStatus.APPROVED,
          remainingAmount: { gt: 0 },
        },
      }),
      this.prisma.employeeLoan.count({
        where: { ...where, status: LoanStatus.COMPLETED },
      }),
    ]);

    return { total, pending, active, completed };
  }

  // ============================================================================
  // APPROVAL WORKFLOW OPERATIONS
  // ============================================================================

  /**
   * Approve employee loan
   * Changes status from PENDING to APPROVED
   */
  async approve(
    id: string,
    userId: string,
    notes?: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeLoanEntity> {
    const loan = await this.findById(id);
    if (!loan) {
      throw new NotFoundException(`Employee loan with ID ${id} not found`);
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException('Only pending loans can be approved');
    }

    let updated: EmployeeLoanWithEmployee;
    if (expectedRowVersion !== undefined) {
      const result = await this.prisma.employeeLoan.updateMany({
        where: { id, rowVersion: expectedRowVersion },
        data: {
          status: LoanStatus.APPROVED,
          approvedBy: userId,
          approvedAt: new Date(),
          notes: notes || loan.notes,
          rowVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'This record was modified by another user. Please refresh and retry.',
        );
      }

      updated = await this.prisma.employeeLoan.findUniqueOrThrow({
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
      updated = await this.prisma.employeeLoan.update({
        where: { id },
        data: {
          status: LoanStatus.APPROVED,
          approvedBy: userId,
          approvedAt: new Date(),
          notes: notes || loan.notes,
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

    this.logger.log(`Employee loan approved: ${id} by user ${userId}`);
    return this.mapToEntity(updated);
  }

  /**
   * Reject employee loan
   * Changes status to REJECTED
   */
  async reject(
    id: string,
    userId: string,
    reason: string,
    expectedRowVersion?: number,
  ): Promise<EmployeeLoanEntity> {
    const loan = await this.findById(id);
    if (!loan) {
      throw new NotFoundException(`Employee loan with ID ${id} not found`);
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException('Only pending loans can be rejected');
    }

    let updated: EmployeeLoanWithEmployee;
    if (expectedRowVersion !== undefined) {
      const result = await this.prisma.employeeLoan.updateMany({
        where: { id, rowVersion: expectedRowVersion },
        data: {
          status: LoanStatus.REJECTED,
          rejectedReason: reason,
          rowVersion: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'This record was modified by another user. Please refresh and retry.',
        );
      }

      updated = await this.prisma.employeeLoan.findUniqueOrThrow({
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
      updated = await this.prisma.employeeLoan.update({
        where: { id },
        data: {
          status: LoanStatus.REJECTED,
          rejectedReason: reason,
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

    this.logger.log(`Employee loan rejected: ${id} by user ${userId}`);
    return this.mapToEntity(updated);
  }

  // ============================================================================
  // PAYMENT OPERATIONS
  // ============================================================================

  /**
   * Pay loan installment
   * CRITICAL: Uses Prisma transaction to ensure atomic operations
   *
   * Process:
   * 1. Validate loan is APPROVED and has remaining installments
   * 2. Create EmployeeDeduction with type LOAN_REPAYMENT (auto-APPROVED)
   * 3. Update loan: increment paidInstallments, decrease remainingAmount
   * 4. If all installments are paid → set status to COMPLETED
   */
  async payInstallment(
    loanId: string,
    userId: string,
    paymentDate: Date,
    expectedRowVersion?: number,
    source: LoanRepaymentSource = LoanRepaymentSource.MANUAL,
  ): Promise<EmployeeLoanEntity> {
    try {
      const loan = await this.findById(loanId);
      if (!loan) {
        throw new NotFoundException(
          `Employee loan with ID ${loanId} not found`,
        );
      }

      if (loan.status !== LoanStatus.APPROVED) {
        throw new BadRequestException(
          'Only approved loans can have installments paid',
        );
      }

      if (loan.paidInstallments >= loan.installments) {
        throw new BadRequestException(
          'All installments have already been paid',
        );
      }

      // Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async (tx) => {
        let currentVersion = expectedRowVersion ?? loan.rowVersion;
        let effectiveLoan = loan;
        // Use UTC month boundaries to avoid timezone drift when clients send
        // date-only strings (e.g. "2026-04-01"), which can shift month if the
        // server timezone is behind UTC.
        const monthStart = new Date(
          Date.UTC(
            paymentDate.getUTCFullYear(),
            paymentDate.getUTCMonth(),
            1,
            0,
            0,
            0,
            0,
          ),
        );
        const monthEnd = new Date(
          Date.UTC(
            paymentDate.getUTCFullYear(),
            paymentDate.getUTCMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          ),
        );

        // If repayment already exists in this month, keep operation idempotent.
        const existingMonthlyRepayment = await tx.employeeDeduction.findFirst({
          where: {
            loanId,
            deductionType: DeductionType.LOAN_REPAYMENT,
            status: 'APPROVED',
            deletedAt: null,
            deductionDate: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          select: { id: true },
        });

        // Repair historical drift if deductions count is ahead of loan counter.
        const approvedRepaymentCount = await tx.employeeDeduction.count({
          where: {
            loanId,
            deductionType: DeductionType.LOAN_REPAYMENT,
            status: 'APPROVED',
            deletedAt: null,
          },
        });

        if (approvedRepaymentCount > effectiveLoan.paidInstallments) {
          const normalizedPaidInstallments = Math.min(
            approvedRepaymentCount,
            effectiveLoan.installments,
          );
          const normalizedRemainingAmount = Prisma.Decimal.max(
            new Prisma.Decimal(effectiveLoan.amount).minus(
              new Prisma.Decimal(effectiveLoan.installmentAmount).times(
                normalizedPaidInstallments,
              ),
            ),
            new Prisma.Decimal(0),
          );

          await tx.employeeLoan.updateMany({
            where: { id: loanId, rowVersion: currentVersion },
            data: {
              paidInstallments: normalizedPaidInstallments,
              remainingAmount: normalizedRemainingAmount,
              status:
                normalizedPaidInstallments >= effectiveLoan.installments
                  ? LoanStatus.COMPLETED
                  : LoanStatus.APPROVED,
              rowVersion: { increment: 1 },
            },
          });

          const normalizedLoan = await tx.employeeLoan.findUniqueOrThrow({
            where: { id: loanId },
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
          effectiveLoan = this.mapToEntity(normalizedLoan);
          currentVersion = effectiveLoan.rowVersion;
          this.logger.warn(
            `Loan ${loanId} repayment counters normalized from deductions history: ${approvedRepaymentCount} approved repayment(s).`,
          );
        }

        if (existingMonthlyRepayment) {
          if (source === LoanRepaymentSource.MANUAL) {
            throw new BadRequestException(
              'A loan installment has already been recorded for this month.',
            );
          }

          return tx.employeeLoan.findUniqueOrThrow({
            where: { id: loanId },
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

        const newPaidInstallments = effectiveLoan.paidInstallments + 1;
        const remaining = new Prisma.Decimal(
          effectiveLoan.remainingAmount,
        ).minus(new Prisma.Decimal(effectiveLoan.installmentAmount));
        const newRemainingAmount = remaining.isNegative()
          ? new Prisma.Decimal(0)
          : remaining;
        const isFullyPaid = newPaidInstallments >= effectiveLoan.installments;

        // Guard against concurrent updates before writing related deduction.
        const lockResult = await tx.employeeLoan.updateMany({
          where: { id: loanId, rowVersion: currentVersion },
          data: {
            paidInstallments: newPaidInstallments,
            remainingAmount: newRemainingAmount,
            ...(isFullyPaid && { status: LoanStatus.COMPLETED }),
            rowVersion: { increment: 1 },
          },
        });

        if (lockResult.count === 0) {
          throw new ConflictException(
            'This record was modified by another user. Please refresh and retry.',
          );
        }

        // 1. Create deduction for loan repayment (auto-approved)
        await tx.employeeDeduction.create({
          data: {
            employeeId: loan.employeeId,
            deductionType: DeductionType.LOAN_REPAYMENT,
            amount: new Prisma.Decimal(effectiveLoan.installmentAmount),
            deductionDate: new Date(paymentDate),
            loanId: loanId,
            repaymentSource: source,
            status: 'APPROVED',
            reason: `Loan installment payment ${effectiveLoan.paidInstallments + 1} of ${effectiveLoan.installments}`,
            approvedBy: userId,
            approvedAt: new Date(),
            createdBy: userId,
          },
        });
        return tx.employeeLoan.findUniqueOrThrow({
          where: { id: loanId },
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
      });

      this.logger.log(
        `Loan installment paid: ${loanId}, installment ${result.paidInstallments}/${result.installments}, status: ${result.status}`,
      );

      return this.mapToEntity(result);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A loan installment has already been recorded for this month.',
        );
      }

      this.logger.error(`Failed to pay loan installment: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map Prisma object to Entity
   * IMPORTANT: Converts Decimal to number for easier handling
   */
  private mapToEntity(
    prismaLoan: EmployeeLoanWithEmployee,
  ): EmployeeLoanEntity {
    return new EmployeeLoanEntity({
      id: prismaLoan.id,
      employeeId: prismaLoan.employeeId,
      amount: Number(prismaLoan.amount),
      remainingAmount: Number(prismaLoan.remainingAmount),
      installments: prismaLoan.installments,
      paidInstallments: prismaLoan.paidInstallments,
      installmentAmount: Number(prismaLoan.installmentAmount),
      startDate: prismaLoan.startDate,
      endDate: prismaLoan.endDate,
      status: prismaLoan.status,
      purpose: prismaLoan.purpose ?? undefined,
      notes: prismaLoan.notes ?? undefined,
      rowVersion: prismaLoan.rowVersion,
      approvedBy: prismaLoan.approvedBy ?? undefined,
      approvedAt: prismaLoan.approvedAt ?? undefined,
      rejectedReason: prismaLoan.rejectedReason ?? undefined,
      deletedAt: prismaLoan.deletedAt ?? undefined,
      deletedBy: prismaLoan.deletedBy ?? undefined,
      createdAt: prismaLoan.createdAt,
      updatedAt: prismaLoan.updatedAt,
      createdBy: prismaLoan.createdBy,
      employee: prismaLoan.employee,
    });
  }
}
