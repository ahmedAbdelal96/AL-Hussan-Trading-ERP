/**
 * Monthly Equivalent Display Component
 *
 * Displays allowance amount with its monthly equivalent calculation.
 * Useful for showing normalized values across different frequencies.
 *
 * Calculation formulas:
 * - DAILY: amount × 30
 * - WEEKLY: amount × 4.33
 * - MONTHLY: amount
 * - QUARTERLY: amount ÷ 3
 * - ANNUALLY: amount ÷ 12
 *
 * @component
 */

import { AllowanceFrequency } from "@/types/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { ArrowRight } from "lucide-react";
import { CURRENCY } from "@/config/system.constants";

interface MonthlyEquivalentDisplayProps {
  amount: number;
  frequency: AllowanceFrequency;
  currency?: string;
  showFormula?: boolean;
  className?: string;
}

/**
 * Calculate monthly equivalent based on frequency
 *
 * @param amount - Original amount
 * @param frequency - Payment frequency
 * @returns Monthly equivalent amount
 */
export const calculateMonthlyEquivalent = (
  amount: number,
  frequency: AllowanceFrequency,
): number => {
  switch (frequency) {
    case AllowanceFrequency.ONE_TIME:
      return 0; // One-time payments don't have monthly equivalent
    case AllowanceFrequency.DAILY:
      return amount * 30;
    case AllowanceFrequency.WEEKLY:
      return amount * 4.33; // Average weeks per month
    case AllowanceFrequency.MONTHLY:
      return amount;
    case AllowanceFrequency.QUARTERLY:
      return amount / 3;
    case AllowanceFrequency.ANNUALLY:
      return amount / 12;
    default:
      return amount;
  }
};

/**
 * Calculate annual equivalent based on frequency
 */
export const calculateAnnualEquivalent = (
  amount: number,
  frequency: AllowanceFrequency,
): number => {
  const monthly = calculateMonthlyEquivalent(amount, frequency);
  return monthly * 12;
};

export const MonthlyEquivalentDisplay = ({
  amount,
  frequency,
  currency = CURRENCY.DEFAULT,
  showFormula = false,
  className = "",
}: MonthlyEquivalentDisplayProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const monthlyEquivalent = calculateMonthlyEquivalent(amount, frequency);

  // Format currency with proper locale
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // One-time payments don't have monthly equivalent
  if (frequency === AllowanceFrequency.ONE_TIME) {
    return (
      <div className={`text-sm ${className}`}>
        <span className="font-medium">{formatCurrency(amount)}</span>
        <span className="text-muted-foreground ml-2">
          ({t("payroll.employeeAllowances.frequency.ONE_TIME")})
        </span>
      </div>
    );
  }

  // Monthly is the same as original amount
  if (frequency === AllowanceFrequency.MONTHLY) {
    return (
      <div className={`text-sm font-medium ${className}`}>
        {formatCurrency(amount)}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-muted-foreground">{formatCurrency(amount)}</span>
      {showFormula && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
      <span className="font-medium text-foreground">
        {formatCurrency(monthlyEquivalent)}
      </span>
      <span className="text-xs text-muted-foreground">
        / {t("payroll.common.monthly")}
      </span>
    </div>
  );
};

/**
 * Simple display of monthly equivalent value only
 */
export const MonthlyEquivalentValue = ({
  amount,
  frequency,
  currency = CURRENCY.DEFAULT,
}: {
  amount: number;
  frequency: AllowanceFrequency;
  currency?: string;
}) => {
  const { language } = useLanguageStore();
  const monthlyEquivalent = calculateMonthlyEquivalent(amount, frequency);

  const formatted = new Intl.NumberFormat(
    language === "ar" ? "ar-SA" : "en-US",
    {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(monthlyEquivalent);

  return <span className="font-medium">{formatted}</span>;
};
