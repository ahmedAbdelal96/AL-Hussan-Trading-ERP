/**
 * ============================================================================
 * TREND INDICATOR - Universal Component
 * ============================================================================
 *
 * Visual trend indicator showing growth/decline with icon and percentage.
 * Used across all report modules for displaying trends.
 *
 * Features:
 * - Auto color coding (green for positive, red for negative)
 * - Icon support (TrendingUp, TrendingDown, Minus)
 * - Multiple sizes (sm, md, lg)
 * - Optional icon and value display
 * - RTL support
 *
 * @component TrendIndicator
 * @version 1.0.0
 */

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  /** Trend value (positive/negative percentage) */
  value: number;
  /** Display size */
  size?: "sm" | "md" | "lg";
  /** Show trending icon */
  showIcon?: boolean;
  /** Show percentage value */
  showValue?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Trend Indicator Component
 *
 * Design decisions:
 * - Green for positive trends (growth)
 * - Red for negative trends (decline)
 * - Gray for neutral (zero change)
 * - Icon automatically selected based on value
 *
 * Performance:
 * - React.memo prevents unnecessary re-renders
 * - Memoized style calculations
 */
const TrendIndicator: React.FC<TrendIndicatorProps> = React.memo(
  ({
    value,
    size = "md",
    showIcon = true,
    showValue = true,
    className = "",
  }) => {
    /**
     * Determine trend direction and styling
     */
    const trendType = value > 0 ? "up" : value < 0 ? "down" : "neutral";

    /**
     * Size configurations
     */
    const sizeConfig = {
      sm: {
        text: "text-xs",
        icon: "h-3 w-3",
        padding: "px-1.5 py-0.5",
      },
      md: {
        text: "text-sm",
        icon: "h-4 w-4",
        padding: "px-2 py-1",
      },
      lg: {
        text: "text-base",
        icon: "h-5 w-5",
        padding: "px-3 py-1.5",
      },
    };

    /**
     * Color and icon configurations
     */
    const trendConfig = {
      up: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-300",
        icon: TrendingUp,
      },
      down: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-300",
        icon: TrendingDown,
      },
      neutral: {
        bg: "bg-[var(--surface-secondary)]",
        text: "text-[var(--text-secondary)]",
        icon: Minus,
      },
    };

    const config = trendConfig[trendType];
    const Icon = config.icon;
    const sizeStyles = sizeConfig[size];

    /**
     * Format value for display
     * Shows absolute value with sign
     */
    const formattedValue = `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          config.bg,
          config.text,
          sizeStyles.text,
          sizeStyles.padding,
          className,
        )}
      >
        {showIcon && <Icon className={cn(sizeStyles.icon)} />}
        {showValue && <span>{formattedValue}</span>}
      </div>
    );
  },
);

TrendIndicator.displayName = "TrendIndicator";

export { TrendIndicator };
export default TrendIndicator;
