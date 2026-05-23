import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** @deprecated compact prop is kept for backward compatibility */
  compact?: boolean;
}

/**
 * Inline filter toolbar — replaces the old Card-wrapped FilterBar.
 * Renders as a single horizontal flex row (48px min-height).
 * Children are responsible for their own internal layout.
 */
export const FilterBar = ({
  children,
  className,
  contentClassName,
}: FilterBarProps) => {
  return (
    <div className={cn("erp-toolbar erp-filter-bar", className, contentClassName)}>
      {children}
    </div>
  );
};
