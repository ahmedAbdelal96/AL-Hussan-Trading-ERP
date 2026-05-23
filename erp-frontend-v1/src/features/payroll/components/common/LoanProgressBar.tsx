/**
 * Loan Progress Bar Component
 *
 * Visual progress indicator for loan repayment status.
 * Shows paid vs remaining amount with percentage and installment counts.
 *
 * @component
 */

import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { CheckCircle2 } from "lucide-react";
import { CURRENCY } from "@/config/system.constants";

interface LoanProgressBarProps {
  loan: {
    amount: number;
    remainingAmount: number;
    installments: number;
    paidInstallments: number;
  };
  showDetails?: boolean;
  className?: string;
}

/**
 * Calculate loan progress information
 */
export const calculateLoanProgress = (loan: {
  amount: number;
  remainingAmount: number;
  installments: number;
  paidInstallments: number;
}): {
  paidAmount: number;
  paidPercentage: number;
  remainingInstallments: number;
} => {
  const paidAmount = loan.amount - loan.remainingAmount;
  const paidPercentage = (paidAmount / loan.amount) * 100;
  const remainingInstallments = loan.installments - loan.paidInstallments;

  return {
    paidAmount,
    paidPercentage: Math.min(Math.max(paidPercentage, 0), 100), // Clamp between 0-100
    remainingInstallments,
  };
};

export const LoanProgressBar = ({
  loan,
  showDetails = true,
  className = "",
}: LoanProgressBarProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const { paidAmount, paidPercentage, remainingInstallments } =
    calculateLoanProgress(loan);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: CURRENCY.DEFAULT,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const isComplete = paidPercentage >= 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        <Progress
          value={paidPercentage}
          className="h-2"
          indicatorClassName={isComplete ? "bg-green-500" : "bg-primary"}
        />
        {isComplete && (
          <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
        )}
      </div>

      {showDetails && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Left: Paid Amount */}
          <div className="flex items-center gap-1">
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(paidAmount)}
            </span>
            <span>{t("payroll.employeeLoans.form.calculated.paidAmount")}</span>
          </div>

          {/* Center: Percentage */}
          <div className="font-medium text-foreground">
            {paidPercentage.toFixed(1)}%
          </div>

          {/* Right: Remaining */}
          <div className="flex items-center gap-1">
            <span>
              {t("payroll.employeeLoans.form.calculated.remainingAmount")}:
            </span>
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {formatCurrency(loan.remainingAmount)}
            </span>
          </div>
        </div>
      )}

      {/* Installment Information */}
      {showDetails && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            <span className="font-medium">{loan.paidInstallments}</span>
            <span className="mx-1">/</span>
            <span>{loan.installments}</span>
            <span className="ml-1">
              {t("payroll.employeeLoans.table.installments")}
            </span>
          </div>
          {remainingInstallments > 0 && (
            <div>
              <span>{remainingInstallments}</span>
              <span className="ml-1">{t("payroll.common.remaining")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version - just the progress bar with percentage
 */
export const CompactLoanProgress = ({
  loan,
  className = "",
}: {
  loan: {
    amount: number;
    remainingAmount: number;
  };
  className?: string;
}) => {
  const { paidAmount, paidPercentage } = calculateLoanProgress({
    ...loan,
    installments: 0,
    paidInstallments: 0,
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Progress value={paidPercentage} className="h-1.5 flex-1" />
      <span className="text-xs font-medium text-muted-foreground min-w-[3rem] text-right">
        {paidPercentage.toFixed(0)}%
      </span>
    </div>
  );
};
