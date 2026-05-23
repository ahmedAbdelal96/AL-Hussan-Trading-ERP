import { Injectable } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  PayrollStatisticsDto,
  EmploymentTypeBreakdownDto,
  DepartmentBreakdownDto,
  AllowanceStatBreakdownDto,
  DeductionStatBreakdownDto,
  LoanStatusBreakdownDto,
  MonthlyPayrollTrendDto,
  TopEmployeeDto,
} from '../dto/payroll-statistics.dto';
import {
  EmploymentType,
  DeductionType,
  DeductionStatus,
  LoanStatus,
  EmployeeStatus,
  Prisma,
} from '@prisma/client';

type ActiveEmployeeRecord = Prisma.EmployeeGetPayload<{
  select: {
    id: true;
    firstName: true;
    lastName: true;
    employeeNumber: true;
    department: { select: { nameAr: true; nameEn: true } };
    employmentType: true;
    baseSalary: true;
  };
}>;

type ActiveAllowanceRecord = Prisma.EmployeeAllowanceGetPayload<{
  include: {
    allowanceType: true;
    employee: { select: { id: true; employmentType: true } };
  };
}>;

type RecentDeductionRecord = Prisma.EmployeeDeductionGetPayload<{
  include: {
    employee: { select: { id: true; employmentType: true } };
  };
}>;

type ActiveLoanRecord = Prisma.EmployeeLoanGetPayload<{
  include: {
    employee: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

/**
 * ============================================================================
 * GET PAYROLL STATISTICS USE CASE
 * ============================================================================
 *
 * Comprehensive payroll analytics and reporting system
 *
 * ARCHITECTURE DECISIONS:
 * ========================
 *
 * 1. DATABASE OPTIMIZATION:
 *    - Uses raw Prisma aggregations for maximum performance
 *    - Minimizes N+1 queries by fetching related data in bulk
 *    - Leverages database indexes for fast filtering
 *    - Performs calculations in-memory after data fetch
 *
 * 2. DATA ACCURACY:
 *    - Only includes ACTIVE employees in salary calculations
 *    - Converts Prisma Decimal to Number for JSON serialization
 *    - Handles edge cases (division by zero, empty data sets)
 *    - Uses effective date filtering for time-sensitive data
 *
 * 3. SCALABILITY:
 *    - Efficient aggregation queries scale well with data growth
 *    - Percentage calculations done in-memory (O(n) complexity)
 *    - Optional date filtering for reporting flexibility
 *    - Top-N queries limit result size
 *
 * 4. MAINTAINABILITY:
 *    - Clear separation of calculation methods
 *    - Well-documented business logic
 *    - Reusable helper functions
 *    - Comprehensive error handling
 *
 * @version 1.0.0
 * @author ERP System - Senior Backend Developer
 */
@Injectable()
export class GetPayrollStatisticsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetPayrollStatisticsUseCase.name);
  }

  /**
   * Execute payroll statistics calculation
   *
   * @param startDate - Optional start date for filtering (defaults to current month)
   * @param endDate - Optional end date for filtering (defaults to current date)
   * @returns Complete payroll statistics
   *
   * PERFORMANCE: O(n) where n is number of active employees
   * DATABASE QUERIES: ~8-10 optimized queries with proper indexing
   */
  async execute(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PayrollStatisticsDto> {
    this.logger.log('Calculating payroll statistics...');

    try {
      const now = new Date();
      const effectiveDate = endDate || now;

      // Fetch all active employees with their base salary
      const activeEmployees: ActiveEmployeeRecord[] =
        await this.prisma.employee.findMany({
          where: {
            status: EmployeeStatus.ACTIVE,
            deletedAt: null,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            department: { select: { nameAr: true, nameEn: true } },
            employmentType: true,
            baseSalary: true,
          },
        });

      this.logger.log(`Found ${activeEmployees.length} active employees`);

      // Calculate overview metrics
      const totalBaseSalary = activeEmployees.reduce((sum, emp) => {
        return sum + (emp.baseSalary ? Number(emp.baseSalary) : 0);
      }, 0);

      const averageSalary =
        activeEmployees.length > 0
          ? totalBaseSalary / activeEmployees.length
          : 0;

      // Fetch active allowances (parallel query for performance)
      const [
        activeAllowances,
        recentDeductions,
        activeLoans,
        recentHires,
        recentLoanApprovals,
      ] = await Promise.all([
        this.fetchActiveAllowances(effectiveDate),
        this.fetchRecentDeductions(startDate, endDate),
        this.fetchActiveLoans(),
        this.fetchRecentHires(30), // Last 30 days
        this.fetchRecentLoanApprovals(30), // Last 30 days
      ]);

      // Calculate allowances total
      const totalAllowances = activeAllowances.reduce(
        (sum, allowance) => sum + Number(allowance.amount),
        0,
      );

      // Calculate deductions total
      const totalDeductions = recentDeductions.reduce(
        (sum, deduction) => sum + Number(deduction.amount),
        0,
      );

      // Calculate loan metrics
      const totalLoanAmount = activeLoans.reduce(
        (sum, loan) => sum + Number(loan.amount),
        0,
      );

      const remainingLoanBalance = activeLoans.reduce(
        (sum, loan) => sum + Number(loan.remainingAmount),
        0,
      );

      // Net payroll calculation
      const netPayroll = totalBaseSalary + totalAllowances - totalDeductions;

      // Calculate breakdowns (detailed analytics)
      const employmentTypeBreakdown = this.calculateEmploymentTypeBreakdown(
        activeEmployees,
        totalBaseSalary,
      );
      const departmentBreakdown = this.calculateDepartmentBreakdown(
        activeEmployees,
        totalBaseSalary,
      );
      const allowanceBreakdown = this.calculateAllowanceBreakdown(
        activeAllowances,
        totalAllowances,
      );
      const deductionBreakdown = this.calculateDeductionBreakdown(
        recentDeductions,
        totalDeductions,
      );
      const loanStatusBreakdown = this.calculateLoanStatusBreakdown(
        activeLoans,
        totalLoanAmount,
      );
      const [monthlyTrend, topEmployees] = await Promise.all([
        this.calculateMonthlyTrend(6), // Last 6 months
        this.calculateTopEmployees(activeEmployees, 10), // Top 10
      ]);

      // Calculate growth rate (current month vs previous month)
      const growthRate = await this.calculateGrowthRate();

      // Assemble complete statistics
      const statistics: PayrollStatisticsDto = {
        // Overview
        totalBaseSalary,
        totalAllowances,
        totalDeductions,
        netPayroll,
        totalEmployees: activeEmployees.length,
        averageSalary,
        activeLoanCount: activeLoans.filter(
          (l) =>
            l.status === LoanStatus.APPROVED && Number(l.remainingAmount) > 0,
        ).length,
        totalLoanAmount,
        remainingLoanBalance,

        // Breakdowns
        employmentTypeBreakdown,
        departmentBreakdown,
        allowanceBreakdown,
        deductionBreakdown,
        loanStatusBreakdown,

        // Trends
        monthlyTrend,
        topEmployees,

        // Recent Activity
        recentHires,
        recentLoanApprovals,
        growthRate,

        // Metadata
        currency: 'SAR',
        calculatedAt: new Date(),
      };

      this.logger.log('Payroll statistics calculated successfully');
      return statistics;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to calculate payroll statistics: ${errorMessage}`,
      );
      throw error;
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS - Data Fetching
  // ==========================================================================

  /**
   * Fetch active allowances for current period
   * Only includes allowances that are active and within effective dates
   */
  private async fetchActiveAllowances(
    effectiveDate: Date,
  ): Promise<ActiveAllowanceRecord[]> {
    return this.prisma.employeeAllowance.findMany({
      where: {
        status: 'APPROVED',
        effectiveFrom: { lte: effectiveDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveDate } }],
        employee: {
          status: EmployeeStatus.ACTIVE,
          deletedAt: null,
        },
      },
      include: {
        allowanceType: true,
        employee: {
          select: {
            id: true,
            employmentType: true,
          },
        },
      },
    });
  }

  /**
   * Fetch deductions for specified period
   * Defaults to current month if no date range provided
   */
  private async fetchRecentDeductions(
    startDate?: Date,
    endDate?: Date,
  ): Promise<RecentDeductionRecord[]> {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = now;

    return this.prisma.employeeDeduction.findMany({
      where: {
        status: DeductionStatus.APPROVED,
        deductionDate: {
          gte: startDate || defaultStart,
          lte: endDate || defaultEnd,
        },
        employee: {
          status: EmployeeStatus.ACTIVE,
          deletedAt: null,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            employmentType: true,
          },
        },
      },
    });
  }

  /**
   * Fetch all active loans (PENDING, APPROVED)
   */
  private async fetchActiveLoans(): Promise<ActiveLoanRecord[]> {
    return this.prisma.employeeLoan.findMany({
      where: {
        status: {
          in: [LoanStatus.PENDING, LoanStatus.APPROVED],
        },
        employee: {
          status: EmployeeStatus.ACTIVE,
          deletedAt: null,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Count new hires in last N days
   */
  private async fetchRecentHires(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.prisma.employee.count({
      where: {
        hireDate: { gte: cutoffDate },
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
      },
    });
  }

  /**
   * Count loans approved in last N days
   */
  private async fetchRecentLoanApprovals(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.prisma.employeeLoan.count({
      where: {
        approvedAt: { gte: cutoffDate },
        status: LoanStatus.APPROVED,
      },
    });
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS - Breakdown Calculations
  // ==========================================================================

  /**
   * Calculate salary distribution by employment type
   * Shows which employment types consume most of payroll budget
   */
  private calculateEmploymentTypeBreakdown(
    employees: ActiveEmployeeRecord[],
    totalSalary: number,
  ): EmploymentTypeBreakdownDto[] {
    const typeMap = new Map<
      EmploymentType,
      { count: number; totalSalary: number }
    >();

    // Initialize all employment types
    Object.values(EmploymentType).forEach((type) => {
      typeMap.set(type, { count: 0, totalSalary: 0 });
    });

    // Aggregate employees by type
    employees.forEach((emp) => {
      const salary = emp.baseSalary ? Number(emp.baseSalary) : 0;

      const current = typeMap.get(emp.employmentType);
      if (current) {
        current.count++;
        current.totalSalary += salary;
      }
    });

    // Convert to DTO array
    return Array.from(typeMap.entries())
      .map(([employmentType, data]) => ({
        employmentType,
        employeeCount: data.count,
        totalSalary: data.totalSalary,
        averageSalary: data.count > 0 ? data.totalSalary / data.count : 0,
        percentage:
          totalSalary > 0 ? (data.totalSalary / totalSalary) * 100 : 0,
      }))
      .filter((item) => item.employeeCount > 0) // Only include types with employees
      .sort((a, b) => b.totalSalary - a.totalSalary);
  }

  /**
   * Calculate salary distribution by department
   * Shows departmental payroll allocation
   */
  private calculateDepartmentBreakdown(
    employees: ActiveEmployeeRecord[],
    totalSalary: number,
  ): DepartmentBreakdownDto[] {
    const deptMap = new Map<string, { count: number; totalSalary: number }>();

    // Aggregate employees by department
    employees.forEach((emp) => {
      const dept =
        emp.department?.nameAr || emp.department?.nameEn || 'غير محدد';
      const salary = emp.baseSalary ? Number(emp.baseSalary) : 0;

      if (!deptMap.has(dept)) {
        deptMap.set(dept, { count: 0, totalSalary: 0 });
      }

      const current = deptMap.get(dept)!;
      current.count++;
      current.totalSalary += salary;
    });

    // Convert to DTO array and sort by total salary
    return Array.from(deptMap.entries())
      .map(([department, data]) => ({
        department,
        employeeCount: data.count,
        totalSalary: data.totalSalary,
        averageSalary: data.count > 0 ? data.totalSalary / data.count : 0,
        percentage:
          totalSalary > 0 ? (data.totalSalary / totalSalary) * 100 : 0,
      }))
      .sort((a, b) => b.totalSalary - a.totalSalary)
      .slice(0, 10); // Top 10 departments
  }

  /**
   * Calculate allowance distribution by type
   * Optimized: Fetches allowance type names in bulk to avoid N+1 queries
   */
  private calculateAllowanceBreakdown(
    allowances: ActiveAllowanceRecord[],
    totalAmount: number,
  ): AllowanceStatBreakdownDto[] {
    // allowanceType is already included from fetchActiveAllowances query
    // No need for additional DB queries

    // Aggregate allowances by type
    const typeMap = new Map<
      string,
      {
        name: string;
        count: number;
        totalAmount: number;
        employees: Set<string>;
      }
    >();

    allowances.forEach((allowance) => {
      const typeId = allowance.allowanceTypeId;

      if (!typeMap.has(typeId)) {
        typeMap.set(typeId, {
          name: allowance.allowanceType?.name || 'Unknown',
          count: 0,
          totalAmount: 0,
          employees: new Set(),
        });
      }

      const current = typeMap.get(typeId)!;
      current.count++;
      current.totalAmount += Number(allowance.amount);
      current.employees.add(allowance.employee.id);
    });

    // Convert to DTO array
    return Array.from(typeMap.entries())
      .map(([allowanceTypeId, data]) => ({
        allowanceTypeId,
        allowanceTypeName: data.name,
        employeeCount: data.employees.size,
        totalAmount: data.totalAmount,
        averageAmount:
          data.employees.size > 0 ? data.totalAmount / data.employees.size : 0,
        percentage:
          totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10); // Top 10 allowance types
  }

  /**
   * Calculate deduction distribution by type
   */
  private calculateDeductionBreakdown(
    deductions: RecentDeductionRecord[],
    totalAmount: number,
  ): DeductionStatBreakdownDto[] {
    const typeMap = new Map<
      DeductionType,
      { count: number; totalAmount: number; employees: Set<string> }
    >();

    // Initialize all deduction types
    Object.values(DeductionType).forEach((type) => {
      typeMap.set(type, { count: 0, totalAmount: 0, employees: new Set() });
    });

    // Aggregate deductions by type
    deductions.forEach((deduction) => {
      const current = typeMap.get(deduction.deductionType);
      if (current) {
        current.count++;
        current.totalAmount += Number(deduction.amount);
        current.employees.add(deduction.employee.id);
      }
    });

    // Convert to DTO array
    return Array.from(typeMap.entries())
      .map(([deductionType, data]) => ({
        deductionType,
        employeeCount: data.employees.size,
        totalAmount: data.totalAmount,
        averageAmount:
          data.employees.size > 0 ? data.totalAmount / data.employees.size : 0,
        percentage:
          totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0,
      }))
      .filter((item) => item.totalAmount > 0) // Only include types with deductions
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Calculate loan distribution by status
   */
  private calculateLoanStatusBreakdown(
    loans: ActiveLoanRecord[],
    totalAmount: number,
  ): LoanStatusBreakdownDto[] {
    const statusMap = new Map<
      LoanStatus,
      { count: number; totalAmount: number; remainingAmount: number }
    >();

    // Initialize relevant loan statuses
    [LoanStatus.PENDING, LoanStatus.APPROVED, LoanStatus.REJECTED].forEach(
      (status) => {
        statusMap.set(status, { count: 0, totalAmount: 0, remainingAmount: 0 });
      },
    );

    // Aggregate loans by status
    loans.forEach((loan) => {
      const current = statusMap.get(loan.status);
      if (current) {
        current.count++;
        current.totalAmount += Number(loan.amount);
        current.remainingAmount += Number(loan.remainingAmount);
      }
    });

    // Convert to DTO array
    return Array.from(statusMap.entries())
      .map(([status, data]) => ({
        status,
        loanCount: data.count,
        totalAmount: data.totalAmount,
        remainingAmount: data.remainingAmount,
        percentage:
          totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0,
      }))
      .filter((item) => item.loanCount > 0) // Only include statuses with loans
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS - Trend Calculations
  // ==========================================================================

  /**
   * Calculate monthly payroll trend
   * Shows payroll evolution over last N months
   *
   * COMPLEXITY: O(m * e) where m = months, e = employees
   * Optimized by using grouped aggregation queries
   */
  private async calculateMonthlyTrend(
    months: number,
  ): Promise<MonthlyPayrollTrendDto[]> {
    const trend: MonthlyPayrollTrendDto[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Count active employees in that month
      const employeeCount = await this.prisma.employee.count({
        where: {
          hireDate: { lte: nextMonth },
          status: EmployeeStatus.ACTIVE,
          deletedAt: null,
        },
      });

      // Sum baseSalary for employees active in that month
      const salaryAgg = await this.prisma.employee.aggregate({
        where: {
          hireDate: { lte: nextMonth },
          status: EmployeeStatus.ACTIVE,
          deletedAt: null,
        },
        _sum: { baseSalary: true },
      });

      const baseSalaries = Number(salaryAgg._sum.baseSalary) || 0;

      // Get allowances for that month
      const allowances = await this.prisma.employeeAllowance.findMany({
        where: {
          status: 'APPROVED',
          effectiveFrom: { lte: nextMonth },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthDate } }],
          employee: {
            status: EmployeeStatus.ACTIVE,
            deletedAt: null,
          },
        },
        select: {
          amount: true,
        },
      });

      const totalAllowances = allowances.reduce(
        (sum, a) => sum + Number(a.amount),
        0,
      );

      // Get deductions for that month (only approved)
      const deductions = await this.prisma.employeeDeduction.findMany({
        where: {
          status: DeductionStatus.APPROVED,
          deductionDate: {
            gte: monthDate,
            lt: nextMonth,
          },
          employee: {
            status: EmployeeStatus.ACTIVE,
            deletedAt: null,
          },
        },
        select: {
          amount: true,
        },
      });

      const totalDeductions = deductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0,
      );

      const totalPayroll = baseSalaries + totalAllowances;
      const netPayroll = totalPayroll - totalDeductions;

      trend.push({
        month: monthLabel,
        totalPayroll,
        baseSalaries,
        totalAllowances,
        totalDeductions,
        netPayroll,
        employeeCount,
      });
    }

    return trend;
  }

  /**
   * Calculate top earning employees
   * Based on base salary + active allowances
   */
  private async calculateTopEmployees(
    employees: ActiveEmployeeRecord[],
    limit: number,
  ): Promise<TopEmployeeDto[]> {
    const now = new Date();
    const employeeIds = employees.map((emp) => emp.id);

    // Batch fetch all approved allowances for all employees (single query)
    const allAllowances = await this.prisma.employeeAllowance.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: 'APPROVED',
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      select: {
        employeeId: true,
        amount: true,
      },
    });

    // Group allowances by employee ID
    const allowancesByEmployee = new Map<string, number>();
    allAllowances.forEach((a) => {
      const current = allowancesByEmployee.get(a.employeeId) || 0;
      allowancesByEmployee.set(a.employeeId, current + Number(a.amount));
    });

    // Calculate total compensation for each employee
    const employeeCompensation = employees.map((emp) => {
      const baseSalary = emp.baseSalary ? Number(emp.baseSalary) : 0;

      const totalAllowances = allowancesByEmployee.get(emp.id) || 0;

      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeNumber: emp.employeeNumber,
        department:
          emp.department?.nameAr || emp.department?.nameEn || 'غير محدد',
        employmentType: emp.employmentType,
        baseSalary,
        totalAllowances,
        totalCompensation: baseSalary + totalAllowances,
      };
    });

    // Sort by total compensation and return top N
    return employeeCompensation
      .sort((a, b) => b.totalCompensation - a.totalCompensation)
      .slice(0, limit);
  }

  /**
   * Calculate payroll growth rate
   * Compares current month to previous month
   *
   * @returns Growth rate as percentage (e.g., 5.5 for 5.5% growth)
   */
  private async calculateGrowthRate(): Promise<number> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Current month payroll - employees hired before end of current month
    const currentAgg = await this.prisma.employee.aggregate({
      where: {
        hireDate: { lte: nextMonth },
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
      },
      _sum: { baseSalary: true },
    });

    const currentPayroll = Number(currentAgg._sum.baseSalary) || 0;

    // Previous month payroll - employees hired before start of current month
    const previousAgg = await this.prisma.employee.aggregate({
      where: {
        hireDate: { lte: currentMonth },
        status: EmployeeStatus.ACTIVE,
        deletedAt: null,
      },
      _sum: { baseSalary: true },
    });

    const previousPayroll = Number(previousAgg._sum.baseSalary) || 0;

    // Calculate growth rate
    if (previousPayroll === 0) return 0;

    return ((currentPayroll - previousPayroll) / previousPayroll) * 100;
  }
}
