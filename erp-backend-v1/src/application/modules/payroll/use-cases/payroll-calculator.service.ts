/**
 * Payroll Calculator Service
 * Shared salary calculation logic used by both ProcessPayroll and PreviewPayroll
 */

import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  EMPLOYEE_DEDUCTION_REPOSITORY,
  type IEmployeeDeductionRepository,
} from '../repositories';

export interface SalaryComponents {
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  totalAllowances: number;
  grossSalary: number;
  insuranceDeduction: number;
  taxDeduction: number;
  loanDeduction: number;
  absenceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  absentDays: number;
  overtimeHours: number;
  overtimeAmount: number;
}

interface AllowanceTypeLike {
  name?: string | null;
}

interface PayrollAllowanceInput {
  amount?: number | Prisma.Decimal | null;
  frequency?: string | null;
  allowanceType?: AllowanceTypeLike | null;
}

interface PayrollLoanInput {
  installmentAmount?: number | Prisma.Decimal | null;
}

interface PayrollDeductionInput {
  deductionType?: string | null;
  amount?: number | Prisma.Decimal | null;
}

@Injectable()
export class PayrollCalculatorService {
  private static readonly HOUSING_ALLOWANCE_NAMES = [
    'housing allowance',
    'بدل سكن',
  ];
  private static readonly TRANSPORT_ALLOWANCE_NAMES = [
    'transport allowance',
    'transportation allowance',
    'بدل نقل',
  ];
  private static readonly FOOD_ALLOWANCE_NAMES = ['food allowance', 'بدل طعام'];

  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly deductionRepository: IEmployeeDeductionRepository,
  ) {}

  /**
   * Get monthly deductions (approved only, filtered by date range)
   */
  async getMonthlyDeductions(employeeId: string, month: number, year: number) {
    // Use UTC boundaries to avoid timezone drift that can leak previous-month
    // deductions into the current payroll period.
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return this.deductionRepository.findByDateRange(
      startDate,
      endDate,
      employeeId,
    );
  }

  /**
   * Calculate all salary components
   * @param baseSalaryInput - base salary amount (number or Decimal)
   */
  calculateSalaryComponents(
    baseSalaryInput: number | Prisma.Decimal,
    allowances: PayrollAllowanceInput[],
    loans: PayrollLoanInput[],
    deductions: PayrollDeductionInput[],
  ): SalaryComponents {
    const baseSalary = new Prisma.Decimal(baseSalaryInput);

    // Classify allowances by type name, converting to monthly equivalent
    let housingAllowance = new Prisma.Decimal(0);
    let transportAllowance = new Prisma.Decimal(0);
    let foodAllowance = new Prisma.Decimal(0);
    let otherAllowances = new Prisma.Decimal(0);

    allowances.forEach((allowance) => {
      const rawAmount = new Prisma.Decimal(allowance.amount || 0);
      const frequency = allowance.frequency || 'MONTHLY';
      let amount: Prisma.Decimal;

      switch (frequency) {
        case 'MONTHLY':
          amount = rawAmount;
          break;
        case 'QUARTERLY':
          amount = rawAmount.dividedBy(3);
          break;
        case 'ANNUALLY':
          amount = rawAmount.dividedBy(12);
          break;
        case 'ONE_TIME':
          // ONE_TIME allowances are only fetched when effectiveFrom is within the pay period month
          // (enforced by findActiveByEmployeeIdAtDate query), so include the full amount
          amount = rawAmount;
          break;
        case 'DAILY':
          amount = rawAmount.times(22);
          break;
        case 'WEEKLY':
          amount = rawAmount.times(new Prisma.Decimal('4.33'));
          break;
        default:
          amount = rawAmount;
      }

      const typeName = (allowance.allowanceType?.name || '').toLowerCase();

      if (PayrollCalculatorService.HOUSING_ALLOWANCE_NAMES.includes(typeName)) {
        housingAllowance = housingAllowance.plus(amount);
      } else if (
        PayrollCalculatorService.TRANSPORT_ALLOWANCE_NAMES.includes(typeName)
      ) {
        transportAllowance = transportAllowance.plus(amount);
      } else if (
        PayrollCalculatorService.FOOD_ALLOWANCE_NAMES.includes(typeName)
      ) {
        foodAllowance = foodAllowance.plus(amount);
      } else {
        otherAllowances = otherAllowances.plus(amount);
      }
    });

    const totalAllowances = housingAllowance
      .plus(transportAllowance)
      .plus(foodAllowance)
      .plus(otherAllowances);

    const grossSalary = baseSalary.plus(totalAllowances);

    // Calculate deductions by type
    let insuranceDeduction = new Prisma.Decimal(0);
    let taxDeduction = new Prisma.Decimal(0);
    let absenceDeduction = new Prisma.Decimal(0);
    let otherDeductionsAmount = new Prisma.Decimal(0);

    deductions.forEach((deduction) => {
      // Skip LOAN_REPAYMENT deductions - already calculated from loans array
      if (deduction.deductionType === 'LOAN_REPAYMENT') return;

      const amount = new Prisma.Decimal(deduction.amount || 0);
      switch (deduction.deductionType) {
        case 'INSURANCE':
          insuranceDeduction = insuranceDeduction.plus(amount);
          break;
        case 'TAX':
          taxDeduction = taxDeduction.plus(amount);
          break;
        case 'ABSENCE':
          absenceDeduction = absenceDeduction.plus(amount);
          break;
        default:
          otherDeductionsAmount = otherDeductionsAmount.plus(amount);
          break;
      }
    });

    // Calculate loan deductions (monthly installments for approved loans)
    const loanDeduction = loans.reduce((sum, loan) => {
      return sum.plus(new Prisma.Decimal(loan.installmentAmount || 0));
    }, new Prisma.Decimal(0));

    const totalDeductions = insuranceDeduction
      .plus(taxDeduction)
      .plus(loanDeduction)
      .plus(absenceDeduction)
      .plus(otherDeductionsAmount);

    const netSalaryRaw = grossSalary.minus(totalDeductions);
    const netSalary = netSalaryRaw.isNegative()
      ? new Prisma.Decimal(0)
      : netSalaryRaw;

    return {
      baseSalary: baseSalary.toNumber(),
      housingAllowance: housingAllowance.toNumber(),
      transportAllowance: transportAllowance.toNumber(),
      foodAllowance: foodAllowance.toNumber(),
      otherAllowances: otherAllowances.toNumber(),
      totalAllowances: totalAllowances.toNumber(),
      grossSalary: grossSalary.toNumber(),
      insuranceDeduction: insuranceDeduction.toNumber(),
      taxDeduction: taxDeduction.toNumber(),
      loanDeduction: loanDeduction.toNumber(),
      absenceDeduction: absenceDeduction.toNumber(),
      otherDeductions: otherDeductionsAmount.toNumber(),
      totalDeductions: totalDeductions.toNumber(),
      netSalary: netSalary.toNumber(),
      workingDays: 0,
      absentDays: 0,
      overtimeHours: 0,
      overtimeAmount: 0,
    };
  }
}
