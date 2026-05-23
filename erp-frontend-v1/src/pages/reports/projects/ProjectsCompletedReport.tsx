/**
 * ============================================================================
 * COMPLETED PROJECTS REPORT — Improved Version
 * ============================================================================
 *
 * Replaces: CompletedProjectsReport (enhanced with proper UX)
 *
 * Shows completed projects with:
 *   - KPIs: success rate, on-time rate, budget performance
 *   - Filters: on-time/late, budget status, search
 *   - Table with: Pagination, Sort, Search, Export
 *
 * @page ProjectsCompletedReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  CheckCircle2,
  Clock,
  Award,
  Target,
  TrendingUp,
  CalendarCheck,
} from "lucide-react";

// Shared report components
import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";

// UI
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

// Data hooks
import { useCompletedProjects } from "@/hooks/reports/useProjectsReport";

// Types
import type { CompletedProjectItem } from "@/types/reports/projects.types";

// i18n
import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface CompletedFilters {
  search?: string;
  timing?: string;
  budgetPerf?: string;
}

// ============ PAGE COMPONENT ============

export const ProjectsCompletedReport: React.FC = () => {
  const { t } = useTranslation();

  // ---- Translated filter options ----
  const TIMING_OPTIONS = useMemo(
    () => [
      { value: "onTime", label: t("reports.projects.filters.onTime") },
      { value: "late", label: t("reports.projects.filters.late") },
    ],
    [t],
  );

  const BUDGET_OPTIONS = useMemo(
    () => [
      { value: "within", label: t("reports.projects.filters.withinBudget") },
      { value: "over", label: t("reports.projects.filters.overBudget") },
    ],
    [t],
  );

  // ---- State ----
  const [filters, setFilters] = useState<CompletedFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- Data ----
  const { data, isLoading, error, refetch } = useCompletedProjects({});

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "timing",
        label: t("reports.projects.filters.timing"),
        placeholder: t("common.all"),
        options: TIMING_OPTIONS,
      },
      {
        key: "budgetPerf",
        label: t("reports.projects.filters.budgetPerf"),
        placeholder: t("common.all"),
        options: BUDGET_OPTIONS,
      },
    ],
    [t, TIMING_OPTIONS, BUDGET_OPTIONS],
  );

  // ---- Filtered data ----
  const filteredData = useMemo(() => {
    let items = data?.projects || [];

    if (filters.timing) {
      if (filters.timing === "onTime") {
        items = items.filter((p) => p.onTime);
      } else if (filters.timing === "late") {
        items = items.filter((p) => !p.onTime);
      }
    }

    if (filters.budgetPerf) {
      if (filters.budgetPerf === "within") {
        items = items.filter((p) => p.withinBudget);
      } else if (filters.budgetPerf === "over") {
        items = items.filter((p) => !p.withinBudget);
      }
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.projectCode.toLowerCase().includes(q) ||
          p.projectName.toLowerCase().includes(q),
      );
    }

    return items;
  }, [data, filters]);

  // ---- Pagination ----
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleFilterChange = useCallback((f: CompletedFilters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;

  // ---- Columns ----
  const columns: ColumnConfig<CompletedProjectItem>[] = useMemo(
    () => [
      {
        key: "projectCode",
        label: t("reports.projects.table.code"),
        render: (p) => (
          <span className="font-mono text-xs font-medium">{p.projectCode}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectCode.localeCompare(b.projectCode),
        exportValue: (p) => p.projectCode,
      },
      {
        key: "projectName",
        label: t("reports.projects.table.name"),
        render: (p) => (
          <span className="font-medium text-sm">{p.projectName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (p) => p.projectName,
      },
      {
        key: "actualDuration",
        label: t("reports.projects.table.duration"),
        render: (p) => (
          <span className="text-sm">
            {p.actualDuration} {t("common.days")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.actualDuration - b.actualDuration,
        exportValue: (p) => p.actualDuration,
        align: "center" as const,
      },
      {
        key: "durationVariance",
        label: t("reports.projects.table.durationVariance"),
        render: (p) => (
          <span
            className={`text-sm font-medium ${
              p.durationVariance > 0
                ? "text-red-600"
                : p.durationVariance < 0
                  ? "text-green-600"
                  : "text-muted-foreground"
            }`}
          >
            {p.durationVariance > 0 ? "+" : ""}
            {p.durationVariance} {t("common.days")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.durationVariance - b.durationVariance,
        exportValue: (p) => p.durationVariance,
        align: "center" as const,
        hideMobile: true,
      },
      {
        key: "onTime",
        label: t("reports.projects.table.onTime"),
        render: (p) =>
          p.onTime ? (
            <Badge className={getStatusBadgeClass(getStatusTone("COMPLETED"))}>
              {t("common.yes")}
            </Badge>
          ) : (
            <Badge className={getStatusBadgeClass(getStatusTone("DELAYED"))}>
              {t("common.no")}
            </Badge>
          ),
        sortable: true,
        sortFn: (a, b) => Number(b.onTime) - Number(a.onTime),
        exportValue: (p) =>
          p.onTime
            ? t("common.yes")
            : t("common.no"),
        align: "center" as const,
      },
      {
        key: "budget",
        label: t("reports.projects.table.budget"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {currency} {p.budget.toLocaleString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.budget - b.budget,
        exportValue: (p) => p.budget,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "actualCost",
        label: t("reports.projects.table.actualCost"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {currency} {p.actualCost.toLocaleString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.actualCost - b.actualCost,
        exportValue: (p) => p.actualCost,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "withinBudget",
        label: t("reports.projects.table.budgetOk"),
        render: (p) =>
          p.withinBudget ? (
            <Badge className={getStatusBadgeClass(getStatusTone("WITHIN_BUDGET"))}>
              {t("common.yes")}
            </Badge>
          ) : (
            <Badge className={getStatusBadgeClass(getStatusTone("OVER_BUDGET"))}>
              {t("common.no")}
            </Badge>
          ),
        sortable: true,
        sortFn: (a, b) => Number(b.withinBudget) - Number(a.withinBudget),
        exportValue: (p) =>
          p.withinBudget
            ? t("common.yes")
            : t("common.no"),
        align: "center" as const,
      },
      {
        key: "projectScore",
        label: t("reports.projects.table.score"),
        render: (p) => {
          const color =
            p.projectScore >= 80
              ? "text-green-600"
              : p.projectScore >= 60
                ? "text-amber-600"
                : "text-red-600";
          return (
            <span className={`text-sm font-bold ${color}`}>
              {p.projectScore.toFixed(0)}
            </span>
          );
        },
        sortable: true,
        sortFn: (a, b) => a.projectScore - b.projectScore,
        exportValue: (p) => p.projectScore.toFixed(0),
        align: "center" as const,
      },
    ],
    [t, currency],
  );

  const d = data;

  return (
    <ReportPageLayout
      title={t("reports.projects.completed.title")}
      description={t("reports.projects.completed.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!d}
      onRefresh={refetch}
      generatedAt={d?.generatedAt}
      // ---- KPI Cards ----
      kpiCards={
        d && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.projects.kpi.totalCompleted")}
              value={d.totalCompleted}
              icon={CheckCircle2}
              variant="purple"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.successRate")}
              value={d.successRate}
              isPercentage
              icon={Award}
              variant={d.successRate >= 70 ? "success" : "warning"}
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.onTimeRate")}
              value={d.onTimeCount}
              icon={CalendarCheck}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.avgDuration")}
              value={`${d.avgDuration} ${t("common.days")}`}
              icon={Clock}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.avgScore")}
              value={d.avgProjectScore.toFixed(0)}
              icon={Target}
              variant={
                d.avgProjectScore >= 80
                  ? "success"
                  : d.avgProjectScore >= 60
                    ? "warning"
                    : "danger"
              }
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalSaved")}
              value={d.totalSaved}
              currency={currency}
              icon={TrendingUp}
              variant={d.totalSaved >= 0 ? "success" : "danger"}
            />
          </div>
        )
      }
      // ---- Filters ----
      filters={
        <ReportFilters<CompletedFilters>
          filters={filters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.projects.searchPlaceholder")}
          selectFilters={selectFilters}
        />
      }
    >
      {/* ---- DATA TABLE ---- */}
      <DataTable<CompletedProjectItem>
        data={paginatedData}
        columns={columns}
        keyExtractor={(p) => p.projectId}
        enableClientSorting
        enableExport
        exportFilename="completed_projects_report"
        exportTitle={t("reports.projects.completed.title")}
        enableCompactMode
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: filteredData.length,
          pageSize,
        }}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        emptyMessage={t("reports.projects.table.emptyCompleted")}
      />
    </ReportPageLayout>
  );
};

export default ProjectsCompletedReport;

