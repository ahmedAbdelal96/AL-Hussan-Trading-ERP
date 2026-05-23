import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellSize = "narrow" | "wide" | "full";
type PageShellDensity = "compact" | "comfortable";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  size?: PageShellSize;
  density?: PageShellDensity;
  stack?: boolean;
}

const sizeClassMap: Record<PageShellSize, string> = {
  narrow: "erp-page-shell--narrow",
  wide: "erp-page-shell--wide",
  full: "erp-page-shell--full",
};

const densityClassMap: Record<PageShellDensity, string> = {
  compact: "erp-density-compact",
  comfortable: "erp-density-comfortable",
};

/**
 * Shared page wrapper that standardizes horizontal gutters and vertical rhythm.
 * Keep this thin and generic so all modules can adopt it incrementally.
 */
export const PageShell = ({
  children,
  className,
  size = "wide",
  density = "comfortable",
  stack = true,
}: PageShellProps) => {
  return (
    <div
      className={cn(
        "erp-page-shell",
        sizeClassMap[size],
        densityClassMap[density],
        stack && "erp-page-stack",
        className,
      )}
    >
      {children}
    </div>
  );
};

