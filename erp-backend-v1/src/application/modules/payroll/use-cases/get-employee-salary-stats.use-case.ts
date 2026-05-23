/**
 * Get Employee Salary Stats Use Case
 * Returns analytics about salary changes over time
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetEmployeeSalaryStatsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetEmployeeSalaryStatsUseCase.name);
  }

  async execute(employeeId: string) {
    this.logger.log(`Fetching salary stats for employee: ${employeeId}`);

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, baseSalary: true, currency: true },
    });

    if (!employee) {
      throw new NotFoundException(
        this.i18n.t('employees.errors.notFound', {
          args: { id: employeeId },
        }),
      );
    }

    const history = await this.prisma.salaryHistory.findMany({
      where: { employeeId },
      orderBy: { changedAt: 'asc' },
      select: {
        baseSalaryBefore: true,
        baseSalaryAfter: true,
        changedAt: true,
      },
    });

    const currentSalary = Number(employee.baseSalary ?? 0);
    const currency = employee.currency ?? 'SAR';

    let totalRaises = 0;
    let totalReductions = 0;
    let totalIncreaseAmount = 0;
    let totalDecreaseAmount = 0;
    let largestRaise = 0;
    let sumRaisePercentage = 0;
    let lastRaiseDate: Date | null = null;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    let salaryOneYearAgo: number | null = null;

    for (const record of history) {
      const before = Number(record.baseSalaryBefore);
      const after = Number(record.baseSalaryAfter);
      const diff = after - before;

      if (record.changedAt <= oneYearAgo) {
        salaryOneYearAgo = after;
      }

      if (diff > 0) {
        totalRaises += 1;
        totalIncreaseAmount += diff;
        largestRaise = Math.max(largestRaise, diff);
        const percentage = before === 0 ? 0 : (diff / before) * 100;
        sumRaisePercentage += percentage;
        lastRaiseDate = record.changedAt;
      } else if (diff < 0) {
        totalReductions += 1;
        totalDecreaseAmount += Math.abs(diff);
      }
    }

    const averageRaisePercentage =
      totalRaises > 0 ? sumRaisePercentage / totalRaises : 0;

    const daysSinceLastRaise = lastRaiseDate
      ? Math.floor(
          (Date.now() - lastRaiseDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    const yearOverYearGrowth =
      salaryOneYearAgo && salaryOneYearAgo > 0
        ? ((currentSalary - salaryOneYearAgo) / salaryOneYearAgo) * 100
        : 0;

    return {
      currentSalary,
      currency,
      totalRaises,
      totalReductions,
      averageRaisePercentage,
      largestRaise,
      totalIncreaseAmount,
      totalDecreaseAmount,
      lastRaiseDate: lastRaiseDate ? lastRaiseDate.toISOString() : null,
      daysSinceLastRaise,
      yearOverYearGrowth,
    };
  }
}
