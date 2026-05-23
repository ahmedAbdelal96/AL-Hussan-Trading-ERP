/**
 * ============================================================================
 * REPORT CHART CARD — Shared Chart Wrapper for All Reports
 * ============================================================================
 *
 * Generic chart container card with consistent styling.
 * Replaces module-specific ChartCard components (ProjectsChartCard, etc.)
 *
 * @component ReportChartCard
 * @version 1.0.0
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============ TYPES ============

export interface ReportChartCardProps {
  /** Card title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Lucide icon (default: BarChart3) */
  icon?: LucideIcon;
  /** Chart or content to render */
  children: React.ReactNode;
  /** Optional actions (buttons) in the header */
  actions?: React.ReactNode;
  /** Show loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============ COMPONENT ============

export const ReportChartCard: React.FC<ReportChartCardProps> = React.memo(
  ({
    title,
    description,
    icon: Icon = BarChart3,
    children,
    actions,
    isLoading,
    className,
  }) => {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-xs mt-0.5">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    );
  },
);

ReportChartCard.displayName = "ReportChartCard";
