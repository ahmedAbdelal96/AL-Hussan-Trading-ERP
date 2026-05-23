/**
 * ============================================================================
 * GET COSTS BY CATEGORY USE CASE
 * ============================================================================
 *
 * Analyzes costs grouped by categories (from CostCategory table).
 * Supports hierarchical categories with parent-child relationships.
 *
 * @module GetCostsByCategoryUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BaseReportService } from '../../services/base-report.service';
import {
  CategoryFiltersDto,
  CostsByCategoryResponseDto,
  CategoryBreakdownItemDto,
} from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';
import {
  DEFAULT_ACCOUNTING_COST_STATUSES,
  isIncludedInDefaultCostTotals,
} from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetCostsByCategoryUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: CategoryFiltersDto,
  ): Promise<CostsByCategoryResponseDto> {
    const where: Prisma.CostWhereInput = {};

    // Apply filters
    if (filters.startDate || filters.endDate) {
      where.transactionDate = this.baseReportService.applyDateRangeFilter(
        filters.startDate,
        filters.endDate,
      );
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    where.paymentStatus = { in: DEFAULT_ACCOUNTING_COST_STATUSES };

    if (filters.projectId) {
      const rows = await fetchProjectScopedCosts(
        this.prisma,
        filters.projectId,
        where,
      );

      const groupedMap = new Map<string, { amount: number; count: number }>();
      rows.forEach((row) => {
        const key = row.categoryId ?? 'uncategorized';
        const existing = groupedMap.get(key) || { amount: 0, count: 0 };
        existing.amount += row.amount;
        existing.count += 1;
        groupedMap.set(key, existing);
      });

      const categoryIds = Array.from(groupedMap.keys());
      const categories =
        categoryIds.length > 0
          ? await this.prisma.costCategory.findMany({
              where: { id: { in: categoryIds } },
              select: { id: true, name: true },
            })
          : [];
      const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

      const includedRows = rows.filter((row) =>
        isIncludedInDefaultCostTotals(row.paymentStatus),
      );
      const totalAmount = includedRows.reduce(
        (sum, row) => sum + row.amount,
        0,
      );
      const totalCount = includedRows.length;

      const breakdown: CategoryBreakdownItemDto[] = categoryIds
        .map((id) => {
          const values = groupedMap.get(id)!;
          const isUncategorized = id === 'uncategorized';
          return {
            categoryId: id,
            categoryName: isUncategorized
              ? 'Uncategorized'
              : categoryMap.get(id) || 'Unknown',
            amount: values.amount,
            count: values.count,
            percentage: this.baseReportService.calculatePercentage(
              values.amount,
              totalAmount,
            ),
          };
        })
        .sort((a, b) => b.amount - a.amount);

      return {
        breakdown,
        totalAmount,
        totalCount,
        currency: 'SAR',
        generatedAt: new Date(),
      };
    }

    // Group by category
    const grouped = await this.prisma.cost.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Fetch category details for all categories
    const categoryIds = grouped
      .map((item) => item.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await this.prisma.costCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    const totalAmount = grouped.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0,
    );
    const totalCount = grouped.reduce((sum, item) => sum + item._count.id, 0);

    // Transform and enrich data
    const breakdown: CategoryBreakdownItemDto[] = grouped
      .map((item) => {
        const amount = Number(item._sum.amount || 0);
        const categoryId = item.categoryId ?? 'uncategorized';
        const isUncategorized = item.categoryId === null;
        const category = item.categoryId
          ? categoryMap.get(item.categoryId)
          : null;

        return {
          categoryId,
          categoryName: isUncategorized
            ? 'Uncategorized'
            : category?.name || 'Unknown',
          amount,
          count: item._count.id,
          percentage: this.baseReportService.calculatePercentage(
            amount,
            totalAmount,
          ),
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
}
