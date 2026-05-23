/**
 * ============================================================================
 * COSTS BY PROJECT REPORT  (v3 — full server-side)
 * ============================================================================
 *
 * Shows ALL projects (60+) ranked by total cost.
 *
 * Architecture:
 *   - chartQuery  → page=1, limit=10, no search  → always shows top-10 chart
 *   - tableQuery  → server-side pagination + search + date filters
 *
 * Lessons applied:
 *   ✅ Numbers → align:"end"  |  Text → align:"start"
 *   ✅ exportValue on every column
 *   ✅ Server-side pagination (real data from DB, not limited to 50)
 *   ✅ Search sent to backend, not filtered in memory
 *
 * @page CostsByProjectReport
 * @version 3.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import { Briefcase, DollarSign, BarChart3, Layers } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useFinanceReport } from "@/hooks/reports/useFinanceReport";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";
import BarChart from "@/components/charts-apex/BarChart";
import { CHART_COLORS } from "@/components/charts-apex/config";
import type { ProjectCostSummary } from "@/types/reports/finance.types";

// ============ FILTER TYPES ============

interface ProjectFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ============ COMPONENT ============

export const CostsByProjectReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<ProjectFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const tableFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters.startDate, filters.endDate],
  );

  const tablePagination = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: filters.search || undefined,
    }),
    [page, pageSize, filters.search],
  );

  const {
    data: tableData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useFinanceReport<"by-project">({
    endpoint: "by-project",
    filters: tableFilters,
    pagination: tablePagination,
  });

  const chartPagination = useMemo(() => ({ page: 1, limit: 10 }), []);

  const { data: chartRaw } = useFinanceReport<"by-project">({
    endpoint: "by-project",
    filters: tableFilters,
    pagination: chartPagination,
  });

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const chartSeries = useMemo(() => {
    if (!chartRaw?.projects?.length) return { series: [], categories: [] };
    return {
      series: [
        {
          name: t("reports.finance.totalCost"),
          data: chartRaw.projects.map((p) => p.totalCost),
        },
      ],
      categories: chartRaw.projects.map((p) => p.projectName),
    };
  }, [chartRaw, t]);

  const highestProject = chartRaw?.projects?.[0] ?? null;

  const handleFilterChange = useCallback((f: ProjectFilters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;

  const totalPages = tableData?.meta?.totalPages ?? 1;
  const totalItems = tableData?.meta?.totalItems ?? 0;

  const dateFilters = useMemo(
    () => [
      { key: "startDate", label: t("reports.finance.filters.dateFrom") },
      { key: "endDate", label: t("reports.finance.filters.dateTo") },
    ],
    [t],
  );

  const columns: ColumnConfig<ProjectCostSummary>[] = useMemo(
    () => [
      {
        key: "projectName",
        label: t("reports.finance.table.projectName"),
        render: (p) => (
          <span className="font-medium text-sm">{p.projectName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (p) => p.projectName,
        align: "start" as const,
      },
      {
        key: "totalCost",
        label: t("reports.finance.totalCost"),
        render: (p) => (
          <span className="font-mono text-sm font-semibold" dir="ltr">
            {currency} {p.totalCost.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalCost - b.totalCost,
        exportValue: (p) => p.totalCost,
        align: "end" as const,
      },
      {
        key: "paidAmount",
        label: t("reports.finance.kpi.paidAmount"),
        render: (p) => (
          <span
            className="font-mono text-sm text-green-600 dark:text-green-400"
            dir="ltr"
          >
            {currency} {p.paidAmount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.paidAmount - b.paidAmount,
        exportValue: (p) => p.paidAmount,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "pendingAmount",
        label: t("reports.finance.kpi.pendingAmount"),
        render: (p) => (
          <span
            className="font-mono text-sm text-amber-600 dark:text-amber-400"
            dir="ltr"
          >
            {currency} {p.pendingAmount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.pendingAmount - b.pendingAmount,
        exportValue: (p) => p.pendingAmount,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "costCount",
        label: t("reports.finance.table.costCount"),
        render: (p) => (
          <span className="tabular-nums text-sm">
            {p.costCount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.costCount - b.costCount,
        exportValue: (p) => p.costCount,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "percentage",
        label: t("reports.finance.table.percentage"),
        render: (p) => (
          <div className="flex items-center gap-2 justify-end">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min(p.percentage, 100)}%` }}
              />
            </div>
            <span className="tabular-nums text-sm font-semibold text-blue-600 dark:text-blue-400">
              {p.percentage.toFixed(1)}%
            </span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        exportValue: (p) => `${p.percentage.toFixed(1)}%`,
        align: "end" as const,
      },
    ],
    [t, currency],
  );

  // ============ RENDER ============

  return (
    <ReportPageLayout
      title={t("reports.finance.byProject.title")}
      description={t("reports.finance.byProject.description")}
      borderColor="info"
      isLoading={isLoading}
      error={error as Error | null}
      hasData={!!tableData}
      onRefresh={handleRefresh}
      generatedAt={tableData?.generatedAt}
      filters={
        <ReportFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.finance.searchPlaceholder")}
          dateFilters={dateFilters}
        />
      }
      kpiCards={
        tableData && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ReportMetricCard
              label={t("reports.finance.totalAmount")}
              value={tableData.totalAmount}
              currency={currency}
              icon={DollarSign}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.finance.projectsCount")}
              value={tableData.totalProjects}
              icon={Layers}
              variant="purple"
            />
            {highestProject && (
              <ReportMetricCard
                label={t("reports.finance.highestProject")}
                value={highestProject.percentage}
                icon={Briefcase}
                isPercentage
                variant="warning"
              />
            )}
          </div>
        )
      }
      charts={
        chartSeries.series.length > 0 && (
          <ReportChartCard
            title={t("reports.finance.topProjects.title")}
            description={t("reports.finance.topProjects.description")}
            icon={BarChart3}
          >
            <BarChart
              series={chartSeries.series}
              categories={chartSeries.categories}
              horizontal
              height={350}
              colors={[CHART_COLORS.info]}
            />
          </ReportChartCard>
        )
      }
    >
      {/* ── DATA TABLE ── */}
      <DataTable<ProjectCostSummary>
        data={tableData?.projects ?? []}
        columns={columns}
        keyExtractor={(p) => p.projectId}
        enableClientSorting
        enableExport
        exportFilename="finance_costs_by_project"
        exportTitle={t("reports.finance.byProject.title")}
        enableCompactMode
        isLoading={isFetching && !isLoading}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          pageSize,
        }}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        emptyMessage={t("reports.finance.table.empty")}
      />
    </ReportPageLayout>
  );
};

export default CostsByProjectReport;
