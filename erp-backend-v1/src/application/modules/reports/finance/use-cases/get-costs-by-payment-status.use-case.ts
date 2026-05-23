/**
 * ============================================================================
 * GET COSTS BY PAYMENT STATUS USE CASE
 * ============================================================================
 *
 * Analyzes cost distribution across payment statuses.
 * Critical for payment tracking and approval workflows.
 *
 * @module GetCostsByPaymentStatusUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { PaymentStatus, Prisma } from '@prisma/client';
import {
  PaymentStatusFiltersDto,
  CostsByPaymentStatusResponseDto,
  PaymentStatusBreakdownItemDto,
} from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';
import { DEFAULT_ACCOUNTING_COST_STATUSES } from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetCostsByPaymentStatusUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: PaymentStatusFiltersDto,
  ): Promise<CostsByPaymentStatusResponseDto> {
    const where: Prisma.CostWhereInput = {};

    // Apply filters
    if (filters.startDate || filters.endDate) {
      where.transactionDate = this.baseReportService.applyDateRangeFilter(
        filters.startDate,
        filters.endDate,
      );
    }
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    } else {
      where.paymentStatus = { in: DEFAULT_ACCOUNTING_COST_STATUSES };
    }
    if (filters.costType) where.costType = filters.costType;

    if (filters.projectId) {
      const rows = await fetchProjectScopedCosts(
        this.prisma,
        filters.projectId,
        where,
      );

      const groupedMap = new Map<
        PaymentStatus,
        { amount: number; count: number }
      >();
      rows.forEach((row) => {
        const existing = groupedMap.get(row.paymentStatus) || {
          amount: 0,
          count: 0,
        };
        existing.amount += row.amount;
        existing.count += 1;
        groupedMap.set(row.paymentStatus, existing);
      });

      const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
      const totalCount = rows.length;

      const breakdown: PaymentStatusBreakdownItemDto[] = Array.from(
        groupedMap.entries(),
      ).map(([status, values]) => ({
        status,
        statusName: this.formatPaymentStatusName(status),
        amount: values.amount,
        count: values.count,
        percentage: this.baseReportService.calculatePercentage(
          values.amount,
          totalAmount,
        ),
      }));

      return {
        breakdown,
        totalAmount,
        totalCount,
        currency: 'SAR',
        generatedAt: new Date(),
      };
    }

    // Group by payment status
    const grouped = await this.prisma.cost.groupBy({
      by: ['paymentStatus'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalAmount = grouped.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0,
    );
    const totalCount = grouped.reduce((sum, item) => sum + item._count.id, 0);

    const breakdown: PaymentStatusBreakdownItemDto[] = grouped.map((item) => {
      const amount = Number(item._sum.amount || 0);

      return {
        status: item.paymentStatus,
        statusName: this.formatPaymentStatusName(item.paymentStatus),
        amount,
        count: item._count.id,
        percentage: this.baseReportService.calculatePercentage(
          amount,
          totalAmount,
        ),
      };
    });

    return {
      breakdown,
      totalAmount,
      totalCount,
      currency: 'SAR',
      generatedAt: new Date(),
    };
  }

  /**
   * Format payment status enum to human-readable name
   */
  private formatPaymentStatusName(status: PaymentStatus): string {
    const names: Record<PaymentStatus, string> = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      PAID: 'Paid',
      REJECTED: 'Rejected',
      PARTIALLY_PAID: 'Partially Paid',
      OVERDUE: 'Overdue',
    };
    return names[status] || status;
  }
}
