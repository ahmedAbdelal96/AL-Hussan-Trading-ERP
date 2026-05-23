import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { FinanceOverviewFiltersDto, TaxSummaryResponseDto } from '../dto';
import { fetchProjectScopedCosts } from './project-cost-scope.helper';
import { getDefaultAccountingCostWhere } from '../../../finance/utils/cost-accounting-status.util';
import { Prisma } from '@prisma/client';

interface TaxRow {
  transactionDate: Date;
  amountBeforeTax: number;
  taxAmount: number;
  totalAmount: number;
}

@Injectable()
export class GetTaxSummaryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(filters: FinanceOverviewFiltersDto): Promise<TaxSummaryResponseDto> {
    const where: Record<string, unknown> = {
      ...getDefaultAccountingCostWhere(),
    };

    if (filters.startDate || filters.endDate) {
      where.transactionDate = this.baseReportService.applyDateRangeFilter(
        filters.startDate,
        filters.endDate,
      );
    }

    let rows: TaxRow[] = [];

    if (filters.projectId) {
      const projectRows = await fetchProjectScopedCosts(
        this.prisma,
        filters.projectId,
        where,
      );
      rows = projectRows.map((row) => ({
        transactionDate: row.transactionDate,
        amountBeforeTax: row.amountBeforeTax,
        taxAmount: row.taxAmount,
        totalAmount: row.amount,
      }));
    } else {
      let costs: Array<{
        transactionDate: Date;
        amount: Prisma.Decimal | number;
        amountBeforeTax: Prisma.Decimal | number | null;
        taxAmount: Prisma.Decimal | number | null;
      }> = [];

      try {
        costs = await this.prisma.cost.findMany({
          where,
          select: {
            transactionDate: true,
            amount: true,
            amountBeforeTax: true,
            taxAmount: true,
          },
        });
      } catch (error) {
        // Backward compatibility for environments where tax columns are not migrated yet.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2022'
        ) {
          const legacyCosts = await this.prisma.cost.findMany({
            where,
            select: {
              transactionDate: true,
              amount: true,
            },
          });

          costs = legacyCosts.map((row) => ({
            transactionDate: row.transactionDate,
            amount: row.amount,
            amountBeforeTax: row.amount,
            taxAmount: 0,
          }));
        } else {
          throw error;
        }
      }

      rows = costs.map((row) => ({
        transactionDate: row.transactionDate,
        amountBeforeTax: Number(row.amountBeforeTax || 0),
        taxAmount: Number(row.taxAmount || 0),
        totalAmount: Number(row.amount || 0),
      }));
    }

    const totalAmountBeforeTax = rows.reduce(
      (sum, row) => sum + row.amountBeforeTax,
      0,
    );
    const totalTaxAmount = rows.reduce((sum, row) => sum + row.taxAmount, 0);
    const totalAmountWithTax = rows.reduce((sum, row) => sum + row.totalAmount, 0);
    const taxedEntriesCount = rows.filter((row) => row.taxAmount > 0).length;
    const nonTaxedEntriesCount = rows.length - taxedEntriesCount;
    const effectiveTaxRate =
      totalAmountBeforeTax > 0
        ? this.baseReportService.calculatePercentage(
            totalTaxAmount,
            totalAmountBeforeTax,
          )
        : 0;

    const monthMap = new Map<
      string,
      {
        month: string;
        monthName: string;
        amountBeforeTax: number;
        taxAmount: number;
        totalAmount: number;
        taxedCount: number;
      }
    >();

    for (const row of rows) {
      const date = row.transactionDate;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      const existing = monthMap.get(month) ?? {
        month,
        monthName,
        amountBeforeTax: 0,
        taxAmount: 0,
        totalAmount: 0,
        taxedCount: 0,
      };

      existing.amountBeforeTax += row.amountBeforeTax;
      existing.taxAmount += row.taxAmount;
      existing.totalAmount += row.totalAmount;
      if (row.taxAmount > 0) {
        existing.taxedCount += 1;
      }

      monthMap.set(month, existing);
    }

    const monthlyBreakdown = Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        month: item.month,
        monthName: item.monthName,
        amountBeforeTax: Number(item.amountBeforeTax.toFixed(2)),
        taxAmount: Number(item.taxAmount.toFixed(2)),
        totalAmount: Number(item.totalAmount.toFixed(2)),
        taxedCount: item.taxedCount,
      }));

    return {
      totalAmountBeforeTax: Number(totalAmountBeforeTax.toFixed(2)),
      totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
      totalAmountWithTax: Number(totalAmountWithTax.toFixed(2)),
      effectiveTaxRate: Number(effectiveTaxRate.toFixed(2)),
      taxedEntriesCount,
      nonTaxedEntriesCount,
      monthlyBreakdown,
      currency: 'SAR',
      generatedAt: new Date(),
    };
  }
}
