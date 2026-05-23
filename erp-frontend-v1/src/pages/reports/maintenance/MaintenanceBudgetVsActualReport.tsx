/**
 * ============================================================================
 * MAINTENANCE BUDGET VS. ACTUAL REPORT
 * ============================================================================
 *
 * Report 10: Compares estimated (budget) vs actual maintenance spend grouped
 * by month, asset type, or maintenance type.
 *
 * @page MaintenanceBudgetVsActualReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
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
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

import { useMaintenanceBudgetVsActual } from "@/hooks/reports/useMaintenanceReport";

import type {
  BudgetPeriodItem,
  MaintenanceBudgetActualFilters,
} from "@/types/reports/maintenance.types";

import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface LocalFilters {
  groupBy?: string;
}

// ============ HELPERS ============

const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

const statusLabel = (
  status: BudgetPeriodItem["budgetStatus"],
  t: (key: string, opts?: { defaultValue: string }) => string,
) => {
  switch (status) {
    case "OVER_BUDGET":
      return t("reports.maintenance.budget.overBudget");
    case "UNDER_BUDGET":
      return t("reports.maintenance.budget.underBudget");
    default:
      return t("reports.maintenance.budget.onBudget");
  }
};

// ============ PAGE COMPONENT ============

export const MaintenanceBudgetVsActualReport: React.FC = () => {
  const { t } = useTranslation();

  const GROUP_OPTIONS = useMemo(
    () => [
      {
        value: "month",
        label: t("reports.maintenance.groupBy.month"),
      },
      {
        value: "assetType",
        label: t("reports.maintenance.groupBy.assetType"),
      },
      {
        value: "maintenanceType",
        label: t("reports.maintenance.groupBy.maintenanceType"),
      },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    groupBy: "month",
  });
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // ---- API filters ----
  const apiFilters = useMemo<MaintenanceBudgetActualFilters>(
    () => ({
      page,
      limit: pageSize,
      ...(localFilters.groupBy && {
        groupBy:
          localFilters.groupBy as MaintenanceBudgetActualFilters["groupBy"],
      }),
    }),
    [localFilters, page, pageSize],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } =
    useMaintenanceBudgetVsActual(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "groupBy",
        label: t("reports.maintenance.filters.groupBy"),
        placeholder: t("reports.maintenance.groupBy.month"),
        options: GROUP_OPTIONS,
      },
    ],
    [t, GROUP_OPTIONS],
  );

  const tableData = useMemo(() => data?.items || [], [data]);

  const handleFilterChange = useCallback((f: LocalFilters) => {
    setLocalFilters(f);
    setPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;
  const summary = data?.summary;

  // ---- Columns ----
  const columns: ColumnConfig<BudgetPeriodItem>[] = useMemo(
    () => [
      {
        key: "period",
        label: t("reports.maintenance.table.period"),
        render: (i) => (
          <span className="font-medium text-sm">{i.period}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.period.localeCompare(b.period),
        exportValue: (i) => i.period,
      },
      {
        key: "requestCount",
        label: t("reports.maintenance.table.requests"),
        render: (i) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
            {i.requestCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.requestCount - b.requestCount,
        exportValue: (i) => i.requestCount,
        align: "center" as const,
      },
      {
        key: "estimatedCost",
        label: t("reports.maintenance.table.estimated"),
        render: (i) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(i.estimatedCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.estimatedCost - b.estimatedCost,
        exportValue: (i) => i.estimatedCost,
        align: "end" as const,
      },
      {
        key: "actualCost",
        label: t("reports.maintenance.table.actual"),
        render: (i) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(i.actualCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.actualCost - b.actualCost,
        exportValue: (i) => i.actualCost,
        align: "end" as const,
      },
      {
        key: "variance",
        label: t("reports.maintenance.table.variance"),
        render: (i) => (
          <span
            className={`text-sm font-medium ${
              i.variance >= 0 ? "text-green-600" : "text-red-600"
            }`}
            dir="ltr"
          >
            {i.variance >= 0 ? "+" : ""}
            {fmtCurrency(i.variance, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.variance - b.variance,
        exportValue: (i) => i.variance,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "variancePercentage",
        label: t("reports.maintenance.table.variancePct"),
        render: (i) => (
          <span
            className={`text-sm font-medium ${
              (i.variancePercentage ?? 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {i.variancePercentage !== null
              ? `${i.variancePercentage > 0 ? "+" : ""}${i.variancePercentage.toFixed(1)}%`
              : "-"}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          (a.variancePercentage ?? 0) - (b.variancePercentage ?? 0),
        exportValue: (i) =>
          i.variancePercentage !== null
            ? `${i.variancePercentage.toFixed(1)}%`
            : "",
        align: "center" as const,
        hideMobile: true,
      },
      {
        key: "budgetStatus",
        label: t("reports.maintenance.table.budgetStatus"),
        render: (i) => (
          <Badge className={getStatusBadgeClass(getStatusTone(i.budgetStatus))}>
            {statusLabel(i.budgetStatus, t)}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.budgetStatus.localeCompare(b.budgetStatus),
        exportValue: (i) => i.budgetStatus,
        align: "center" as const,
      },
    ],
    [t, currency],
  );

  return (
    <ReportPageLayout
      title={t("reports.maintenance.budgetVsActual.title")}
      description={t("reports.maintenance.budgetVsActual.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.maintenance.kpi.totalEstimated")}
              value={summary.totalEstimated}
              currency={currency}
              icon={BarChart2}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.totalActual")}
              value={summary.totalActual}
              currency={currency}
              icon={DollarSign}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.totalVariance")}
              value={summary.totalVariance}
              currency={currency}
              icon={summary.totalVariance >= 0 ? TrendingDown : TrendingUp}
              variant={summary.totalVariance >= 0 ? "success" : "danger"}
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.overBudgetCount")}
              value={summary.overBudgetCount}
              icon={AlertTriangle}
              variant={summary.overBudgetCount > 0 ? "danger" : "success"}
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.underBudgetCount")}
              value={summary.underBudgetCount}
              icon={CheckCircle2}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.onBudgetCount")}
              value={summary.onBudgetCount}
              icon={CheckCircle2}
              variant="info"
            />
          </div>
        )
      }
      filters={
        <ReportFilters<LocalFilters>
          filters={localFilters}
          onFilterChange={handleFilterChange}
          selectFilters={selectFilters}
        />
      }
    >
      <DataTable<BudgetPeriodItem>
        data={tableData}
        columns={columns}
        keyExtractor={(i) => i.period}
        enableClientSorting
        enableExport
        exportFilename="maintenance_budget_vs_actual_report"
        exportTitle={t("reports.maintenance.budgetVsActual.title")}
        enableCompactMode
        pagination={{
          currentPage: page,
          totalPages: data?.meta?.totalPages ?? 1,
          totalItems: data?.meta?.totalItems ?? tableData.length,
          pageSize,
        }}
        onPageChange={setPage}
        emptyMessage={t("reports.maintenance.table.empty")}
      />
    </ReportPageLayout>
  );
};

export default MaintenanceBudgetVsActualReport;


