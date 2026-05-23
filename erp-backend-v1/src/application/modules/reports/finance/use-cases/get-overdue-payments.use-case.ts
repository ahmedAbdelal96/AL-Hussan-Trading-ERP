/**
 * ============================================================================
 * GET OVERDUE PAYMENTS USE CASE
 * ============================================================================
 *
 * Detailed paginated list of overdue payments.
 * Sorted by most overdue first (critical items on top).
 *
 * @module GetOverduePaymentsUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { PaymentStatus, CostType, Prisma } from '@prisma/client';
import {
  OverduePaymentsFiltersDto,
  OverduePaymentsResponseDto,
  OverduePaymentDetailDto,
  OverduePaymentsSummaryDto,
} from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';

@Injectable()
export class GetOverduePaymentsUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: OverduePaymentsFiltersDto,
  ): Promise<OverduePaymentsResponseDto> {
    const { skip, take } = this.baseReportService.calculatePagination(
      filters.page || 1,
      filters.limit || 20,
    );

    const where: Prisma.CostWhereInput = {
      paymentStatus: PaymentStatus.OVERDUE,
    };

    // Apply filters
    if (filters.costType) where.costType = filters.costType;

    // Filter by minimum days overdue
    if (filters.minDaysOverdue) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.minDaysOverdue);
      where.transactionDate = { lte: cutoffDate };
    }

    if (filters.projectId) {
      const scopedRows = await fetchProjectScopedCosts(
        this.prisma,
        filters.projectId,
        where,
        { includeProjectName: true },
      );
      const sortedRows = [...scopedRows].sort(
        (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
      );
      const totalCount = sortedRows.length;
      const totalOverdue = sortedRows.reduce((sum, row) => sum + row.amount, 0);
      const pagedRows = sortedRows.slice(skip, skip + take);

      const now = new Date();
      const data: OverduePaymentDetailDto[] = pagedRows.map((row) => {
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(row.transactionDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return {
          id: row.id,
          projectName: row.projectName || 'General Expense',
          costType: row.costType,
          costTypeName: this.formatCostTypeName(row.costType),
          amount: row.amount,
          transactionDate: row.transactionDate,
          invoiceNumber: row.invoiceNumber || undefined,
          description: row.description,
          daysOverdue,
          createdAt: row.createdAt,
        };
      });

      const avgDaysOverdue =
        data.length > 0
          ? data.reduce((sum, item) => sum + item.daysOverdue, 0) / data.length
          : 0;

      const maxDaysOverdue =
        data.length > 0 ? Math.max(...data.map((item) => item.daysOverdue)) : 0;

      const summary: OverduePaymentsSummaryDto = {
        totalOverdue,
        count: totalCount,
        avgDaysOverdue,
        maxDaysOverdue,
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
    const [totalCount, summaryAgg] = await Promise.all([
      this.prisma.cost.count({ where }),
      this.prisma.cost.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    // Fetch paginated data with relations
    const costs = await this.prisma.cost.findMany({
      where,
      skip,
      take,
      orderBy: { transactionDate: 'asc' }, // Most overdue first
      include: {
        project: { select: { name: true } },
      },
    });

    // Calculate days overdue
    const now = new Date();
    const data: OverduePaymentDetailDto[] = costs.map((cost) => {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(cost.transactionDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        id: cost.id,
        projectName: cost.project?.name || 'General Expense',
        costType: cost.costType,
        costTypeName: this.formatCostTypeName(cost.costType),
        amount: Number(cost.amount),
        transactionDate: cost.transactionDate,
        invoiceNumber: cost.invoiceNumber || undefined,
        description: cost.description,
        daysOverdue,
        createdAt: cost.createdAt,
      };
    });

    // Calculate summary statistics
    const avgDaysOverdue =
      data.length > 0
        ? data.reduce((sum, item) => sum + item.daysOverdue, 0) / data.length
        : 0;

    const maxDaysOverdue =
      data.length > 0 ? Math.max(...data.map((item) => item.daysOverdue)) : 0;

    const summary: OverduePaymentsSummaryDto = {
      totalOverdue: Number(summaryAgg._sum.amount || 0),
      count: totalCount,
      avgDaysOverdue,
      maxDaysOverdue,
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
