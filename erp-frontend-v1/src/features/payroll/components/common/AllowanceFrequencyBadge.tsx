/**
 * Allowance Frequency Badge Component
 *
 * Displays allowance frequency with color-coded badges based on frequency type.
 * Uses semantic colors from index.css for consistency.
 *
 * @component
 */

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { AllowanceFrequency } from "@/types/payroll.types";

interface AllowanceFrequencyBadgeProps {
  frequency: AllowanceFrequency;
  className?: string;
}

/**
 * Maps frequency types to badge variants and colors
 * Color scheme follows semantic meaning:
 * - ONE_TIME: Default (neutral)
 * - DAILY: Blue (high frequency)
 * - WEEKLY: Green (moderate frequency)
 * - MONTHLY: Default (standard)
 * - QUARTERLY: Yellow (low frequency)
 * - ANNUALLY: Secondary (very low frequency)
 */
const frequencyConfig: Record<
  AllowanceFrequency,
  {
    variant: "default" | "secondary" | "success" | "destructive" | "outline";
    className: string;
  }
> = {
  [AllowanceFrequency.ONE_TIME]: {
    variant: "default",
    className:
      "border-[var(--accent-primary-subtle)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary-foreground)]",
  },
  [AllowanceFrequency.DAILY]: {
    variant: "default",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  [AllowanceFrequency.WEEKLY]: {
    variant: "success",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  [AllowanceFrequency.MONTHLY]: {
    variant: "default",
    className: "bg-accent text-accent-foreground",
  },
  [AllowanceFrequency.QUARTERLY]: {
    variant: "default",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  },
  [AllowanceFrequency.ANNUALLY]: {
    variant: "secondary",
    className: "bg-secondary text-secondary-foreground",
  },
};

export const AllowanceFrequencyBadge = ({
  frequency,
  className = "",
}: AllowanceFrequencyBadgeProps) => {
  const { t } = useTranslation();

  const config = frequencyConfig[frequency];
  const label = t(`payroll.employeeAllowances.frequency.${frequency}`);

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {label}
    </Badge>
  );
};
