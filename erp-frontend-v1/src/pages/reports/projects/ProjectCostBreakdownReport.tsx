/**
 * ============================================================================
 * PROJECT COST BREAKDOWN REPORT
 * ============================================================================
 *
 * Report 8: Breaks down all costs per project by CostType.
 *
 * @page ProjectCostBreakdownReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  DollarSign,
  TrendingDown,
  PieChart,
  BarChart2,
  Layers,
  Target,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass, getStatusTone, type StatusTone } from "@/components/common/statusBadgeStyles";

import { useProjectCostBreakdown } from "@/hooks/reports/useProjectsReport";

import type {
  ProjectCostBreakdownItem,
  ProjectCostBreakdownFilters,
} from "@/types/reports/projects.types";
import { ProjectStatus } from "@/types/reports/projects.types";

import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface LocalFilters {
  search?: string;
  projectStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ============ HELPERS ============

const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

const utilizationColor = (pct: number) => {
  if (pct > 100) return "text-red-600";
  if (pct >= 80) return "text-amber-600";
  return "text-green-600";
};

const utilizationTone = (pct: number): StatusTone => {
  if (pct > 100) return "danger";
  if (pct >= 80) return "warning";
  return "success";
};

// ============ PAGE COMPONENT ============

export const ProjectCostBreakdownReport: React.FC = () => {
  const { t } = useTranslation();

  const STATUS_OPTIONS = useMemo(
    () =>
      Object.values(ProjectStatus).map((s) => ({
        value: s,
        label: t(`reports.projects.status.${s}`, { defaultValue: s }),
      })),
    [t],
  );

  const SORT_OPTIONS = useMemo(
    () => [
      { value: "totalCost", label: t("reports.projects.sort.totalCost") },
      { value: "budget", label: t("reports.projects.sort.budget") },
      { value: "utilization", label: t("reports.projects.sort.utilization") },
      { value: "projectName", label: t("reports.projects.sort.name") },
    ],
    [t],
  );

  const ORDER_OPTIONS = useMemo(
    () => [
      { value: "desc", label: t("common.descending") },
      { value: "asc", label: t("common.ascending") },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- API filters ----
  const apiFilters = useMemo<ProjectCostBreakdownFilters>(
    () => ({
      ...(localFilters.projectStatus && {
        projectStatus: localFilters.projectStatus as ProjectStatus,
      }),
      ...(localFilters.sortBy && {
        sortBy: localFilters.sortBy as ProjectCostBreakdownFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useProjectCostBreakdown(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "projectStatus",
        label: t("reports.projects.filters.status"),
        placeholder: t("common.all"),
        options: STATUS_OPTIONS,
      },
      {
        key: "sortBy",
        label: t("reports.projects.filters.sortBy"),
        placeholder: t("common.default"),
        options: SORT_OPTIONS,
      },
      {
        key: "sortOrder",
        label: t("reports.projects.filters.sortOrder"),
        placeholder: t("common.default"),
        options: ORDER_OPTIONS,
      },
    ],
    [t, STATUS_OPTIONS, SORT_OPTIONS, ORDER_OPTIONS],
  );

  // ---- Client-side search filter ----
  const filteredData = useMemo(() => {
    let items = data?.projects || [];
    if (localFilters.search) {
      const q = localFilters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.projectCode.toLowerCase().includes(q) ||
          p.projectName.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, localFilters.search]);

  // ---- Pagination ----
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleFilterChange = useCallback((f: LocalFilters) => {
    setLocalFilters(f);
    setPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;

  // ---- Columns ----
  const columns: ColumnConfig<ProjectCostBreakdownItem>[] = useMemo(
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
          <div>
            <p className="font-medium text-sm">{p.projectName}</p>
            {p.siteName && (
              <p className="text-xs text-muted-foreground">{p.siteName}</p>
            )}
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (p) => p.projectName,
      },
      {
        key: "status",
        label: t("reports.projects.table.status"),
        render: (p) => (
          <Badge className={getStatusBadgeClass(getStatusTone(p.status), "text-xs")}>
            {t(`reports.projects.status.${p.status}`, { defaultValue: p.status })}
          </Badge>
        ),
        exportValue: (p) => p.status,
        align: "center" as const,
        hideMobile: true,
      },
      {
        key: "budget",
        label: t("reports.projects.table.budget"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(p.budget, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.budget - b.budget,
        exportValue: (p) => p.budget,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "totalCost",
        label: t("reports.projects.table.totalCost"),
        render: (p) => (
          <span className="text-sm font-medium" dir="ltr">
            {fmtCurrency(p.totalCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalCost - b.totalCost,
        exportValue: (p) => p.totalCost,
        align: "end" as const,
      },
      {
        key: "budgetUtilization",
        label: t("reports.projects.table.utilization"),
        render: (p) => (
          <Badge className={getStatusBadgeClass(utilizationTone(p.budgetUtilization))}>
            {p.budgetUtilization.toFixed(1)}%
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.budgetUtilization - b.budgetUtilization,
        exportValue: (p) => `${p.budgetUtilization.toFixed(1)}%`,
        align: "center" as const,
      },
      {
        key: "budgetVariance",
        label: t("reports.projects.table.variance"),
        render: (p) => (
          <span
            className={`text-sm font-medium ${p.budgetVariance >= 0 ? "text-green-600" : "text-red-600"}`}
            dir="ltr"
          >
            {p.budgetVariance >= 0 ? "+" : ""}
            {fmtCurrency(p.budgetVariance, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.budgetVariance - b.budgetVariance,
        exportValue: (p) => p.budgetVariance,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "costByType",
        label: t("reports.projects.table.topCostType"),
        render: (p) => {
          const top = p.costByType[0];
          if (!top) return <span className="text-muted-foreground text-xs">—</span>;
          return (
            <div className="text-xs">
              <span className="font-medium">
                {t(`reports.costType.${top.costType}`, { defaultValue: top.costType })}
              </span>
              <span className="text-muted-foreground ml-1">
                ({top.percentage.toFixed(0)}%)
              </span>
            </div>
          );
        },
        exportValue: (p) => p.costByType[0]?.costType ?? "",
        hideMobile: true,
      },
    ],
    [t, currency],
  );

  const d = data;

  return (
    <ReportPageLayout
      title={t("reports.projects.costBreakdown.title")}
      description={t("reports.projects.costBreakdown.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!d}
      onRefresh={refetch}
      generatedAt={d?.generatedAt}
      kpiCards={
        d && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.projects.kpi.totalProjects")}
              value={d.projectCount}
              icon={Layers}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.grandTotalCost")}
              value={d.grandTotalCost}
              currency={currency}
              icon={DollarSign}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.grandTotalBudget")}
              value={d.grandTotalBudget}
              currency={currency}
              icon={Target}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.overallUtilization")}
              value={d.overallBudgetUtilization}
              isPercentage
              icon={BarChart2}
              variant={d.overallBudgetUtilization > 100 ? "danger" : d.overallBudgetUtilization >= 80 ? "warning" : "success"}
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.costTypes")}
              value={d.costTypesSummary.length}
              icon={PieChart}
              variant="purple"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.budgetVariance")}
              value={d.grandTotalBudget - d.grandTotalCost}
              currency={currency}
              icon={TrendingDown}
              variant={d.grandTotalBudget >= d.grandTotalCost ? "success" : "danger"}
            />
          </div>
        )
      }
      filters={
        <ReportFilters<LocalFilters>
          filters={localFilters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.projects.searchPlaceholder")}
          selectFilters={selectFilters}
        />
      }
    >
      {/* Cost Types Summary */}
      {d && d.costTypesSummary.length > 0 && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium mb-2">
            {t("reports.projects.costBreakdown.typesSummary")}
          </p>
          <div className="flex flex-wrap gap-2">
            {d.costTypesSummary.map((ct) => (
              <div
                key={ct.costType}
                className="flex items-center gap-1 bg-background border rounded px-2 py-1 text-xs"
              >
                <span className="font-medium">
                  {t(`reports.costType.${ct.costType}`, { defaultValue: ct.costType })}
                </span>
                <span className="text-muted-foreground">
                  {currency} {ct.totalAmount.toLocaleString()} ({ct.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable<ProjectCostBreakdownItem>
        data={paginatedData}
        columns={columns}
        keyExtractor={(p) => p.projectId}
        enableClientSorting
        enableExport
        exportFilename="project_cost_breakdown_report"
        exportTitle={t("reports.projects.costBreakdown.title")}
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
        emptyMessage={t("reports.projects.table.empty")}
      />
    </ReportPageLayout>
  );
};

export default ProjectCostBreakdownReport;


