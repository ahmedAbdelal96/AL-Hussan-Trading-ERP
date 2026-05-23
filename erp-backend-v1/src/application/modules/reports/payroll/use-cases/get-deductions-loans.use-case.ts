import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  DeductionsLoansFiltersDto,
  DeductionsLoansReportResponseDto,
  LoansSummaryDto,
  LoansByStatusDto,
  DeductionSummaryItemDto,
} from '../dto';
import { EmployeeStatus, LoanStatus, DeductionStatus } from '@prisma/client';
import { resolveEmployeeIdsBySiteThroughProjects } from './payroll-scope.helper';

@Injectable()
export class GetDeductionsLoansUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: DeductionsLoansFiltersDto,
  ): Promise<DeductionsLoansReportResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();
    const employeeStatus = filters.employeeStatus || EmployeeStatus.ACTIVE;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const siteEmployeeIds = filters.siteId
      ? await resolveEmployeeIdsBySiteThroughProjects(
          this.prisma,
          filters.siteId,
          startDate,
          endDate,
        )
      : null;

    const employees = await this.prisma.employee.findMany({
      where: {
        status: employeeStatus,
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(siteEmployeeIds && { id: { in: siteEmployeeIds } }),
      },
      select: { id: true },
    });

    const employeeIds = employees.map((emp) => emp.id);

    let loansSummary: LoansSummaryDto | undefined;
    let loansByStatus: LoansByStatusDto[] | undefined;

    if (filters.includeLoans !== false) {
      const loans = await this.prisma.employeeLoan.findMany({
        where: {
          employeeId: { in: employeeIds },
          ...(filters.overdueLoansOnly && {
            status: LoanStatus.APPROVED,
            remainingAmount: { gt: 0 },
            expectedEndDate: { lt: now },
          }),
        },
      });

      const totalOutstanding = loans.reduce(
        (sum, loan) => sum + Number(loan.remainingAmount),
        0,
      );

      // Calculate paid this month (simplified - would need payment tracking)
      const totalPaidThisMonth = 0;

      const activeLoansCount = loans.filter(
        (l) =>
          l.status === LoanStatus.APPROVED && Number(l.remainingAmount) > 0,
      ).length;
      const pendingLoansCount = loans.filter(
        (l) => l.status === LoanStatus.PENDING,
      ).length;
      const paidOffLoansCount = loans.filter(
        (l) =>
          l.status === LoanStatus.APPROVED && Number(l.remainingAmount) === 0,
      ).length;
      const overdueLoansCount = loans.filter(
        (l) =>
          l.status === LoanStatus.APPROVED &&
          Number(l.remainingAmount) > 0 &&
          l.endDate &&
          l.endDate < now,
      ).length;

      const avgLoanAmount =
        loans.length > 0
          ? loans.reduce((sum, l) => sum + Number(l.amount), 0) / loans.length
          : 0;
      const avgRemainingBalance =
        loans.length > 0 ? totalOutstanding / loans.length : 0;

      loansSummary = {
        totalOutstanding,
        totalPaidThisMonth,
        activeLoanCount: activeLoansCount,
        pendingLoanCount: pendingLoansCount,
        paidOffCount: paidOffLoansCount,
        overdueCount: overdueLoansCount,
        avgLoanAmount,
        avgRemainingBalance,
      };

      // Group by status
      const statusMap = new Map<
        LoanStatus,
        { count: number; total: number; remaining: number }
      >();
      loans.forEach((loan) => {
        const existing = statusMap.get(loan.status) || {
          count: 0,
          total: 0,
          remaining: 0,
        };
        existing.count += 1;
        existing.total += Number(loan.amount);
        existing.remaining += Number(loan.remainingAmount);
        statusMap.set(loan.status, existing);
      });

      loansByStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
        status,
        statusName: this.getLoanStatusName(status),
        count: data.count,
        totalAmount: data.total,
        totalRemaining: data.remaining,
        percentageOfTotal: this.baseReportService.calculatePercentage(
          data.total,
          loans.reduce((sum, l) => sum + Number(l.amount), 0),
        ),
      }));
    }

    let deductionsByType: DeductionSummaryItemDto[] | undefined;
    let totalDeductions = 0;

    if (filters.includeDeductions !== false) {
      const deductions = await this.prisma.employeeDeduction.findMany({
        where: {
          employeeId: { in: employeeIds },
          deductionDate: { gte: startDate, lte: endDate },
          status: DeductionStatus.APPROVED,
        },
      });

      totalDeductions = deductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0,
      );

      // Group by type
      const typeMap = new Map<string, { total: number; count: number }>();
      deductions.forEach((deduction) => {
        const type = deduction.deductionType;
        const existing = typeMap.get(type) || { total: 0, count: 0 };
        existing.total += Number(deduction.amount);
        existing.count += 1;
        typeMap.set(type, existing);
      });

      deductionsByType = Array.from(typeMap.entries()).map(([type, data]) => ({
        deductionType: type as any,
        deductionTypeName: this.getDeductionTypeName(type),
        totalAmount: data.total,
        employeeCount: data.count,
        percentageOfTotal: this.baseReportService.calculatePercentage(
          data.total,
          totalDeductions,
        ),
        avgAmount: data.total / data.count,
      }));
    }

    return {
      loansSummary: loansSummary || {
        totalOutstanding: 0,
        totalPaidThisMonth: 0,
        activeLoanCount: 0,
        pendingLoanCount: 0,
        paidOffCount: 0,
        overdueCount: 0,
        avgLoanAmount: 0,
        avgRemainingBalance: 0,
      },
      loansByStatus: loansByStatus || [],
      totalDeductions,
      deductionsByType: deductionsByType || [],
      currency: 'SAR',
      month,
      year,
      generatedAt: new Date(),
    };
  }

  private getLoanStatusName(status: LoanStatus): string {
    const names: Record<LoanStatus, string> = {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      COMPLETED: 'Completed',
    };
    return names[status] || status;
  }

  private getDeductionTypeName(type: string): string {
    const names: Record<string, string> = {
      LOAN_REPAYMENT: 'Loan Repayment',
      INSURANCE: 'Insurance',
      TAX: 'Tax',
      PENALTY: 'Penalty',
      ADVANCE_DEDUCTION: 'Advance Deduction',
      ABSENCE: 'Absence',
      OTHER: 'Other',
    };
    return names[type] || type;
  }
}
