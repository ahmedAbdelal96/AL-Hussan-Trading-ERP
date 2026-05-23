/**
 * Payroll Calculator Component
 *
 * Helper utilities for payroll calculations across the application.
 * Provides centralized calculation logic for consistency.
 *
 * @module PayrollCalculator
 */

import { AllowanceFrequency } from "@/types/payroll.types";
import { CURRENCY } from "@/config/system.constants";
import {
  addMoney,
  subtractMoney,
  multiplyMoney,
  roundMoney,
  toMinorUnits,
  fromMinorUnits,
  formatMoney,
} from "@/lib/money";

/**
 * Payroll Calculator Class
 * Singleton class providing calculation utilities
 */
export class PayrollCalculator {
  /**
   * Calculate monthly equivalent for an allowance
   *
   * @param amount - Allowance amount
   * @param frequency - Payment frequency
   * @returns Monthly equivalent amount
   */
  static calculateMonthlyEquivalent(
    amount: number,
    frequency: AllowanceFrequency,
  ): number {
    switch (frequency) {
      case AllowanceFrequency.ONE_TIME:
        return 0;
      case AllowanceFrequency.DAILY:
        return multiplyMoney(amount, 30);
      case AllowanceFrequency.WEEKLY:
        // Average weeks per month (rounded in multiplyMoney)
        return multiplyMoney(amount, 4.33);
      case AllowanceFrequency.MONTHLY:
        return roundMoney(amount);
      case AllowanceFrequency.QUARTERLY:
        return multiplyMoney(amount, 1 / 3);
      case AllowanceFrequency.ANNUALLY:
        return multiplyMoney(amount, 1 / 12);
      default:
        return roundMoney(amount);
    }
  }

  /**
   * Calculate annual equivalent for an allowance
   */
  static calculateAnnualEquivalent(
    amount: number,
    frequency: AllowanceFrequency,
  ): number {
    const monthly = this.calculateMonthlyEquivalent(amount, frequency);
    return multiplyMoney(monthly, 12);
  }

  /**
   * Calculate loan installment amount
   *
   * @param totalAmount - Total loan amount
   * @param numberOfInstallments - Number of installments
   * @returns Installment amount per period
   */
  static calculateLoanInstallment(
    totalAmount: number,
    numberOfInstallments: number,
  ): number {
    if (numberOfInstallments <= 0) return 0;
    return roundMoney(totalAmount / numberOfInstallments);
  }

  /**
   * Calculate remaining loan amount
   *
   * @param totalAmount - Total loan amount
   * @param paidInstallments - Number of paid installments
   * @param installmentAmount - Amount per installment
   * @returns Remaining amount to be paid
   */
  static calculateRemainingLoanAmount(
    totalAmount: number,
    paidInstallments: number,
    installmentAmount: number,
  ): number {
    const paidAmount = roundMoney(paidInstallments * installmentAmount);
    const remainingMinor = Math.max(
      toMinorUnits(totalAmount) - toMinorUnits(paidAmount),
      0,
    );
    return fromMinorUnits(remainingMinor);
  }

  /**
   * Calculate loan progress percentage
   *
   * @param totalAmount - Total loan amount
   * @param remainingAmount - Remaining amount
   * @returns Progress percentage (0-100)
   */
  static calculateLoanProgress(
    totalAmount: number,
    remainingAmount: number,
  ): number {
    if (totalAmount <= 0) return 0;
    const paidAmount = totalAmount - remainingAmount;
    const percentage = (paidAmount / totalAmount) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  /**
   * Calculate total compensation (base salary + allowance amounts)
   *
   * Allowances are managed separately via EmployeeAllowance system.
   * Pass pre-computed allowance amounts if needed.
   *
   * @param baseSalary - Base salary amount
   * @param allowanceAmounts - Optional array of individual allowance amounts
   * @returns Total compensation
   */
  static calculateTotalCompensation(
    baseSalary: number,
    allowanceAmounts: number[] = [],
  ): number {
    return addMoney([baseSalary, ...allowanceAmounts]);
  }

  /**
   * Calculate net salary
   * Formula: baseSalary + totalAllowances - totalDeductions
   *
   * @param baseSalary - Base salary amount
   * @param totalAllowances - Sum of all allowances (monthly equivalent)
   * @param totalDeductions - Sum of all deductions
   * @returns Net salary amount
   */
  static calculateNetSalary(
    baseSalary: number,
    totalAllowances: number,
    totalDeductions: number,
  ): number {
    return subtractMoney(
      addMoney([baseSalary, totalAllowances]),
      totalDeductions,
    );
  }

  /**
   * Calculate total allowances (sum of monthly equivalents)
   *
   * @param allowances - Array of allowances with amount and frequency
   * @returns Total monthly allowances
   */
  static calculateTotalAllowances(
    allowances: Array<{ amount: number; frequency: AllowanceFrequency }>,
  ): number {
    const totals = allowances.map((allowance) =>
      this.calculateMonthlyEquivalent(allowance.amount, allowance.frequency),
    );
    return addMoney(totals);
  }

  /**
   * Calculate total deductions
   *
   * @param deductions - Array of deduction amounts
   * @returns Total deductions
   */
  static calculateTotalDeductions(
    deductions: Array<{ amount: number }>,
  ): number {
    return addMoney(deductions.map((deduction) => deduction.amount));
  }

  /**
   * Format currency with proper locale
   *
   * @param amount - Amount to format
   * @param currency - Currency code (default: SAR)
   * @param locale - Locale for formatting (default: ar-SA)
   * @returns Formatted currency string
   */
  static formatCurrency(
    amount: number,
    currency: string = CURRENCY.DEFAULT,
    locale: string = "ar-SA",
  ): string {
    return formatMoney(amount, currency, locale);
  }

  /**
   * Format percentage
   *
   * @param value - Value to format as percentage
   * @param decimals - Number of decimal places (default: 1)
   * @returns Formatted percentage string
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Validate installment amount against total
   * Ensures installment * numberOfInstallments equals total (within tolerance)
   *
   * @param totalAmount - Total loan amount
   * @param installmentAmount - Proposed installment amount
   * @param numberOfInstallments - Number of installments
   * @returns true if valid, false otherwise
   */
  static validateInstallmentAmount(
    totalAmount: number,
    installmentAmount: number,
    numberOfInstallments: number,
  ): boolean {
    const calculatedMinor = toMinorUnits(
      installmentAmount * numberOfInstallments,
    );
    const totalMinor = toMinorUnits(totalAmount);
    const toleranceMinor = 1; // Allow 1 cent difference due to rounding
    return Math.abs(calculatedMinor - totalMinor) <= toleranceMinor;
  }

  /**
   * Calculate expected installment amount (with proper rounding)
   *
   * @param totalAmount - Total loan amount
   * @param numberOfInstallments - Number of installments
   * @returns Properly rounded installment amount
   */
  static calculateExpectedInstallment(
    totalAmount: number,
    numberOfInstallments: number,
  ): number {
    if (numberOfInstallments <= 0) return 0;
    return roundMoney(totalAmount / numberOfInstallments);
  }
}

/**
 * Hook for using calculator in components
 * Provides a convenient way to access calculator methods with React
 */
export const usePayrollCalculator = () => {
  return PayrollCalculator;
};
