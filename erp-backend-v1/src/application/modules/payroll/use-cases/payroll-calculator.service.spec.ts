import { Prisma } from '@prisma/client';
import { PayrollCalculatorService } from './payroll-calculator.service';
import type { IEmployeeDeductionRepository } from '../repositories';

describe('PayrollCalculatorService', () => {
  const makeService = () => {
    const deductionRepository = {
      findByDateRange: jest.fn(),
    } as unknown as IEmployeeDeductionRepository;
    return new PayrollCalculatorService(deductionRepository);
  };

  it('calculates monthly salary components with allowance frequencies and deductions', () => {
    const service = makeService();

    const allowances = [
      {
        amount: 3000,
        frequency: 'MONTHLY',
        allowanceType: { name: 'housing allowance' },
      },
      {
        amount: 1200,
        frequency: 'MONTHLY',
        allowanceType: { name: 'transport allowance' },
      },
      {
        amount: 2400,
        frequency: 'QUARTERLY',
        allowanceType: { name: 'food allowance' },
      },
      {
        amount: 12000,
        frequency: 'ANNUALLY',
        allowanceType: { name: 'site bonus' },
      },
    ];

    const loans = [{ installmentAmount: 500 }];
    const deductions = [
      { deductionType: 'INSURANCE', amount: 250 },
      { deductionType: 'TAX', amount: 150 },
      { deductionType: 'ABSENCE', amount: 100 },
      { deductionType: 'OTHER', amount: 50 },
      // Must be skipped in deductions loop and only counted from loans array.
      { deductionType: 'LOAN_REPAYMENT', amount: 9999 },
    ];

    const result = service.calculateSalaryComponents(
      10000,
      allowances,
      loans,
      deductions,
    );

    expect(result.baseSalary).toBe(10000);
    expect(result.housingAllowance).toBe(3000);
    expect(result.transportAllowance).toBe(1200);
    // 2400 quarterly => 800 monthly
    expect(result.foodAllowance).toBe(800);
    // 12000 annually => 1000 monthly
    expect(result.otherAllowances).toBe(1000);
    expect(result.totalAllowances).toBe(6000);
    expect(result.grossSalary).toBe(16000);

    expect(result.insuranceDeduction).toBe(250);
    expect(result.taxDeduction).toBe(150);
    expect(result.absenceDeduction).toBe(100);
    expect(result.otherDeductions).toBe(50);
    expect(result.loanDeduction).toBe(500);
    expect(result.totalDeductions).toBe(1050);
    expect(result.netSalary).toBe(14950);
  });

  it('never returns negative net salary', () => {
    const service = makeService();

    const result = service.calculateSalaryComponents(
      new Prisma.Decimal(1000),
      [],
      [{ installmentAmount: 900 }],
      [{ deductionType: 'TAX', amount: 400 }],
    );

    expect(result.grossSalary).toBe(1000);
    expect(result.totalDeductions).toBe(1300);
    expect(result.netSalary).toBe(0);
  });
});
