import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared enterprise toolbar surface.
 * Use inside section cards for table/list/filter actions.
 */
export const Toolbar = ({ children, className }: ToolbarProps) => {
  return <div className={cn("erp-toolbar", className)}>{children}</div>;
};

