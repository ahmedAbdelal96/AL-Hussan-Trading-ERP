import { BadRequestException } from '@nestjs/common';
import { EmployeeStatus } from '@prisma/client';
import type { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { PreviewPayrollUseCase } from './preview-payroll.use-case';
import type {
  IEmployeeAllowanceRepository,
  IEmployeeLoanRepository,
} from '../repositories';
import type { PayrollCalculatorService } from './payroll-calculator.service';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

interface PrismaMock {
  payslip: {
    findMany: MockFn<Promise<Array<{ id: string }>>, [unknown]>;
  };
  employee: {
    findMany: MockFn<Promise<Array<Record<string, unknown>>>, [unknown]>;
  };
}

describe('PreviewPayrollUseCase', () => {
  const makeUseCase = () => {
    const allowanceRepository: Pick<
      IEmployeeAllowanceRepository,
      'findActiveByEmployeeIdAtDate'
    > = {
      findActiveByEmployeeIdAtDate: jest.fn(),
    };

    const loanRepository: Pick<
      IEmployeeLoanRepository,
      'findActiveByEmployeeIdAtDate'
    > = {
      findActiveByEmployeeIdAtDate: jest.fn(),
    };

    const calculator: Pick<
      PayrollCalculatorService,
      'getMonthlyDeductions' | 'calculateSalaryComponents'
    > = {
      getMonthlyDeductions: jest.fn(),
      calculateSalaryComponents: jest.fn(),
    };

    const prisma: PrismaMock = {
      payslip: {
        findMany: jest.fn(),
      },
      employee: {
        findMany: jest.fn(),
      },
    };

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const useCase = new PreviewPayrollUseCase(
      allowanceRepository as IEmployeeAllowanceRepository,
      loanRepository as IEmployeeLoanRepository,
      calculator as PayrollCalculatorService,
      prisma as unknown as PrismaService,
      logger as WinstonLoggerService,
    );

    return {
      useCase,
      allowanceRepository,
      loanRepository,
      calculator,
      prisma,
    };
  };

  it('throws BadRequestException when month is out of range', async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        payPeriodMonth: 13,
        payPeriodYear: 2026,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when no active employees found', async () => {
    const { useCase, prisma } = makeUseCase();
    prisma.payslip.findMany.mockResolvedValue([]);
    prisma.employee.findMany.mockResolvedValue([]);

    await expect(
      useCase.execute({
        payPeriodMonth: 3,
        payPeriodYear: 2026,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns preview summary and captures per-employee errors without failing the whole run', async () => {
    const { useCase, prisma, allowanceRepository, loanRepository, calculator } =
      makeUseCase();

    prisma.payslip.findMany.mockResolvedValue([{ id: 'pay-1' }]);
    prisma.employee.findMany.mockResolvedValue([
      {
        id: 'emp-1',
        firstName: 'Faris',
        lastName: 'Obaid',
        employeeNumber: 'EMP-001',
        department: { nameAr: 'المالية', nameEn: 'Finance' },
        position: null,
        baseSalary: 10000,
        status: EmployeeStatus.ACTIVE,
      },
      {
        id: 'emp-2',
        firstName: 'Nora',
        lastName: 'Ali',
        employeeNumber: 'EMP-002',
        department: { nameAr: 'المشاريع', nameEn: 'Projects' },
        position: null,
        baseSalary: null,
        status: EmployeeStatus.ACTIVE,
      },
    ]);

    (
      allowanceRepository.findActiveByEmployeeIdAtDate as MockFn<
        Promise<Array<Record<string, unknown>>>,
        [string, number, number]
      >
    ).mockResolvedValue([]);
    (
      loanRepository.findActiveByEmployeeIdAtDate as MockFn<
        Promise<Array<Record<string, unknown>>>,
        [string, number, number]
      >
    ).mockResolvedValue([]);
    (
      calculator.getMonthlyDeductions as MockFn<
        Promise<Array<Record<string, unknown>>>,
        [string, number, number]
      >
    ).mockResolvedValue([]);

    (
      calculator.calculateSalaryComponents as MockFn<
        ReturnType<PayrollCalculatorService['calculateSalaryComponents']>,
        [
          number,
          Array<Record<string, unknown>>,
          Array<Record<string, unknown>>,
          Array<Record<string, unknown>>,
        ]
      >
    ).mockReturnValue({
      baseSalary: 10000,
      housingAllowance: 2000,
      transportAllowance: 800,
      foodAllowance: 400,
      otherAllowances: 300,
      totalAllowances: 3500,
      grossSalary: 13500,
      insuranceDeduction: 300,
      taxDeduction: 100,
      loanDeduction: 0,
      absenceDeduction: 0,
      otherDeductions: 50,
      totalDeductions: 450,
      netSalary: 13050,
      workingDays: 0,
      absentDays: 0,
      overtimeHours: 0,
      overtimeAmount: 0,
    });

    const result = await useCase.execute({
      payPeriodMonth: 3,
      payPeriodYear: 2026,
    });

    expect(result.alreadyProcessed).toBe(true);
    expect(result.totalEmployees).toBe(2);
    expect(result.employees).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.totalGrossSalary).toBe(13500);
    expect(result.totalDeductions).toBe(450);
    expect(result.totalNetSalary).toBe(13050);
  });
});
