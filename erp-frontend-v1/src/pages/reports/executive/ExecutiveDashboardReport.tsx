/**
 * ============================================================================
 * EXECUTIVE DASHBOARD REPORT
 * ============================================================================
 *
 * Cross-module KPI snapshot for senior management.
 * Shows 11 KPIs across Projects, Finance, Workforce, Assets, and Maintenance,
 * plus a 6-month cost trend and a cost-by-type breakdown.
 *
 * @page ExecutiveDashboardReport
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  Briefcase,
  AlertTriangle,
  DollarSign,
  Users,
  Package,
  Wrench,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
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
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

import { useExecutiveDashboard } from "@/hooks/reports/useExecutiveReport";
import type {
  ExecutiveDashboardFilters,
  MonthlyCostPoint,
  CostByTypeSlice,
} from "@/types/reports/executive.types";
import { useTranslation } from "@/i18n/useTranslation";

interface LocalFilters {
  period?: string;
}

type ExecutiveTableKey = "costByType" | "trend";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtPct = (value: number | null) =>
  value !== null ? `${value.toFixed(1)}%` : "-";

export const ExecutiveDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const PERIOD_OPTIONS = useMemo(
    () => [
      {
        value: "MTD",
        label: t("reports.executive.period.mtd"),
      },
      {
        value: "QTD",
        label: t("reports.executive.period.qtd"),
      },
      {
        value: "YTD",
        label: t("reports.executive.period.ytd"),
      },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [tablePages, setTablePages] = useState<
    Record<ExecutiveTableKey, number>
  >({
    costByType: 1,
    trend: 1,
  });
  const [tablePageSizes, setTablePageSizes] = useState<
    Record<ExecutiveTableKey, number>
  >({
    costByType: DEFAULT_PAGE_SIZE,
    trend: DEFAULT_PAGE_SIZE,
  });

  // ---- API filters ----
  const apiFilters = useMemo<ExecutiveDashboardFilters>(
    () => ({
      ...(localFilters.period && {
        period: localFilters.period as ExecutiveDashboardFilters["period"],
      }),
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useExecutiveDashboard(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "period",
        label: t("reports.executive.filters.period"),
        placeholder: t("reports.executive.period.mtd"),
        options: PERIOD_OPTIONS,
      },
    ],
    [t, PERIOD_OPTIONS],
  );

  const handleFilterChange = useCallback((f: LocalFilters) => {
    setLocalFilters(f);
    setTablePages({
      costByType: 1,
      trend: 1,
    });
  }, []);

  const paginateTable = useCallback(
    <T,>(rows: T[] | undefined, key: ExecutiveTableKey) => {
      const safeRows = rows || [];
      const pageSize = tablePageSizes[key];
      const currentPage = tablePages[key];
      const start = (currentPage - 1) * pageSize;
      const pagedRows = safeRows.slice(start, start + pageSize);
      return {
        rows: pagedRows,
        pagination: {
          currentPage,
          pageSize,
          totalItems: safeRows.length,
          totalPages: Math.max(1, Math.ceil(safeRows.length / pageSize)),
        },
      };
    },
    [tablePages, tablePageSizes],
  );

  const currency = CURRENCY.DEFAULT;
  const kpi = data?.kpi;

  // ---- Monthly cost trend columns ----
  const trendColumns: ColumnConfig<MonthlyCostPoint>[] = useMemo(
    () => [
      {
        key: "month",
        label: t("reports.executive.trend.month"),
        render: (r) => <span className="font-medium text-sm">{r.month}</span>,
        sortable: true,
        sortFn: (a, b) => a.month.localeCompare(b.month),
        exportValue: (r) => r.month,
      },
      {
        key: "totalCost",
        label: t("reports.executive.trend.totalCost"),
        render: (r) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(r.totalCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalCost - b.totalCost,
        exportValue: (r) => r.totalCost,
        align: "end" as const,
      },
      {
        key: "laborCost",
        label: t("reports.executive.trend.laborCost"),
        render: (r) => (
          <span className="text-sm text-muted-foreground" dir="ltr">
            {fmtCurrency(r.laborCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.laborCost - b.laborCost,
        exportValue: (r) => r.laborCost,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "otherCost",
        label: t("reports.executive.trend.otherCost"),
        render: (r) => (
          <span className="text-sm text-muted-foreground" dir="ltr">
            {fmtCurrency(r.otherCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.otherCost - b.otherCost,
        exportValue: (r) => r.otherCost,
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t, currency],
  );

  // ---- Cost-by-type columns ----
  const costTypeColumns: ColumnConfig<CostByTypeSlice>[] = useMemo(
    () => [
      {
        key: "costType",
        label: t("reports.executive.costType.type"),
        render: (r) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
            {r.costType}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.costType.localeCompare(b.costType),
        exportValue: (r) => r.costType,
      },
      {
        key: "amount",
        label: t("reports.executive.costType.amount"),
        render: (r) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(r.amount, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.amount - b.amount,
        exportValue: (r) => r.amount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.executive.costType.pct"),
        render: (r) => (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(r.percentage, 100)}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground text-nowrap">
              {r.percentage.toFixed(1)}%
            </span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        exportValue: (r) => `${r.percentage.toFixed(1)}%`,
        align: "end" as const,
      },
    ],
    [t, currency],
  );

  const pagedCostByType = useMemo(
    () => paginateTable(data?.costByType, "costByType"),
    [data?.costByType, paginateTable],
  );

  const pagedTrend = useMemo(
    () => paginateTable(data?.monthlyCostTrend, "trend"),
    [data?.monthlyCostTrend, paginateTable],
  );

  return (
    <ReportPageLayout
      title={t("reports.executive.dashboard.title")}
      description={
        data?.period
          ? `${t("reports.executive.dashboard.description")} - ${data.period.label}`
          : t("reports.executive.dashboard.description")
      }
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      onPrint={() => window.print()}
      generatedAt={data?.generatedAt}
      kpiCards={
        kpi && (
          <div className="space-y-4">
            {/* Row 1: Projects */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("reports.executive.kpi.projects")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ReportMetricCard
                  label={t("reports.executive.kpi.activeProjects")}
                  value={kpi.activeProjects}
                  icon={Briefcase}
                  variant="info"
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.atRiskProjects")}
                  value={kpi.atRiskProjects}
                  icon={AlertTriangle}
                  variant={kpi.atRiskProjects > 0 ? "danger" : "success"}
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.contractValue")}
                  value={kpi.totalContractValue}
                  currency={currency}
                  icon={DollarSign}
                  variant="info"
                />
              </div>
            </div>

            {/* Row 2: Finance */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("reports.executive.kpi.finance")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ReportMetricCard
                  label={t("reports.executive.kpi.laborCost")}
                  value={kpi.laborCostPeriod}
                  currency={currency}
                  icon={Users}
                  variant="warning"
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.totalCosts")}
                  value={kpi.totalCostsPeriod}
                  currency={currency}
                  icon={TrendingUp}
                  variant="warning"
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.budgetUtil")}
                  value={fmtPct(kpi.budgetUtilizationPct)}
                  icon={BarChart3}
                  variant={
                    kpi.budgetUtilizationPct === null
                      ? "info"
                      : kpi.budgetUtilizationPct > 90
                        ? "danger"
                        : kpi.budgetUtilizationPct > 70
                          ? "warning"
                          : "success"
                  }
                />
              </div>
            </div>

            {/* Row 3: Workforce + Assets + Maintenance */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("reports.executive.kpi.operations")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <ReportMetricCard
                  label={t("reports.executive.kpi.headcount")}
                  value={kpi.headcount}
                  icon={Users}
                  variant="info"
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.assetUtil")}
                  value={fmtPct(kpi.assetUtilizationPct)}
                  icon={Package}
                  variant={
                    kpi.assetUtilizationPct >= 70
                      ? "success"
                      : kpi.assetUtilizationPct >= 40
                        ? "warning"
                        : "danger"
                  }
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.idleAssets")}
                  value={kpi.idleAssets}
                  icon={TrendingDown}
                  variant={kpi.idleAssets > 10 ? "warning" : "info"}
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.maintenanceOverdue")}
                  value={kpi.maintenanceOverdue}
                  icon={AlertTriangle}
                  variant={kpi.maintenanceOverdue > 0 ? "danger" : "success"}
                />
                <ReportMetricCard
                  label={t("reports.executive.kpi.maintenancePending")}
                  value={kpi.maintenancePending}
                  icon={Wrench}
                  variant={kpi.maintenancePending > 5 ? "warning" : "info"}
                />
              </div>
            </div>
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
      {/* Cost-by-Type Breakdown */}
      {data?.costByType && data.costByType.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              {t("reports.executive.sections.costByType")}
            </h3>
          </div>
          <DataTable<CostByTypeSlice>
            data={pagedCostByType.rows}
            columns={costTypeColumns}
            keyExtractor={(r) => r.costType}
            enableClientSorting
            enableExport
            exportFilename="executive_cost_by_type"
            exportTitle={t("reports.executive.sections.costByType")}
            enableCompactMode
            emptyMessage={t("reports.executive.empty.costByType")}
            pagination={pagedCostByType.pagination}
            onPageChange={(page) =>
              setTablePages((prev) => ({ ...prev, costByType: page }))
            }
            onPageSizeChange={(pageSize) =>
              setTablePageSizes((prev) => ({ ...prev, costByType: pageSize }))
            }
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      )}

      {/* 6-Month Monthly Cost Trend */}
      {data?.monthlyCostTrend && data.monthlyCostTrend.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              {t("reports.executive.sections.trend")}
            </h3>
          </div>
          <DataTable<MonthlyCostPoint>
            data={pagedTrend.rows}
            columns={trendColumns}
            keyExtractor={(r) => r.month}
            enableClientSorting
            enableExport
            exportFilename="executive_monthly_trend"
            exportTitle={t("reports.executive.sections.trend")}
            enableCompactMode
            emptyMessage={t("reports.executive.empty.trend")}
            pagination={pagedTrend.pagination}
            onPageChange={(page) =>
              setTablePages((prev) => ({ ...prev, trend: page }))
            }
            onPageSizeChange={(pageSize) =>
              setTablePageSizes((prev) => ({ ...prev, trend: pageSize }))
            }
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      )}
    </ReportPageLayout>
  );
};

export default ExecutiveDashboardReport;


