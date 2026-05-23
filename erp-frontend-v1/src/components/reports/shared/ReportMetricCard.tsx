/**
 * ============================================================================
 * REPORT METRIC CARD — Dedicated KPI Card for Reports
 * ============================================================================
 *
 * Purpose-built for reports: handles large numbers gracefully by:
 *   - Abbreviating large values (1,400,000 → 1.4M) with full value in tooltip
 *   - Auto-shrinking font size to fit longer strings
 *   - RTL-safe currency display
 *   - No truncation / ellipsis
 *
 * @component ReportMetricCard
 * @version 2.0.0
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendIndicator } from "./TrendIndicator";
import { CURRENCY } from "@/config/system.constants";

// ============ TYPES ============

export type MetricVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

export interface ReportMetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: LucideIcon;
  variant?: MetricVariant;
  /** Currency code (e.g. "SAR") — enables compact formatting */
  currency?: string;
  isPercentage?: boolean;
  className?: string;
}

// ============ COLOR STYLES ============

const variantStyles: Record<
  MetricVariant,
  { gradient: string; border: string; text: string; iconBg: string }
> = {
  default: {
    gradient:
      "from-[rgba(59,130,246,0.16)] to-[rgba(59,130,246,0.08)] dark:from-[rgba(96,165,250,0.12)] dark:to-[rgba(96,165,250,0.04)]",
    border: "border-blue-200/60 dark:border-[rgba(96,165,250,0.20)]",
    text: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-100/60 dark:bg-[rgba(96,165,250,0.14)]",
  },
  info: {
    gradient:
      "from-[rgba(59,130,246,0.16)] to-[rgba(59,130,246,0.08)] dark:from-[rgba(96,165,250,0.12)] dark:to-[rgba(96,165,250,0.04)]",
    border: "border-blue-200/60 dark:border-[rgba(96,165,250,0.20)]",
    text: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-100/60 dark:bg-[rgba(96,165,250,0.14)]",
  },
  success: {
    gradient:
      "from-green-100/50 to-green-50 dark:from-[rgba(34,197,94,0.12)] dark:to-[rgba(34,197,94,0.04)]",
    border: "border-green-200/60 dark:border-[rgba(34,197,94,0.20)]",
    text: "text-green-700 dark:text-green-300",
    iconBg: "bg-green-100/60 dark:bg-[rgba(34,197,94,0.14)]",
  },
  warning: {
    gradient:
      "from-[rgba(251,191,36,0.16)] to-[rgba(251,191,36,0.08)] dark:from-[rgba(251,191,36,0.14)] dark:to-[rgba(251,191,36,0.05)]",
    border: "border-amber-200/60 dark:border-[rgba(251,191,36,0.22)]",
    text: "text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-100/60 dark:bg-[rgba(251,191,36,0.16)]",
  },
  danger: {
    gradient:
      "from-red-100/50 to-red-50 dark:from-[rgba(248,113,113,0.12)] dark:to-[rgba(248,113,113,0.04)]",
    border: "border-red-200/60 dark:border-[rgba(248,113,113,0.20)]",
    text: "text-red-700 dark:text-red-300",
    iconBg: "bg-red-100/60 dark:bg-[rgba(248,113,113,0.14)]",
  },
  purple: {
    gradient:
      "from-purple-100/50 to-purple-50 dark:from-[rgba(168,85,247,0.12)] dark:to-[rgba(168,85,247,0.04)]",
    border: "border-purple-200/60 dark:border-[rgba(168,85,247,0.20)]",
    text: "text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-100/60 dark:bg-[rgba(168,85,247,0.14)]",
  },
};

// ============ NUMBER FORMATTING ============

/**
 * Compact abbreviation: 1_400_000 → "1.4M" | 85_000 → "85K" | 1_200_000_000 → "1.2B"
 */
function compactNumber(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    const v = abs / 1_000;
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return `${sign}${abs.toLocaleString("en-US")}`;
}

/** Full unabbreviated format (used in tooltip) */
function fullNumber(n: number, currency?: string): string {
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

interface Formatted {
  display: string;
  full: string;
  needsTooltip: boolean;
  isLTR: boolean;
}

function formatValue(
  value: string | number,
  currency?: string,
  isPercentage?: boolean,
): Formatted {
  // String passed directly (e.g. "85 days") — pass through unchanged
  if (typeof value === "string") {
    return { display: value, full: value, needsTooltip: false, isLTR: false };
  }

  if (isPercentage) {
    const s = `${value.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
    return { display: s, full: s, needsTooltip: false, isLTR: false };
  }

  if (currency) {
    const reportCurrency = CURRENCY.DEFAULT;
    const compact = compactNumber(value);
    const full = fullNumber(value, reportCurrency);
    return {
      display: `${reportCurrency} ${compact}`,
      full,
      needsTooltip: Math.abs(value) >= 10_000,
      isLTR: true,
    };
  }

  const compact = compactNumber(value);
  const full = fullNumber(value);
  return {
    display: compact,
    full,
    needsTooltip: Math.abs(value) >= 10_000,
    isLTR: false,
  };
}

/** Adaptive font size based on display string length */
function valueFontSize(display: string): string {
  // Strip BiDi marks before measuring
  const len = display.replace(/[\u200E\u200F]/g, "").length;
  if (len <= 5) return "text-xl font-bold";
  if (len <= 8) return "text-lg font-bold";
  if (len <= 11) return "text-base font-bold";
  return "text-sm font-bold";
}

// ============ COMPONENT ============

export const ReportMetricCard: React.FC<ReportMetricCardProps> = React.memo(
  ({
    label,
    value,
    trend,
    icon: Icon,
    variant = "default",
    currency,
    isPercentage,
    className = "",
  }) => {
    const { display, full, needsTooltip, isLTR } = formatValue(
      value,
      currency,
      isPercentage,
    );
    const styles = variantStyles[variant];
    const fontClass = valueFontSize(display);

    const valueNode = (
      <p
        className={[fontClass, "mt-1 leading-tight", styles.text].join(" ")}
        dir={isLTR ? "ltr" : undefined}
      >
        {display}
      </p>
    );

    return (
      <Card
        className={[
          "p-4 bg-gradient-to-br",
          "bg-[var(--surface)]/60 dark:bg-[var(--surface)]/60",
          styles.gradient,
          styles.border,
          "backdrop-blur-[2px]",
          className,
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Left: label + value + trend */}
          <div className="flex-1 min-w-0">
            {/* Label — allows 2 lines so it never truncates */}
            <p className="text-xs leading-tight text-[var(--text-tertiary)] line-clamp-2">
              {label}
            </p>

            {/* Value — with tooltip for large numbers */}
            {needsTooltip ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">{valueNode}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" dir="ltr">
                    <span className="font-mono text-sm">{full}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              valueNode
            )}

            {/* Trend indicator */}
            {trend !== undefined && (
              <div className="mt-1">
                <TrendIndicator value={trend} size="sm" />
              </div>
            )}
          </div>

          {/* Right: icon */}
          {Icon && (
            <div
              className={[
                "flex-shrink-0 w-9 h-9 rounded-lg mt-0.5",
                styles.iconBg,
                "flex items-center justify-center",
                "ring-1 ring-[rgba(255,255,255,0.06)]",
              ].join(" ")}
            >
              <Icon className={["w-4 h-4", styles.text].join(" ")} />
            </div>
          )}
        </div>
      </Card>
    );
  },
);

ReportMetricCard.displayName = "ReportMetricCard";

ReportMetricCard.displayName = "ReportMetricCard";

