/**
 * Progress Bar Component
 *
 * Visual progress indicator with percentage display.
 * Color changes based on completion level:
 * - 0%: Gray
 * - 1-49%: Orange
 * - 50-74%: Yellow
 * - 75-99%: Blue
 * - 100%: Green
 *
 * @component ProgressBar
 */

import { getProgressColor } from "@/types/projects.types";

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  height?: "sm" | "md" | "lg";
}

/**
 * ProgressBar Component
 * Animated progress indicator
 */
export const ProgressBar = ({
  percentage,
  showLabel = true,
  height = "md",
}: ProgressBarProps) => {
  // Ensure percentage is between 0 and 100
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Get color based on percentage
  const colorClass = getProgressColor(normalizedPercentage);

  // Height classes
  const heightClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-foreground">
            {normalizedPercentage.toFixed(0)}%
          </span>
        )}
      </div>
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${heightClasses[height]}`}
      >
        <div
          className={`${colorClass} ${heightClasses[height]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${normalizedPercentage}%` }}
        />
      </div>
    </div>
  );
};
