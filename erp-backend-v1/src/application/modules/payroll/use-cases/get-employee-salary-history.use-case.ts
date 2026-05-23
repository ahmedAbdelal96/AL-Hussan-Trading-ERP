/**
 * Get Employee Salary History Use Case
 * Returns paginated salary history entries for a specific employee
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { I18nService } from 'nestjs-i18n';
import {
  PaginationQueryDto,
  PaginationMetaDto,
  calculateSkip,
} from '../../../common/dto/pagination.dto';

@Injectable()
export class GetEmployeeSalaryHistoryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetEmployeeSalaryHistoryUseCase.name);
  }

  async execute(employeeId: string, query: PaginationQueryDto) {
    this.logger.log(`Fetching salary history for employee: ${employeeId}`);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException(
        this.i18n.t('employees.errors.notFound', {
          args: { id: employeeId },
        }),
      );
    }

    const [totalItems, history] = await Promise.all([
      this.prisma.salaryHistory.count({ where: { employeeId } }),
      this.prisma.salaryHistory.findMany({
        where: { employeeId },
        orderBy: { changedAt: 'desc' },
        skip: calculateSkip(page, pageSize),
        take: pageSize,
        include: {
          changer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const data = history.map((record) => {
      const baseSalaryBefore = Number(record.baseSalaryBefore);
      const baseSalaryAfter = Number(record.baseSalaryAfter);
      const changeAmount = baseSalaryAfter - baseSalaryBefore;
      const changePercentage =
        baseSalaryBefore === 0 ? 0 : (changeAmount / baseSalaryBefore) * 100;

      return {
        id: record.id,
        employeeId: record.employeeId,
        baseSalaryBefore,
        baseSalaryAfter,
        changeAmount,
        changePercentage,
        isRaise: changeAmount > 0,
        reason: record.reason,
        source: record.source,
        changedAt: record.changedAt,
        changedBy: record.changedBy,
        changedByUser: record.changer
          ? {
              id: record.changer.id,
              firstName: record.changer.firstName,
              lastName: record.changer.lastName,
              email: record.changer.email ?? undefined,
            }
          : undefined,
        createdAt: record.changedAt,
      };
    });

    return {
      data,
      meta: new PaginationMetaDto(page, pageSize, totalItems),
    };
  }
}
