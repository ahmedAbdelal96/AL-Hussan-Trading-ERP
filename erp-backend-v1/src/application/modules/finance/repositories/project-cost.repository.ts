import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  IProjectCostRepository,
  ProjectCostListResult,
} from './project-cost.repository.interface';
import { ProjectCostEntity } from '../entities';
import {
  CreateProjectCostDto,
  UpdateProjectCostDto,
  ProjectCostFiltersDto,
  ProjectCostSummaryDto,
} from '../dto';
import { CostType, PaymentStatus, Prisma } from '@prisma/client';
import { CostAllocationRepository } from './cost-allocation.repository';
import { CostAllocationValidatorService } from '../services/cost-allocation-validator.service';
import {
  DEFAULT_ACCOUNTING_COST_STATUSES,
  isIncludedInDefaultCostTotals,
} from '../utils/cost-accounting-status.util';

/**
 * Project Cost Repository Implementation
 * Handles all database operations for project costs
 *
 * CRITICAL: Uses Prisma Decimal type for precise financial calculations
 * All amounts are stored as Decimal(12,2) to prevent rounding errors
 *
 * Supports 3 Cost Types:
 * 1. Single Project Cost: projectId is set, isAllocated = false
 * 2. General Expense: projectId is null, isAllocated = false
 * 3. Allocated Cost: projectId is null, isAllocated = true, has allocations
 *
 * Features:
 * - Full CRUD operations with validation
 * - Cost allocation across multiple projects
 * - Approval workflow (pending -> approved/rejected -> paid)
 * - Payment tracking with status management
 * - Comprehensive cost analytics and summaries
 * - Reference linking (polymorphic associations)
 * - Precise decimal handling for financial accuracy
 */
@Injectable()
export class ProjectCostRepository implements IProjectCostRepository {
  private static readonly NON_PENDING_ALLOWED_UPDATE_FIELDS = new Set<
    keyof UpdateProjectCostDto
  >(['paymentStatus', 'paidDate', 'paymentMethod', 'paymentReference']);

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly allocationRepository: CostAllocationRepository,
    private readonly allocationValidator: CostAllocationValidatorService,
  ) {
    this.logger.setContext(ProjectCostRepository.name);
  }

  private isAllowedPaymentStatusTransition(
    current: PaymentStatus,
    next: PaymentStatus,
  ): boolean {
    if (current === next) {
      return true;
    }

    // Approval queue records must move via explicit approve/reject endpoints.
    if (current === PaymentStatus.PENDING) {
      return false;
    }

    // Approved records can progress through payment lifecycle.
    if (current === PaymentStatus.APPROVED) {
      const allowed: PaymentStatus[] = [
        PaymentStatus.PARTIALLY_PAID,
        PaymentStatus.PAID,
        PaymentStatus.OVERDUE,
      ];
      return allowed.includes(next);
    }

    // Late/partial states can settle to PAID or move between each other.
    if (current === PaymentStatus.PARTIALLY_PAID) {
      const allowed: PaymentStatus[] = [
        PaymentStatus.PAID,
        PaymentStatus.OVERDUE,
      ];
      return allowed.includes(next);
    }
    if (current === PaymentStatus.OVERDUE) {
      const allowed: PaymentStatus[] = [
        PaymentStatus.PAID,
        PaymentStatus.PARTIALLY_PAID,
      ];
      return allowed.includes(next);
    }

    // Rejected / paid are terminal for status updates.
    return false;
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calculates tax split while preserving backward-compatible `amount` semantics:
   * `amount` remains the final total, and we derive before-tax/tax values from it.
   */
  private calculateTaxBreakdown(totalAmount: number, taxRateInput?: number) {
    const taxRate = this.roundMoney(Math.max(0, taxRateInput ?? 0));
    if (taxRate <= 0) {
      return {
        amount: this.roundMoney(totalAmount),
        amountBeforeTax: this.roundMoney(totalAmount),
        taxRate: 0,
        taxAmount: 0,
      };
    }

    const divisor = 1 + taxRate / 100;
    const amountBeforeTax = this.roundMoney(totalAmount / divisor);
    const taxAmount = this.roundMoney(totalAmount - amountBeforeTax);

    return {
      amount: this.roundMoney(totalAmount),
      amountBeforeTax,
      taxRate,
      taxAmount,
    };
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new project cost entry
   *
   * Supports 3 types:
   * 1. Single Project Cost: projectId provided, allocations empty
   * 2. General Expense: no projectId, no allocations
   * 3. Allocated Cost: no projectId, allocations array provided
   *
   * IMPORTANT:
   * - Converts number to Prisma.Decimal for accurate storage
   * - Uses transaction for allocated costs (cost + allocations)
   * - Validates allocations sum = 100% or sum = total amount
   */
  async create(
    data: CreateProjectCostDto,
    userId: string,
  ): Promise<ProjectCostEntity> {
    try {
      const taxBreakdown = this.calculateTaxBreakdown(data.amount, data.taxRate);

      // Determine cost type
      const hasProjectId = !!data.projectId;
      const hasAllocations = data.allocations && data.allocations.length > 0;
      const isAllocated = hasAllocations;

      // Validation: Cannot have both projectId AND allocations
      if (hasProjectId && hasAllocations) {
        throw new BadRequestException(
          'Cannot provide both projectId and allocations. Use projectId for single project costs, or allocations for multi-project costs.',
        );
      }

      // Validate single project exists (if provided)
      if (hasProjectId) {
        const project = await this.prisma.project.findUnique({
          where: { id: data.projectId },
        });

        if (!project) {
          throw new NotFoundException(
            `Project with ID ${data.projectId} not found`,
          );
        }
      }

      // Validate category if provided
      if (data.categoryId) {
        const category = await this.prisma.costCategory.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Cost category with ID ${data.categoryId} not found`,
          );
        }
      }

      // Validate allocations if provided
      if (isAllocated) {
        const validation = this.allocationValidator.validateAllocations(
          data.allocations!,
          data.amount,
        );

        if (!validation.isValid) {
          throw new BadRequestException(
            `Allocation validation failed: ${validation.errors.join(', ')}`,
          );
        }

        // Validate all allocated projects exist
        const projectIds = data.allocations!.map((a) => a.projectId);
        const projects = await this.prisma.project.findMany({
          where: { id: { in: projectIds } },
          select: { id: true },
        });

        if (projects.length !== projectIds.length) {
          const foundIds = projects.map((p) => p.id);
          const missingIds = projectIds.filter((id) => !foundIds.includes(id));
          throw new NotFoundException(
            `Projects not found: ${missingIds.join(', ')}`,
          );
        }
      }

      // Create cost with transaction for allocated costs
      if (isAllocated) {
        return await this.prisma.$transaction(async (tx) => {
          // Create main cost record
          const cost = await tx.cost.create({
            data: {
              projectId: null, // Allocated costs don't have single projectId
              isAllocated: true,
              costType: data.costType,
              referenceType: data.referenceType,
              referenceId: data.referenceId,
              categoryId: data.categoryId,
              amount: new Prisma.Decimal(taxBreakdown.amount),
              amountBeforeTax: new Prisma.Decimal(taxBreakdown.amountBeforeTax),
              taxRate: new Prisma.Decimal(taxBreakdown.taxRate),
              taxAmount: new Prisma.Decimal(taxBreakdown.taxAmount),
              currency: 'SAR',
              transactionDate: new Date(data.transactionDate),
              description: data.description,
              invoiceNumber: data.invoiceNumber,
              paymentStatus: PaymentStatus.PENDING,
              paymentMethod: data.paymentMethod,
              paymentReference: data.paymentReference,
              createdBy: userId,
            },
          });

          // Calculate allocations (amounts from percentages or vice versa)
          const usingPercentages = data.allocations!.every(
            (a) => a.percentage !== undefined,
          );
          const calculatedAllocations = usingPercentages
            ? this.allocationValidator.calculateAmountsFromPercentages(
                data.allocations!,
                data.amount,
              )
            : this.allocationValidator.calculatePercentagesFromAmounts(
                data.allocations!,
                data.amount,
              );

          // Create allocation records
          await this.allocationRepository.createMany(
            cost.id,
            calculatedAllocations.map((calc, index) => ({
              projectId: calc.projectId,
              allocatedAmount: calc.amount,
              percentage: calc.percentage,
              notes: data.allocations![index].notes,
            })),
            tx,
          );

          this.logger.log(
            `Allocated cost created: ${cost.id} across ${data.allocations!.length} projects`,
          );

          // Fetch complete cost with allocations using transaction client
          const createdCost = await tx.cost.findUnique({
            where: { id: cost.id },
            include: {
              project: true,
              category: true,
              allocations: {
                include: {
                  project: {
                    select: {
                      id: true,
                      projectCode: true,
                      name: true,
                      status: true,
                    },
                  },
                },
                orderBy: { allocatedAmount: 'desc' },
              },
              creator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          });

          if (!createdCost) {
            throw new Error(`Failed to retrieve created cost ${cost.id}`);
          }

          return this.mapToEntity(createdCost);
        });
      } else {
        // Create single project cost or general expense (no transaction needed)
        const cost = await this.prisma.cost.create({
          data: {
            projectId: data.projectId || null,
            isAllocated: false,
              costType: data.costType,
              referenceType: data.referenceType,
              referenceId: data.referenceId,
              categoryId: data.categoryId,
              amount: new Prisma.Decimal(taxBreakdown.amount),
              amountBeforeTax: new Prisma.Decimal(taxBreakdown.amountBeforeTax),
              taxRate: new Prisma.Decimal(taxBreakdown.taxRate),
              taxAmount: new Prisma.Decimal(taxBreakdown.taxAmount),
              currency: 'SAR',
              transactionDate: new Date(data.transactionDate),
            description: data.description,
            invoiceNumber: data.invoiceNumber,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: data.paymentMethod,
            paymentReference: data.paymentReference,
            createdBy: userId,
          },
          include: {
            project: true,
            category: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        const costType = hasProjectId ? 'single project' : 'general expense';
        this.logger.log(
          `Cost created: ${cost.id} (${costType})${hasProjectId ? ` for project ${data.projectId}` : ''}`,
        );
        return this.mapToEntity(cost);
      }
    } catch (error) {
      this.logger.error(`Failed to create cost: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find project cost by ID
   * Now supports fetching allocations for allocated costs
   */
  async findById(
    id: string,
    includeRelations: boolean = false,
  ): Promise<ProjectCostEntity | null> {
    const cost = await this.prisma.cost.findUnique({
      where: { id },
      include: includeRelations
        ? {
            project: true,
            category: true,
            allocations: {
              include: {
                project: {
                  select: {
                    id: true,
                    projectCode: true,
                    name: true,
                    status: true,
                  },
                },
              },
              orderBy: { allocatedAmount: 'desc' },
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          }
        : undefined,
    });

    return cost ? this.mapToEntity(cost) : null;
  }

  /**
   * Find all project costs with filtering and pagination
   */
  async findAll(
    filters: ProjectCostFiltersDto,
  ): Promise<ProjectCostListResult> {
    const {
      search,
      projectId,
      categoryId,
      costType,
      paymentStatus,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      isAllocated,
      referenceType,
      referenceId,
      createdBy,
      approvedBy,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (projectId) where.projectId = projectId;
    if (categoryId) where.categoryId = categoryId;
    if (costType) where.costType = costType;
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    } else {
      where.paymentStatus = { in: DEFAULT_ACCOUNTING_COST_STATUSES };
    }
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;
    if (createdBy) where.createdBy = createdBy;
    if (approvedBy) where.approvedBy = approvedBy;

    // Date range filter
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
      if (dateTo) where.transactionDate.lte = new Date(dateTo);
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined)
        where.amount.gte = new Prisma.Decimal(minAmount);
      if (maxAmount !== undefined)
        where.amount.lte = new Prisma.Decimal(maxAmount);
    }

    // Allocation filter
    if (isAllocated !== undefined) {
      if (isAllocated) {
        // Only costs with allocations
        where.allocations = {
          some: {},
        };
      } else {
        // Only costs without allocations
        where.allocations = {
          none: {},
        };
      }
    }

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'transactionDate';
    const finalSortOrder = sortOrder || 'desc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [costs, total] = await Promise.all([
      this.prisma.cost.findMany({
        where,
        skip,
        take: finalLimit,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          allocations: {
            include: {
              project: {
                select: {
                  id: true,
                  projectCode: true,
                  name: true,
                },
              },
            },
            orderBy: { allocatedAmount: 'desc' },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.cost.count({ where }),
    ]);

    return {
      data: costs.map((cost) => this.mapToEntity(cost)),
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages: Math.ceil(total / finalLimit),
    };
  }

  /**
   * Update project cost
   * Only costs with PENDING status can be fully updated
   */
  async update(
    id: string,
    data: UpdateProjectCostDto,
  ): Promise<ProjectCostEntity> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundException(`Project cost with ID ${id} not found`);
      }

      const providedFields = this.getProvidedUpdateFields(data);

      // Restrict updates based on status.
      // For non-pending costs, only payment lifecycle fields are allowed.
      if (existing.paymentStatus !== PaymentStatus.PENDING) {
        const hasDisallowedField = providedFields.some(
          (field) =>
            !ProjectCostRepository.NON_PENDING_ALLOWED_UPDATE_FIELDS.has(field),
        );
        if (hasDisallowedField) {
          throw new BadRequestException(
            'Can only update status and payment details for approved/paid costs',
          );
        }
      }

      if (data.paymentStatus !== undefined) {
        const nextStatus = data.paymentStatus;
        const isAllowed = this.isAllowedPaymentStatusTransition(
          existing.paymentStatus,
          nextStatus,
        );
        if (!isAllowed) {
          throw new BadRequestException(
            `Invalid payment status transition from ${existing.paymentStatus} to ${nextStatus}.`,
          );
        }
      }

      // Paid status should always include paid date for traceability.
      if (
        data.paymentStatus === PaymentStatus.PAID &&
        !data.paidDate &&
        !existing.paidDate
      ) {
        throw new BadRequestException(
          'paidDate is required when setting payment status to PAID.',
        );
      }

      // Validate category if being updated
      if (data.categoryId) {
        const category = await this.prisma.costCategory.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Cost category with ID ${data.categoryId} not found`,
          );
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (data.costType !== undefined) updateData.costType = data.costType;
      if (data.referenceType !== undefined)
        updateData.referenceType = data.referenceType;
      if (data.referenceId !== undefined)
        updateData.referenceId = data.referenceId;
      if (data.categoryId !== undefined)
        updateData.categoryId = data.categoryId;
      if (data.amount !== undefined || data.taxRate !== undefined) {
        const taxBreakdown = this.calculateTaxBreakdown(
          data.amount ?? existing.amount,
          data.taxRate ?? existing.taxRate,
        );
        updateData.amount = new Prisma.Decimal(taxBreakdown.amount);
        updateData.amountBeforeTax = new Prisma.Decimal(
          taxBreakdown.amountBeforeTax,
        );
        updateData.taxRate = new Prisma.Decimal(taxBreakdown.taxRate);
        updateData.taxAmount = new Prisma.Decimal(taxBreakdown.taxAmount);
      }
      // Currency is always SAR - no updates allowed
      if (data.transactionDate !== undefined)
        updateData.transactionDate = new Date(data.transactionDate);
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.invoiceNumber !== undefined)
        updateData.invoiceNumber = data.invoiceNumber;
      if (data.paymentStatus !== undefined)
        updateData.paymentStatus = data.paymentStatus;
      if (data.paidDate !== undefined)
        updateData.paidDate = new Date(data.paidDate);
      if (data.paymentMethod !== undefined)
        updateData.paymentMethod = data.paymentMethod;
      if (data.paymentReference !== undefined)
        updateData.paymentReference = data.paymentReference;
      updateData.rowVersion = { increment: 1 };

      let updated: any;
      if (typeof data.rowVersion === 'number') {
        const { count } = await this.prisma.cost.updateMany({
          where: { id, rowVersion: data.rowVersion },
          data: updateData,
        });
        if (count === 0) {
          throw new ConflictException(
            'Cost was modified by another user. Refresh and try again.',
          );
        }
        updated = await this.prisma.cost.findUnique({
          where: { id },
          include: {
            project: true,
            category: true,
            allocations: {
              include: {
                project: {
                  select: {
                    id: true,
                    projectCode: true,
                    name: true,
                  },
                },
              },
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      } else {
        updated = await this.prisma.cost.update({
          where: { id },
          data: updateData,
          include: {
            project: true,
            category: true,
            allocations: {
              include: {
                project: {
                  select: {
                    id: true,
                    projectCode: true,
                    name: true,
                  },
                },
              },
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      }

      this.logger.log(`Project cost updated: ${id}`);
      return this.mapToEntity(updated);
    } catch (error) {
      this.logger.error(`Failed to update project cost: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract only fields that were explicitly provided by the caller.
   * DTO class instances may contain optional keys with `undefined`, which should
   * not be treated as requested updates.
   */
  private getProvidedUpdateFields(
    data: UpdateProjectCostDto,
  ): Array<keyof UpdateProjectCostDto> {
    return (Object.keys(data) as Array<keyof UpdateProjectCostDto>).filter(
      (key) => key !== 'rowVersion' && data[key] !== undefined,
    );
  }

  /**
   * Delete project cost
   * Only PENDING or REJECTED costs can be deleted
   */
  async delete(id: string, rowVersion?: number): Promise<void> {
    try {
      const cost = await this.findById(id);
      if (!cost) {
        throw new NotFoundException(`Project cost with ID ${id} not found`);
      }

      if (cost.paymentStatus === PaymentStatus.PAID) {
        throw new ConflictException('Cannot delete a paid cost');
      }

      if (cost.paymentStatus === PaymentStatus.APPROVED) {
        throw new ConflictException('Cannot delete an approved cost');
      }

      if (typeof rowVersion === 'number') {
        const result = await this.prisma.cost.deleteMany({
          where: { id, rowVersion },
        });
        if (result.count === 0) {
          throw new ConflictException(
            'Cost was modified by another user. Refresh and try again.',
          );
        }
      } else {
        await this.prisma.cost.delete({
          where: { id },
        });
      }

      this.logger.log(`Project cost deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete project cost: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // APPROVAL WORKFLOW OPERATIONS
  // ============================================================================

  async approve(
    id: string,
    userId: string,
    notes?: string,
    rowVersion?: number,
  ): Promise<ProjectCostEntity> {
    const cost = await this.findById(id);
    if (!cost) {
      throw new NotFoundException(`Project cost with ID ${id} not found`);
    }

    if (cost.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending costs can be approved');
    }

    const updateWhere: Prisma.CostWhereInput = {
      id,
      paymentStatus: PaymentStatus.PENDING,
    };
    if (typeof rowVersion === 'number') {
      updateWhere.rowVersion = rowVersion;
    }

    const updateResult = await this.prisma.cost.updateMany({
      where: updateWhere,
      data: {
        paymentStatus: PaymentStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        notes: notes || cost.notes,
        rowVersion: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException(
        'Cost was modified by another user. Refresh and try again.',
      );
    }

    const updated = await this.prisma.cost.findUnique({
      where: { id },
      include: {
        project: true,
        category: true,
        allocations: {
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
          },
        },
        creator: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!updated) {
      throw new NotFoundException(`Project cost with ID ${id} not found`);
    }

    this.logger.log(`Project cost approved: ${id} by user ${userId}`);
    return this.mapToEntity(updated);
  }

  async reject(
    id: string,
    userId: string,
    reason: string,
    rowVersion?: number,
  ): Promise<ProjectCostEntity> {
    const cost = await this.findById(id);
    if (!cost) {
      throw new NotFoundException(`Project cost with ID ${id} not found`);
    }

    if (cost.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending costs can be rejected');
    }

    const updateWhere: Prisma.CostWhereInput = {
      id,
      paymentStatus: PaymentStatus.PENDING,
    };
    if (typeof rowVersion === 'number') {
      updateWhere.rowVersion = rowVersion;
    }

    const updateResult = await this.prisma.cost.updateMany({
      where: updateWhere,
      data: {
        paymentStatus: PaymentStatus.REJECTED,
        approvedBy: userId,
        approvedAt: new Date(),
        rejectedReason: reason,
        rowVersion: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException(
        'Cost was modified by another user. Refresh and try again.',
      );
    }

    const updated = await this.prisma.cost.findUnique({
      where: { id },
      include: {
        project: true,
        category: true,
        allocations: {
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
          },
        },
        creator: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!updated) {
      throw new NotFoundException(`Project cost with ID ${id} not found`);
    }

    this.logger.log(`Project cost rejected: ${id} by user ${userId}`);
    return this.mapToEntity(updated);
  }

  async markAsPaid(
    id: string,
    paidDate: Date,
    paymentMethod?: string,
    paymentReference?: string,
  ): Promise<ProjectCostEntity> {
    const cost = await this.findById(id);
    if (!cost) {
      throw new NotFoundException(`Project cost with ID ${id} not found`);
    }

    if (cost.paymentStatus !== PaymentStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved costs can be marked as paid',
      );
    }

    const updated = await this.prisma.cost.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidDate,
        paymentMethod,
        paymentReference,
        rowVersion: { increment: 1 },
      },
      include: {
        project: true,
        category: true,
        allocations: {
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Project cost marked as paid: ${id}`);
    return this.mapToEntity(updated);
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async findByProject(
    projectId: string,
    filters?: Partial<ProjectCostFiltersDto>,
  ): Promise<ProjectCostEntity[]> {
    const where: any = { projectId };

    if (filters?.costType) where.costType = filters.costType;
    if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    const costs = await this.prisma.cost.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: {
        category: true,
        allocations: {
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
          },
        },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return costs.map((cost) => this.mapToEntity(cost));
  }

  async getProjectSummary(projectId: string): Promise<ProjectCostSummaryDto> {
    // Fetch project budget, direct costs, and allocated costs in parallel
    const [project, directCosts, allocatedCosts] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { budget: true },
      }),
      this.prisma.cost.findMany({
        where: { projectId },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.costAllocation.findMany({
        where: {
          projectId,
          cost: {
            projectId: null,
            isAllocated: true,
          },
        },
        include: {
          cost: {
            include: { category: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    const budget = project?.budget ? Number(project.budget) : null;

    // Helper: calculate amount by status from both direct and allocated costs
    const amountByStatus = (status: PaymentStatus): number => {
      const direct = directCosts
        .filter((c) => c.paymentStatus === status)
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const allocated = allocatedCosts
        .filter((a) => a.cost.paymentStatus === status)
        .reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
      return direct + allocated;
    };

    const countByStatus = (status: PaymentStatus): number => {
      const direct = directCosts.filter(
        (c) => c.paymentStatus === status,
      ).length;
      const allocated = allocatedCosts.filter(
        (a) => a.cost.paymentStatus === status,
      ).length;
      return direct + allocated;
    };

    const totalAmount =
      directCosts
        .filter((c) => isIncludedInDefaultCostTotals(c.paymentStatus))
        .reduce((sum, c) => sum + Number(c.amount), 0) +
      allocatedCosts
        .filter((a) => isIncludedInDefaultCostTotals(a.cost.paymentStatus))
        .reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
    const totalCount =
      directCosts.filter((c) => isIncludedInDefaultCostTotals(c.paymentStatus))
        .length +
      allocatedCosts.filter((a) =>
        isIncludedInDefaultCostTotals(a.cost.paymentStatus),
      ).length;

    const pendingAmount = amountByStatus(PaymentStatus.PENDING);
    const approvedAmount = amountByStatus(PaymentStatus.APPROVED);
    const paidAmount = amountByStatus(PaymentStatus.PAID);
    const rejectedAmount = amountByStatus(PaymentStatus.REJECTED);
    const partiallyPaidAmount = amountByStatus(PaymentStatus.PARTIALLY_PAID);
    const overdueAmount = amountByStatus(PaymentStatus.OVERDUE);

    // Budget calculations
    const remainingBudget = budget !== null ? budget - totalAmount : null;
    const budgetUtilization =
      budget !== null && budget > 0
        ? Math.round((totalAmount / budget) * 10000) / 100
        : null;

    // Cost type breakdown
    const costTypeBreakdown = Object.values(CostType)
      .map((type) => {
        const directByType = directCosts
          .filter(
            (c) =>
              c.costType === type &&
              isIncludedInDefaultCostTotals(c.paymentStatus),
          )
          .reduce((sum, c) => sum + Number(c.amount), 0);
        const allocatedByType = allocatedCosts
          .filter(
            (a) =>
              a.cost.costType === type &&
              isIncludedInDefaultCostTotals(a.cost.paymentStatus),
          )
          .reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
        const amount = directByType + allocatedByType;
        const count =
          directCosts.filter(
            (c) =>
              c.costType === type &&
              isIncludedInDefaultCostTotals(c.paymentStatus),
          ).length +
          allocatedCosts.filter(
            (a) =>
              a.cost.costType === type &&
              isIncludedInDefaultCostTotals(a.cost.paymentStatus),
          ).length;
        return {
          costType: type,
          totalAmount: amount,
          count,
          percentage:
            totalAmount > 0
              ? Math.round((amount / totalAmount) * 10000) / 100
              : 0,
        };
      })
      .filter((item) => item.totalAmount > 0);

    // Category breakdown
    const categoryMap = new Map<
      string,
      { id: string; name: string; amount: number; count: number }
    >();
    for (const cost of directCosts) {
      if (!isIncludedInDefaultCostTotals(cost.paymentStatus)) {
        continue;
      }
      if (cost.category) {
        const key = cost.category.id;
        const existing = categoryMap.get(key) || {
          id: key,
          name: cost.category.name,
          amount: 0,
          count: 0,
        };
        existing.amount += Number(cost.amount);
        existing.count += 1;
        categoryMap.set(key, existing);
      }
    }
    for (const alloc of allocatedCosts) {
      if (!isIncludedInDefaultCostTotals(alloc.cost.paymentStatus)) {
        continue;
      }
      if (alloc.cost.category) {
        const key = alloc.cost.category.id;
        const existing = categoryMap.get(key) || {
          id: key,
          name: alloc.cost.category.name,
          amount: 0,
          count: 0,
        };
        existing.amount += Number(alloc.allocatedAmount);
        existing.count += 1;
        categoryMap.set(key, existing);
      }
    }
    const categoryBreakdown = Array.from(categoryMap.values())
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        totalAmount: cat.amount,
        count: cat.count,
        percentage:
          totalAmount > 0
            ? Math.round((cat.amount / totalAmount) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Monthly trend (last 12 months)
    const now = new Date();
    const monthlyTrend: {
      month: string;
      totalAmount: number;
      count: number;
    }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const directInMonth = directCosts.filter((c) => {
        const td = new Date(c.transactionDate);
        return (
          isIncludedInDefaultCostTotals(c.paymentStatus) &&
          td >= date &&
          td < nextMonth
        );
      });
      const allocatedInMonth = allocatedCosts.filter((a) => {
        const td = new Date(a.cost.transactionDate);
        return (
          isIncludedInDefaultCostTotals(a.cost.paymentStatus) &&
          td >= date &&
          td < nextMonth
        );
      });

      const monthAmount =
        directInMonth.reduce((sum, c) => sum + Number(c.amount), 0) +
        allocatedInMonth.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);

      monthlyTrend.push({
        month: yearMonth,
        totalAmount: monthAmount,
        count: directInMonth.length + allocatedInMonth.length,
      });
    }

    return {
      projectId,
      budget,
      remainingBudget,
      budgetUtilization,
      totalAmount,
      pendingAmount,
      approvedAmount,
      paidAmount,
      rejectedAmount,
      partiallyPaidAmount,
      overdueAmount,
      totalCount,
      pendingCount: countByStatus(PaymentStatus.PENDING),
      approvedCount: countByStatus(PaymentStatus.APPROVED),
      paidCount: countByStatus(PaymentStatus.PAID),
      rejectedCount: countByStatus(PaymentStatus.REJECTED),
      costTypeBreakdown,
      categoryBreakdown,
      monthlyTrend,
      currency: 'SAR',
    };
  }

  async findByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<ProjectCostEntity[]> {
    const costs = await this.prisma.cost.findMany({
      where: {
        referenceType,
        referenceId,
      },
      orderBy: { transactionDate: 'desc' },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        category: true,
        allocations: {
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return costs.map((cost) => this.mapToEntity(cost));
  }

  async findPendingCosts(projectId?: string): Promise<ProjectCostEntity[]> {
    const where: any = { paymentStatus: PaymentStatus.PENDING };
    if (projectId) where.projectId = projectId;

    const costs = await this.prisma.cost.findMany({
      where,
      orderBy: { transactionDate: 'asc' },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        category: true,
        allocations: {
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
          },
        },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return costs.map((cost) => this.mapToEntity(cost));
  }

  async findOverdueCosts(daysOverdue: number): Promise<ProjectCostEntity[]> {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - daysOverdue);

    const costs = await this.prisma.cost.findMany({
      where: {
        paymentStatus: PaymentStatus.APPROVED,
        transactionDate: {
          lte: overdueDate,
        },
      },
      orderBy: { transactionDate: 'asc' },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        category: true,
        allocations: {
          include: {
            project: {
              select: {
                id: true,
                projectCode: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return costs.map((cost) => this.mapToEntity(cost));
  }

  async getTotalsByType(projectId: string): Promise<Record<CostType, number>> {
    // Fetch both direct costs and allocated costs
    const [directCosts, allocatedCosts] = await Promise.all([
      this.prisma.cost.findMany({
        where: { projectId },
        select: { costType: true, amount: true },
      }),
      this.prisma.costAllocation.findMany({
        where: {
          projectId,
          cost: {
            projectId: null,
            isAllocated: true,
          },
        },
        include: {
          cost: {
            select: { costType: true },
          },
        },
      }),
    ]);

    const totals: Record<CostType, number> = {} as any;
    Object.values(CostType).forEach((type) => {
      const directTotal = directCosts
        .filter((c) => c.costType === type)
        .reduce((sum, cost) => sum + Number(cost.amount), 0);
      const allocatedTotal = allocatedCosts
        .filter((a) => a.cost.costType === type)
        .reduce(
          (sum, allocation) => sum + Number(allocation.allocatedAmount),
          0,
        );
      totals[type] = directTotal + allocatedTotal;
    });

    return totals;
  }

  async getTotalsByStatus(
    projectId: string,
  ): Promise<Record<PaymentStatus, number>> {
    // Fetch both direct costs and allocated costs
    const [directCosts, allocatedCosts] = await Promise.all([
      this.prisma.cost.findMany({
        where: { projectId },
        select: { paymentStatus: true, amount: true },
      }),
      this.prisma.costAllocation.findMany({
        where: {
          projectId,
          cost: {
            projectId: null,
            isAllocated: true,
          },
        },
        include: {
          cost: {
            select: { paymentStatus: true },
          },
        },
      }),
    ]);

    const totals: Record<PaymentStatus, number> = {} as any;
    Object.values(PaymentStatus).forEach((status) => {
      const directTotal = directCosts
        .filter((c) => c.paymentStatus === status)
        .reduce((sum, cost) => sum + Number(cost.amount), 0);
      const allocatedTotal = allocatedCosts
        .filter((a) => a.cost.paymentStatus === status)
        .reduce(
          (sum, allocation) => sum + Number(allocation.allocatedAmount),
          0,
        );
      totals[status] = directTotal + allocatedTotal;
    });

    return totals;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map Prisma object to Entity
   * IMPORTANT: Converts Decimal to number for easier handling
   * Now includes allocation support
   */
  private mapToEntity(prismaCost: any): ProjectCostEntity {
    return new ProjectCostEntity({
      id: prismaCost.id,
      projectId: prismaCost.projectId,
      isAllocated: prismaCost.isAllocated || false,
      costType: prismaCost.costType,
      referenceType: prismaCost.referenceType,
      referenceId: prismaCost.referenceId,
      categoryId: prismaCost.categoryId,
      amount: Number(prismaCost.amount), // Convert Decimal to number
      amountBeforeTax: Number(prismaCost.amountBeforeTax),
      taxRate: Number(prismaCost.taxRate),
      taxAmount: Number(prismaCost.taxAmount),
      currency: prismaCost.currency,
      transactionDate: prismaCost.transactionDate,
      description: prismaCost.description,
      invoiceNumber: prismaCost.invoiceNumber,
      paymentStatus: prismaCost.paymentStatus,
      paidDate: prismaCost.paidDate,
      paymentMethod: prismaCost.paymentMethod,
      paymentReference: prismaCost.paymentReference,
      approvedBy: prismaCost.approvedBy,
      approvedAt: prismaCost.approvedAt,
      rejectedReason: prismaCost.rejectedReason,
      notes: prismaCost.notes,
      createdBy: prismaCost.createdBy,
      createdAt: prismaCost.createdAt,
      updatedAt: prismaCost.updatedAt,
      rowVersion: prismaCost.rowVersion,
      project: prismaCost.project,
      category: prismaCost.category,
      creator: prismaCost.creator,
      approver: prismaCost.approver,
      allocations: prismaCost.allocations
        ? prismaCost.allocations.map((alloc: any) => ({
            id: alloc.id,
            costId: alloc.costId,
            projectId: alloc.projectId,
            allocatedAmount: Number(alloc.allocatedAmount),
            percentage: Number(alloc.percentage),
            notes: alloc.notes,
            createdAt: alloc.createdAt,
            updatedAt: alloc.updatedAt,
            project: alloc.project,
          }))
        : undefined,
    });
  }
}
