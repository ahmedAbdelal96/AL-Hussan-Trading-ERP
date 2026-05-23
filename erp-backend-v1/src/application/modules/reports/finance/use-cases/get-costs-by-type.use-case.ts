/**
 * ============================================================================
 * GET COSTS BY TYPE USE CASE
 * ============================================================================
 *
 * Analyzes cost distribution across 13 cost types.
 * Uses Prisma groupBy for efficient aggregation.
 *
 * @module GetCostsByTypeUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { CostType, Prisma } from '@prisma/client';
import {
  CostTypeFiltersDto,
  CostsByTypeResponseDto,
  CostTypeBreakdownItemDto,
} from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';
import {
  DEFAULT_ACCOUNTING_COST_STATUSES,
  isIncludedInDefaultCostTotals,
} from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetCostsByTypeUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(filters: CostTypeFiltersDto): Promise<CostsByTypeResponseDto> {
    const where: Prisma.CostWhereInput = {};

    // Apply filters
    if (filters.startDate || filters.endDate) {
      where.transactionDate = this.baseReportService.applyDateRangeFilter(
        filters.startDate,
        filters.endDate,
      );
    }
    if (filters.costType) where.costType = filters.costType;
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    } else {
      where.paymentStatus = { in: DEFAULT_ACCOUNTING_COST_STATUSES };
    }

    if (filters.projectId) {
      const rows = await fetchProjectScopedCosts(
        this.prisma,
        filters.projectId,
        where,
      );

      const groupedMap = new Map<CostType, { amount: number; count: number }>();
      rows.forEach((row) => {
        const existing = groupedMap.get(row.costType) || {
          amount: 0,
          count: 0,
        };
        existing.amount += row.amount;
        existing.count += 1;
        groupedMap.set(row.costType, existing);
      });

      const includedRows = rows.filter((row) =>
        isIncludedInDefaultCostTotals(row.paymentStatus),
      );
      const totalAmount = includedRows.reduce(
        (sum, row) => sum + row.amount,
        0,
      );
      const totalCount = includedRows.length;

      const breakdown: CostTypeBreakdownItemDto[] = Array.from(
        groupedMap.entries(),
      )
        .map(([costType, values]) => ({
          costType,
          costTypeName: this.formatCostTypeName(costType),
          amount: values.amount,
          count: values.count,
          percentage: this.baseReportService.calculatePercentage(
            values.amount,
            totalAmount,
          ),
          avgPerTransaction:
            values.count > 0 ? values.amount / values.count : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        breakdown,
        totalAmount,
        totalCount,
        currency: 'SAR',
        generatedAt: new Date(),
      };
    }

    // Group by cost type
    const grouped = await this.prisma.cost.groupBy({
      by: ['costType'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Calculate total for percentages
    const totalAmount = grouped.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0,
    );
    const totalCount = grouped.reduce((sum, item) => sum + item._count.id, 0);

    // Transform and enrich data
    const breakdown: CostTypeBreakdownItemDto[] = grouped
      .map((item) => {
        const amount = Number(item._sum.amount || 0);
        const count = item._count.id;

        return {
          costType: item.costType,
          costTypeName: this.formatCostTypeName(item.costType),
          amount,
          count,
          percentage: this.baseReportService.calculatePercentage(
            amount,
            totalAmount,
          ),
          avgPerTransaction: count > 0 ? amount / count : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    return {
      breakdown,
      totalAmount,
      totalCount,
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
