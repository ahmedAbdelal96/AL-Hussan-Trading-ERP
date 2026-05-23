/**
 * Deduction Type Badge Component
 *
 * Displays deduction type with color-coded badges.
 * Auto-approved types have different styling than manual approval types.
 *
 * @component
 */

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { DeductionType } from "@/types/payroll.types";
import {
  CreditCard,
  Shield,
  Calculator,
  AlertCircle,
  DollarSign,
  UserX,
  MoreHorizontal,
} from "lucide-react";

interface DeductionTypeBadgeProps {
  type: DeductionType;
  showIcon?: boolean;
  className?: string;
}

/**
 * Deduction type configuration
 *
 * Auto-approved types (Blue shades):
 * - LOAN_REPAYMENT, TAX, INSURANCE
 *
 * Manual approval types (Orange/Red shades):
 * - PENALTY, ABSENCE, ADVANCE_DEDUCTION, OTHER
 */
const typeConfig: Record<
  DeductionType,
  {
    variant: "default" | "secondary" | "success" | "destructive" | "outline";
    className: string;
    icon: React.ComponentType<{ className?: string }>;
    autoApproved: boolean;
  }
> = {
  [DeductionType.LOAN_REPAYMENT]: {
    variant: "default",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    icon: CreditCard,
    autoApproved: true,
  },
  [DeductionType.INSURANCE]: {
    variant: "default",
    className:
      "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    icon: Shield,
    autoApproved: true,
  },
  [DeductionType.TAX]: {
    variant: "default",
    className:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    icon: Calculator,
    autoApproved: true,
  },
  [DeductionType.PENALTY]: {
    variant: "default",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    icon: AlertCircle,
    autoApproved: false,
  },
  [DeductionType.ADVANCE_DEDUCTION]: {
    variant: "default",
    className:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    icon: DollarSign,
    autoApproved: false,
  },
  [DeductionType.ABSENCE]: {
    variant: "default",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: UserX,
    autoApproved: false,
  },
  [DeductionType.OTHER]: {
    variant: "secondary",
    className: "bg-secondary text-secondary-foreground",
    icon: MoreHorizontal,
    autoApproved: false,
  },
};

export const DeductionTypeBadge = ({
  type,
  showIcon = true,
  className = "",
}: DeductionTypeBadgeProps) => {
  const { t } = useTranslation();

  const config = typeConfig[type];
  const label = t(`payroll.employeeDeductions.deductionType.${type}`);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
};

/**
 * Utility function to check if deduction type is auto-approved
 */
export const isAutoApprovedDeduction = (type: DeductionType): boolean => {
  return typeConfig[type].autoApproved;
};
