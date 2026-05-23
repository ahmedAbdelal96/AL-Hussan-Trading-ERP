/**
 * ============================================================================
 * GET FINANCE OVERVIEW USE CASE
 * ============================================================================
 *
 * Returns high-level KPIs for finance dashboard cards.
 * Optimized for quick loading with parallel aggregations.
 *
 * @module GetFinanceOverviewUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { PaymentStatus, Prisma } from '@prisma/client';
import { FinanceOverviewFiltersDto, FinanceOverviewResponseDto } from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';
import {
  getDefaultAccountingCostWhere,
  isIncludedInDefaultCostTotals,
} from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetFinanceOverviewUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: FinanceOverviewFiltersDto,
  ): Promise<FinanceOverviewResponseDto> {
    // Build base where clause
    const where: Prisma.CostWhereInput = {};

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.transactionDate = this.baseReportService.applyDateRangeFilter(
        filters.startDate,
        filters.endDate,
      );
    }

    // Project-specific mode must account for direct + allocated shares
    if (filters.projectId) {
      const rows = await fetchProjectScopedCosts(
        this.prisma,
        filters.projectId,
        where,
      );

      const amountFor = (status: PaymentStatus) =>
        rows
          .filter((r) => r.paymentStatus === status)
          .reduce((sum, r) => sum + r.amount, 0);
      const countFor = (status: PaymentStatus) =>
        rows.filter((r) => r.paymentStatus === status).length;

      const includedRows = rows.filter((row) =>
        isIncludedInDefaultCostTotals(row.paymentStatus),
      );
      const totalCosts = includedRows.reduce((sum, row) => sum + row.amount, 0);
      const totalCount = includedRows.length;
      const averageCost = totalCount > 0 ? totalCosts / totalCount : 0;

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      const currentMonthAmount = includedRows
        .filter(
          (r) =>
            r.transactionDate >= currentMonthStart &&
            r.transactionDate < nextMonthStart,
        )
        .reduce((sum, r) => sum + r.amount, 0);
      const previousMonthAmount = includedRows
        .filter(
          (r) =>
            r.transactionDate >= previousMonthStart &&
            r.transactionDate < currentMonthStart,
        )
        .reduce((sum, r) => sum + r.amount, 0);

      const monthGrowthRate = this.baseReportService.calculatePercentage(
        currentMonthAmount - previousMonthAmount,
        previousMonthAmount,
      );

      return {
        totalCosts,
        totalCount,
        averageCost,
        pendingAmount: amountFor(PaymentStatus.PENDING),
        pendingCount: countFor(PaymentStatus.PENDING),
        approvedAmount: amountFor(PaymentStatus.APPROVED),
        approvedCount: countFor(PaymentStatus.APPROVED),
        paidAmount: amountFor(PaymentStatus.PAID),
        paidCount: countFor(PaymentStatus.PAID),
        overdueAmount: amountFor(PaymentStatus.OVERDUE),
        overdueCount: countFor(PaymentStatus.OVERDUE),
        rejectedAmount: amountFor(PaymentStatus.REJECTED),
        rejectedCount: countFor(PaymentStatus.REJECTED),
        partiallyPaidAmount: amountFor(PaymentStatus.PARTIALLY_PAID),
        partiallyPaidCount: countFor(PaymentStatus.PARTIALLY_PAID),
        monthGrowthRate,
        currency: 'SAR',
        generatedAt: new Date(),
      };
    }

    // Execute aggregations in parallel for better performance
    const accountingWhere: Prisma.CostWhereInput = {
      ...where,
      ...getDefaultAccountingCostWhere(),
    };

    const [
      totalAgg,
      pendingAgg,
      approvedAgg,
      paidAgg,
      overdueAgg,
      rejectedAgg,
      partiallyPaidAgg,
      currentMonthAgg,
      previousMonthAgg,
    ] = await Promise.all([
      // Total costs
      this.prisma.cost.aggregate({
        where: accountingWhere,
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
      }),

      // Pending costs
      this.prisma.cost.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.PENDING },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Approved costs
      this.prisma.cost.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.APPROVED },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Paid costs
      this.prisma.cost.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Overdue costs
      this.prisma.cost.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.OVERDUE },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Rejected costs
      this.prisma.cost.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.REJECTED },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Partially paid costs
      this.prisma.cost.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.PARTIALLY_PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Current month costs (for growth calculation)
      this.prisma.cost.aggregate({
        where: {
          ...accountingWhere,
          transactionDate: {
            gte: this.baseReportService.getMonthStart(0),
            lte: this.baseReportService.getMonthEnd(0),
          },
        },
        _sum: { amount: true },
      }),

      // Previous month costs (for growth calculation)
      this.prisma.cost.aggregate({
        where: {
          ...accountingWhere,
          transactionDate: {
            gte: this.baseReportService.getMonthStart(1),
            lte: this.baseReportService.getMonthEnd(1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    // Calculate growth rate
    const currentMonthAmount = Number(currentMonthAgg._sum.amount || 0);
    const previousMonthAmount = Number(previousMonthAgg._sum.amount || 0);
    const monthGrowthRate = this.baseReportService.calculatePercentage(
      currentMonthAmount - previousMonthAmount,
      previousMonthAmount,
    );

    return {
      totalCosts: Number(totalAgg._sum.amount || 0),
      totalCount: totalAgg._count.id,
      averageCost: Number(totalAgg._avg.amount || 0),
      pendingAmount: Number(pendingAgg._sum.amount || 0),
      pendingCount: pendingAgg._count.id,
      approvedAmount: Number(approvedAgg._sum.amount || 0),
      approvedCount: approvedAgg._count.id,
      paidAmount: Number(paidAgg._sum.amount || 0),
      paidCount: paidAgg._count.id,
      overdueAmount: Number(overdueAgg._sum.amount || 0),
      overdueCount: overdueAgg._count.id,
      rejectedAmount: Number(rejectedAgg._sum.amount || 0),
      rejectedCount: rejectedAgg._count.id,
      partiallyPaidAmount: Number(partiallyPaidAgg._sum.amount || 0),
      partiallyPaidCount: partiallyPaidAgg._count.id,
      monthGrowthRate,
      currency: 'SAR',
      generatedAt: new Date(),
    };
  }
}
