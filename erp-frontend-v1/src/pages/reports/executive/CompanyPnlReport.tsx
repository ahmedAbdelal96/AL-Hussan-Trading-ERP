/**
 * ============================================================================
 * COMPANY P&L REPORT
 * ============================================================================
 *
 * Company-level Profit & Loss statement.
 *
 * Revenue = sum(project.budget) for ACTIVE/ON_HOLD/COMPLETED projects.
 * This is a contracted-value proxy - NOT collected cash.
 *
 * Costs are sourced exclusively from the Cost table (single source of truth).
 * Cost buckets:
 *   Labor:      SALARY + ALLOWANCE
 *   Materials:  MATERIAL + PURCHASE
 *   Equipment:  EQUIPMENT_RENTAL
 *   Field Ops:  FUEL + TRANSPORTATION + MAINTENANCE
 *   Admin:      UTILITY + INSURANCE + TAX + SUBCONTRACTOR + OTHER
 *
 * @page CompanyPnlReport
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Wrench,
  BarChart3,
  Briefcase,
  Info,
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

import { useCompanyPnl } from "@/hooks/reports/useExecutiveReport";
import type {
  CompanyPnlFilters,
  PnlCostTypeDetail,
  PnlMonthlyPoint,
  PnlProjectBreakdown,
} from "@/types/reports/executive.types";
import { useTranslation } from "@/i18n/useTranslation";


interface LocalFilters {
  period?: string;
}

type PnlTableKey = "costByType" | "monthlyTrend" | "topProjects";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtPct = (value: number | null) =>
  value !== null ? `${value.toFixed(1)}%` : "-";


export const CompanyPnlReport: React.FC = () => {
  const { t } = useTranslation();

  const PERIOD_OPTIONS = useMemo(
    () => [
      {
        value: "MONTHLY",
        label: t("reports.pnl.period.monthly"),
      },
      {
        value: "QUARTERLY",
        label: t("reports.pnl.period.quarterly"),
      },
      {
        value: "ANNUAL",
        label: t("reports.pnl.period.annual"),
      },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [tablePages, setTablePages] = useState<Record<PnlTableKey, number>>({
    costByType: 1,
    monthlyTrend: 1,
    topProjects: 1,
  });
  const [tablePageSizes, setTablePageSizes] = useState<Record<PnlTableKey, number>>({
    costByType: DEFAULT_PAGE_SIZE,
    monthlyTrend: DEFAULT_PAGE_SIZE,
    topProjects: DEFAULT_PAGE_SIZE,
  });

  // ---- API filters ----
  const apiFilters = useMemo<CompanyPnlFilters>(
    () => ({
      ...(localFilters.period && {
        period: localFilters.period as CompanyPnlFilters["period"],
      }),
      includeProjectBreakdown: true,
      includeCostBreakdown: true,
      includeMonthlyTrend: true,
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useCompanyPnl(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "period",
        label: t("reports.pnl.filters.period"),
        placeholder: t("reports.pnl.period.monthly"),
        options: PERIOD_OPTIONS,
      },
    ],
    [t, PERIOD_OPTIONS],
  );

  const handleFilterChange = useCallback((f: LocalFilters) => {
    setLocalFilters(f);
    setTablePages({
      costByType: 1,
      monthlyTrend: 1,
      topProjects: 1,
    });
  }, []);

  const paginateTable = useCallback(
    <T,>(rows: T[] | undefined, key: PnlTableKey) => {
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

  const costTypeColumns: ColumnConfig<PnlCostTypeDetail>[] = useMemo(
    () => [
      {
        key: "costType",
        label: t("reports.pnl.table.costType"),
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
        label: t("reports.pnl.table.amount"),
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
        label: t("reports.pnl.table.pct"),
        render: (r) => (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(r.percentage, 100)}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
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

  const trendColumns: ColumnConfig<PnlMonthlyPoint>[] = useMemo(
    () => [
      {
        key: "month",
        label: t("reports.pnl.trend.month"),
        render: (r) => <span className="font-medium text-sm">{r.month}</span>,
        sortable: true,
        sortFn: (a, b) => a.month.localeCompare(b.month),
        exportValue: (r) => r.month,
      },
      {
        key: "revenue",
        label: t("reports.pnl.trend.revenue"),
        render: (r) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(r.revenue, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.revenue - b.revenue,
        exportValue: (r) => r.revenue,
        align: "end" as const,
      },
      {
        key: "totalCosts",
        label: t("reports.pnl.trend.costs"),
        render: (r) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(r.totalCosts, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalCosts - b.totalCosts,
        exportValue: (r) => r.totalCosts,
        align: "end" as const,
      },
      {
        key: "grossProfit",
        label: t("reports.pnl.trend.grossProfit"),
        render: (r) => (
          <span
            className={`text-sm font-medium ${
              r.grossProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
            dir="ltr"
          >
            {r.grossProfit >= 0 ? "+" : ""}
            {fmtCurrency(r.grossProfit, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.grossProfit - b.grossProfit,
        exportValue: (r) => r.grossProfit,
        align: "end" as const,
      },
      {
        key: "grossMarginPct",
        label: t("reports.pnl.trend.margin"),
        render: (r) => (
          <span
            className={`text-sm font-medium ${
              r.grossMarginPct === null
                ? "text-muted-foreground"
                : r.grossMarginPct >= 20
                  ? "text-green-600"
                  : r.grossMarginPct >= 0
                    ? "text-blue-600"
                    : "text-red-600"
            }`}
          >
            {fmtPct(r.grossMarginPct)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          (a.grossMarginPct ?? -Infinity) - (b.grossMarginPct ?? -Infinity),
        exportValue: (r) => fmtPct(r.grossMarginPct),
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t, currency],
  );

  const projectColumns: ColumnConfig<PnlProjectBreakdown>[] = useMemo(
    () => [
      {
        key: "projectName",
        label: t("reports.pnl.projects.project"),
        render: (p) => (
          <div>
            <p className="font-medium text-sm">{p.projectName}</p>
            <p className="text-xs text-muted-foreground">{p.projectCode}</p>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName),
        exportValue: (p) => p.projectName,
      },
      {
        key: "projectStatus",
        label: t("reports.pnl.projects.status"),
        render: (p) => (
          <Badge className={getStatusBadgeClass(getStatusTone(p.projectStatus), "text-xs")}>
            {p.projectStatus}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectStatus.localeCompare(b.projectStatus),
        exportValue: (p) => p.projectStatus,
        align: "center" as const,
        hideMobile: true,
      },
      {
        key: "contractValue",
        label: t("reports.pnl.projects.contract"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(p.contractValue, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.contractValue - b.contractValue,
        exportValue: (p) => p.contractValue,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "totalCosts",
        label: t("reports.pnl.projects.costs"),
        render: (p) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(p.totalCosts, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalCosts - b.totalCosts,
        exportValue: (p) => p.totalCosts,
        align: "end" as const,
      },
      {
        key: "grossProfit",
        label: t("reports.pnl.projects.profit"),
        render: (p) => (
          <span
            className={`text-sm font-medium ${
              p.grossProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
            dir="ltr"
          >
            {p.grossProfit >= 0 ? "+" : ""}
            {fmtCurrency(p.grossProfit, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.grossProfit - b.grossProfit,
        exportValue: (p) => p.grossProfit,
        align: "end" as const,
      },
      {
        key: "grossMarginPct",
        label: t("reports.pnl.projects.margin"),
        render: (p) => (
          <span
            className={`text-sm font-medium ${
              p.grossMarginPct === null
                ? "text-muted-foreground"
                : p.grossMarginPct >= 20
                  ? "text-green-600"
                  : p.grossMarginPct >= 0
                    ? "text-blue-600"
                    : "text-red-600"
            }`}
          >
            {fmtPct(p.grossMarginPct)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          (a.grossMarginPct ?? -Infinity) - (b.grossMarginPct ?? -Infinity),
        exportValue: (p) => fmtPct(p.grossMarginPct),
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t, currency],
  );

  const pagedCostByType = useMemo(
    () => paginateTable(data?.costByType, "costByType"),
    [data?.costByType, paginateTable],
  );
  const pagedMonthlyTrend = useMemo(
    () => paginateTable(data?.monthlyTrend, "monthlyTrend"),
    [data?.monthlyTrend, paginateTable],
  );
  const pagedTopProjects = useMemo(
    () => paginateTable(data?.topProjectsByCost, "topProjects"),
    [data?.topProjectsByCost, paginateTable],
  );

  return (
    <ReportPageLayout
      title={t("reports.pnl.title")}
      description={
        data
          ? `${data.period.label} - ${t("reports.pnl.revenueNote")}`
          : t("reports.pnl.description")
      }
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        data && (
          <div className="space-y-4">
            {/* Revenue + Profitability */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("reports.pnl.kpi.summary")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ReportMetricCard
                  label={t("reports.pnl.kpi.totalRevenue")}
                  value={data.totalRevenue}
                  currency={currency}
                  icon={DollarSign}
                  variant="info"
                />
                <ReportMetricCard
                  label={t("reports.pnl.kpi.totalCosts")}
                  value={data.totalCosts}
                  currency={currency}
                  icon={TrendingUp}
                  variant="warning"
                />
                <ReportMetricCard
                  label={t("reports.pnl.kpi.grossProfit")}
                  value={data.grossProfit}
                  currency={currency}
                  icon={data.grossProfit >= 0 ? TrendingUp : TrendingDown}
                  variant={data.grossProfit >= 0 ? "success" : "danger"}
                />
                <ReportMetricCard
                  label={t("reports.pnl.kpi.grossMargin")}
                  value={fmtPct(data.grossMarginPct)}
                  icon={BarChart3}
                  variant={
                    data.grossMarginPct === null
                      ? "info"
                      : data.grossMarginPct >= 20
                        ? "success"
                        : data.grossMarginPct >= 0
                          ? "info"
                          : "danger"
                  }
                />
              </div>
            </div>

            {/* Cost Buckets */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("reports.pnl.kpi.costBuckets")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ReportMetricCard
                  label={t("reports.pnl.kpi.laborCost")}
                  value={data.laborCost}
                  currency={currency}
                  icon={Users}
                  variant="warning"
                />
                <ReportMetricCard
                  label={t("reports.pnl.kpi.materialsCost")}
                  value={data.materialsCost}
                  currency={currency}
                  icon={Package}
                  variant="warning"
                />
                <ReportMetricCard
                  label={t("reports.pnl.kpi.equipmentCost")}
                  value={data.equipmentCost}
                  currency={currency}
                  icon={Package}
                  variant="warning"
                />
                <ReportMetricCard
                  label={t("reports.pnl.kpi.fieldOpsCost")}
                  value={data.fieldOpsCost}
                  currency={currency}
                  icon={Wrench}
                  variant="warning"
                />
                <ReportMetricCard
                  label={t("reports.pnl.kpi.adminCost")}
                  value={data.adminCost}
                  currency={currency}
                  icon={Briefcase}
                  variant="warning"
                />
              </div>
            </div>

            {/* Revenue disclaimer */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                {t("reports.pnl.disclaimer")}
              </span>
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
      {/* Cost-by-type detail */}
      {data?.costByType && data.costByType.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              {t("reports.pnl.sections.costByType")}
            </h3>
          </div>
          <DataTable<PnlCostTypeDetail>
            data={pagedCostByType.rows}
            columns={costTypeColumns}
            keyExtractor={(r) => r.costType}
            enableClientSorting
            enableExport
            exportFilename="company_pnl_cost_by_type"
            exportTitle={t("reports.pnl.sections.costByType")}
            enableCompactMode
            emptyMessage={t("reports.pnl.empty.costByType")}
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

      {/* 12-month trend */}
      {data?.monthlyTrend && data.monthlyTrend.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              {t("reports.pnl.sections.monthlyTrend")}
            </h3>
          </div>
          <DataTable<PnlMonthlyPoint>
            data={pagedMonthlyTrend.rows}
            columns={trendColumns}
            keyExtractor={(r) => r.month}
            enableClientSorting
            enableExport
            exportFilename="company_pnl_monthly_trend"
            exportTitle={t("reports.pnl.sections.monthlyTrend")}
            enableCompactMode
            emptyMessage={t("reports.pnl.empty.trend")}
            pagination={pagedMonthlyTrend.pagination}
            onPageChange={(page) =>
              setTablePages((prev) => ({ ...prev, monthlyTrend: page }))
            }
            onPageSizeChange={(pageSize) =>
              setTablePageSizes((prev) => ({ ...prev, monthlyTrend: pageSize }))
            }
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      )}

      {/* Top 10 projects by cost */}
      {data?.topProjectsByCost && data.topProjectsByCost.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">
              {t("reports.pnl.sections.topProjects")}
            </h3>
          </div>
          <DataTable<PnlProjectBreakdown>
            data={pagedTopProjects.rows}
            columns={projectColumns}
            keyExtractor={(p) => p.projectId}
            enableClientSorting
            enableExport
            exportFilename="company_pnl_top_projects"
            exportTitle={t("reports.pnl.sections.topProjects")}
            enableCompactMode
            emptyMessage={t("reports.pnl.empty.projects")}
            pagination={pagedTopProjects.pagination}
            onPageChange={(page) =>
              setTablePages((prev) => ({ ...prev, topProjects: page }))
            }
            onPageSizeChange={(pageSize) =>
              setTablePageSizes((prev) => ({ ...prev, topProjects: pageSize }))
            }
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      )}
    </ReportPageLayout>
  );
};

export default CompanyPnlReport;



