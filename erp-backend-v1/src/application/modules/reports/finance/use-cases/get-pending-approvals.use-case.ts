/**
 * ============================================================================
 * GET PENDING APPROVALS USE CASE
 * ============================================================================
 *
 * Detailed paginated list of costs awaiting approval.
 * Sorted by oldest first (urgent items on top).
 *
 * @module GetPendingApprovalsUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { PaymentStatus, CostType, Prisma } from '@prisma/client';
import {
  PendingApprovalsFiltersDto,
  PendingApprovalsResponseDto,
  PendingCostDetailDto,
  PendingApprovalsSummaryDto,
} from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';

@Injectable()
export class GetPendingApprovalsUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: PendingApprovalsFiltersDto,
  ): Promise<PendingApprovalsResponseDto> {
    const { skip, take } = this.baseReportService.calculatePagination(
      filters.page || 1,
      filters.limit || 20,
    );

    const where: Prisma.CostWhereInput = {
      paymentStatus: PaymentStatus.PENDING,
    };

    // Apply filters
    if (filters.costType) where.costType = filters.costType;

    // Filter by minimum days waiting
    if (filters.minDaysWaiting) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.minDaysWaiting);
      where.createdAt = { lte: cutoffDate };
    }

    if (filters.projectId) {
      const scopedRows = await fetchProjectScopedCosts(
        this.prisma,
        filters.projectId,
        where,
        { includeCreatorName: true, includeProjectName: true },
      );
      const sortedRows = [...scopedRows].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      const totalCount = sortedRows.length;
      const totalPending = sortedRows.reduce((sum, row) => sum + row.amount, 0);
      const oldestRecord = sortedRows[0];
      const pagedRows = sortedRows.slice(skip, skip + take);

      const now = new Date();
      const data: PendingCostDetailDto[] = pagedRows.map((row) => ({
        id: row.id,
        projectName: row.projectName || 'General Expense',
        costType: row.costType,
        costTypeName: this.formatCostTypeName(row.costType),
        amount: row.amount,
        description: row.description,
        transactionDate: row.transactionDate,
        invoiceNumber: row.invoiceNumber || undefined,
        daysWaiting: Math.floor(
          (now.getTime() - new Date(row.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        createdBy: row.creatorName || 'System',
        createdAt: row.createdAt,
      }));

      const oldestDays = oldestRecord
        ? Math.floor(
            (now.getTime() - new Date(oldestRecord.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      const avgDaysWaiting =
        data.length > 0
          ? data.reduce((sum, item) => sum + item.daysWaiting, 0) / data.length
          : 0;

      const summary: PendingApprovalsSummaryDto = {
        totalPending,
        count: totalCount,
        oldestDays,
        avgDaysWaiting,
      };

      return {
        summary,
        data,
        meta: this.baseReportService.calculatePaginationMeta(
          filters.page || 1,
          filters.limit || 20,
          totalCount,
        ),
        currency: 'SAR',
        generatedAt: new Date(),
      };
    }

    // Get total count and summary statistics
    const [totalCount, summaryAgg, oldestRecord] = await Promise.all([
      this.prisma.cost.count({ where }),
      this.prisma.cost.aggregate({
        where,
        _sum: { amount: true },
      }),
      this.prisma.cost.findFirst({
        where,
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ]);

    // Fetch paginated data with relations
    const costs = await this.prisma.cost.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'asc' }, // Oldest first
      include: {
        project: { select: { name: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    });

    // Calculate days waiting
    const now = new Date();
    const data: PendingCostDetailDto[] = costs.map((cost) => ({
      id: cost.id,
      projectName: cost.project?.name || 'General Expense',
      costType: cost.costType,
      costTypeName: this.formatCostTypeName(cost.costType),
      amount: Number(cost.amount),
      description: cost.description,
      transactionDate: cost.transactionDate,
      invoiceNumber: cost.invoiceNumber || undefined,
      daysWaiting: Math.floor(
        (now.getTime() - new Date(cost.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      createdBy: `${cost.creator.firstName} ${cost.creator.lastName}`,
      createdAt: cost.createdAt,
    }));

    // Calculate summary
    const oldestDays = oldestRecord
      ? Math.floor(
          (now.getTime() - new Date(oldestRecord.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    const avgDaysWaiting =
      data.length > 0
        ? data.reduce((sum, item) => sum + item.daysWaiting, 0) / data.length
        : 0;

    const summary: PendingApprovalsSummaryDto = {
      totalPending: Number(summaryAgg._sum?.amount || 0),
      count: totalCount,
      oldestDays,
      avgDaysWaiting,
    };

    return {
      summary,
      data,
      meta: this.baseReportService.calculatePaginationMeta(
        filters.page || 1,
        filters.limit || 20,
        totalCount,
      ),
      currency: 'SAR',
      generatedAt: new Date(),
    };
  }

  /**
   * Format cost type enum to human-readable name
   */
  private formatCostTypeName(costType: CostType): string {
    const names: Record<CostType, string> = {
      MAINTENANCE: 'Maintenance',
      PURCHASE: 'Purchase',
      SALARY: 'Salary',
      ALLOWANCE: 'Allowance',
      FUEL: 'Fuel',
      MATERIAL: 'Material',
      EQUIPMENT_RENTAL: 'Equipment Rental',
      SUBCONTRACTOR: 'Subcontractor',
      UTILITY: 'Utility',
      TRANSPORTATION: 'Transportation',
      INSURANCE: 'Insurance',
      TAX: 'Tax',
      OTHER: 'Other',
    };
    return names[costType] || costType;
  }
}
