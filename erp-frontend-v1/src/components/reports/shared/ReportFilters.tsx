/**
 * ============================================================================
 * REPORT FILTERS — Shared Filter Bar for All Reports
 * ============================================================================
 *
 * Reusable filter bar that provides:
 * - Search input
 * - Select dropdowns (status, department, site, etc.)
 * - Date range pickers (from / to)
 * - Reset button
 * - Responsive layout — wraps on mobile, inline on desktop
 * - RTL-aware
 *
 * @component ReportFilters
 * @version 1.0.0
 */

import React, { useCallback } from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

// ============ TYPES ============

export interface FilterOption {
  value: string;
  label: string;
}

export interface SelectFilterConfig {
  key: string;
  label: string;
  placeholder?: string;
  options: FilterOption[];
  /** Width class, default "w-[180px]" */
  width?: string;
}

export interface DateFilterConfig {
  key: string;
  label: string;
  placeholder?: string;
}

export interface ReportFiltersProps<
  T extends { [K in keyof T]?: string | undefined },
> {
  /** Current filter values */
  filters: T;
  /** Callback when any filter changes */
  onFilterChange: (filters: T) => void;

  /** Enable search input */
  searchKey?: keyof T & string;
  searchPlaceholder?: string;

  /** Select dropdown filters */
  selectFilters?: SelectFilterConfig[];

  /** Date input filters */
  dateFilters?: DateFilterConfig[];

  /**
   * When true and at least 2 dateFilters are provided, renders a row of
   * quick-period preset buttons (This Month / Last Month / QTD / YTD / Last 12M)
   * that pre-populate dateFilters[0] (from) and dateFilters[1] (to).
   */
  quickPeriods?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Show reset button (default: true) */
  showReset?: boolean;
}

// ============ COMPONENT ============

function ReportFiltersInner<T extends { [K in keyof T]?: string | undefined }>({
  filters,
  onFilterChange,
  searchKey,
  searchPlaceholder,
  selectFilters = [],
  dateFilters = [],
  quickPeriods,
  className,
  showReset = true,
}: ReportFiltersProps<T>) {
  const { t } = useTranslation();
  // Auto-enable quick period presets when two date filters are present unless explicitly disabled
  const showQuickPeriods = quickPeriods ?? dateFilters.length >= 2;

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "" && v !== "all",
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      if (!searchKey) return;
      onFilterChange({ ...filters, [searchKey]: value || undefined } as T);
    },
    [filters, onFilterChange, searchKey],
  );

  const handleSelectChange = useCallback(
    (key: string, value: string) => {
      onFilterChange({
        ...filters,
        [key]: value === "all" ? undefined : value,
      } as T);
    },
    [filters, onFilterChange],
  );

  const handleDateChange = useCallback(
    (key: string, value: string) => {
      onFilterChange({
        ...filters,
        [key]: value || undefined,
      } as T);
    },
    [filters, onFilterChange],
  );

  const handleReset = useCallback(() => {
    const cleared = Object.keys(filters).reduce(
      (acc, key) => ({ ...acc, [key]: undefined }),
      {} as T,
    );
    onFilterChange(cleared);
  }, [filters, onFilterChange]);

  const handleClearSearch = useCallback(() => {
    if (!searchKey) return;
    onFilterChange({ ...filters, [searchKey]: undefined } as T);
  }, [filters, onFilterChange, searchKey]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3 rounded-lg border border-border/50 bg-card p-4",
        className,
      )}
    >
      {/* Search Input */}
      {searchKey && (
        <div className="flex-1 min-w-[200px] max-w-[320px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t("common.search")}
          </label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={(filters[searchKey] as string) || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={
                searchPlaceholder ||
                t("common.searchPlaceholder")
              }
              className="ps-9 pe-9 h-9"
            />
            {filters[searchKey] && (
              <button
                onClick={handleClearSearch}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Select Filters */}
      {selectFilters.map((config) => (
        <div key={config.key} className={cn("min-w-[150px]", config.width)}>
          {/*
            Keep placeholder optional for backward compatibility with older report pages.
            If omitted, derive a sensible localized fallback.
          */}
          {(() => {
            const resolvedPlaceholder =
              config.placeholder || t("common.all");
            return (
              <>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {config.label}
                </label>
                <Select
                  value={(filters[config.key as keyof T] as string) || "all"}
                  onValueChange={(v) => handleSelectChange(config.key, v)}
                >
                  <SelectTrigger className="h-9" size="sm">
                    <SelectValue placeholder={resolvedPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{resolvedPlaceholder}</SelectItem>
                    {config.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            );
          })()}
        </div>
      ))}

      {/* Quick Period Presets */}
      {showQuickPeriods &&
        dateFilters.length >= 2 &&
        (() => {
          const fromKey = dateFilters[0].key;
          const toKey = dateFilters[1].key;
          const today = new Date();
          const fmt = (d: Date) => d.toISOString().slice(0, 10);
          const mStart = Math.floor(today.getMonth() / 3) * 3;
          const presets = [
            {
              key: "mtd",
              label: t("reports.period.thisMonth"),
              from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
              to: fmt(today),
            },
            {
              key: "lm",
              label: t("reports.period.lastMonth"),
              from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
              to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)),
            },
            {
              key: "qtd",
              label: t("reports.period.thisQuarter"),
              from: fmt(new Date(today.getFullYear(), mStart, 1)),
              to: fmt(today),
            },
            {
              key: "ytd",
              label: t("reports.period.thisYear"),
              from: fmt(new Date(today.getFullYear(), 0, 1)),
              to: fmt(today),
            },
            {
              key: "l12",
              label: t("reports.period.last12m"),
              from: fmt(
                new Date(
                  today.getFullYear() - 1,
                  today.getMonth(),
                  today.getDate(),
                ),
              ),
              to: fmt(today),
            },
          ];
          const activeFrom = filters[fromKey as keyof T] as string | undefined;
          return (
            <div className="w-full flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs font-medium text-muted-foreground shrink-0">
                {t("reports.period.quick")}
              </span>
              {presets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      [fromKey]: p.from,
                      [toKey]: p.to,
                    } as T)
                  }
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md border transition-colors",
                    activeFrom === p.from
                      ? "border-primary/50 bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          );
        })()}

      {/* Date Filters */}
      {dateFilters.map((config) => (
        <div key={config.key} className="min-w-[160px]">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {config.label}
          </label>
          <Input
            type="date"
            value={(filters[config.key as keyof T] as string) || ""}
            onChange={(e) => handleDateChange(config.key, e.target.value)}
            placeholder={config.placeholder}
            className="h-9"
          />
        </div>
      ))}

      {/* Reset Button */}
      {showReset && hasActiveFilters && (
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5 me-1.5" />
            {t("common.reset")}
          </Button>
        </div>
      )}
    </div>
  );
}

export const ReportFilters = React.memo(
  ReportFiltersInner,
) as typeof ReportFiltersInner;


