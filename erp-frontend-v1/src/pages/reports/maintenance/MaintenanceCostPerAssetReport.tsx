/**
 * ============================================================================
 * MAINTENANCE COST PER ASSET REPORT
 * ============================================================================
 *
 * Report 9: Detailed cost breakdown per individual asset including estimated
 * vs. actual costs, variance analysis, and optional cost-to-value ratio.
 *
 * @page MaintenanceCostPerAssetReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Package,
  Layers,
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
import { getStatusBadgeClass, type StatusTone } from "@/components/common/statusBadgeStyles";

import { useMaintenanceCostPerAsset } from "@/hooks/reports/useMaintenanceReport";

import type {
  AssetCostItem,
  MaintenanceCostPerAssetFilters,
} from "@/types/reports/maintenance.types";

import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface LocalFilters {
  sortBy?: string;
  sortOrder?: string;
}

// ============ HELPERS ============

const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

const varianceTone = (pct: number | null): StatusTone => {
  if (pct === null) return "neutral";
  // positive variance = under budget (good), negative = over budget (bad)
  if (pct > 0) return "success";
  if (pct < -10) return "danger";
  return "warning";
};

// ============ PAGE COMPONENT ============

export const MaintenanceCostPerAssetReport: React.FC = () => {
  const { t } = useTranslation();

  const SORT_OPTIONS = useMemo(
    () => [
      {
        value: "totalCost",
        label: t("reports.maintenance.sort.totalCost"),
      },
      {
        value: "avgCost",
        label: t("reports.maintenance.sort.avgCost"),
      },
      {
        value: "assetName",
        label: t("reports.maintenance.sort.assetName"),
      },
      {
        value: "requestCount",
        label: t("reports.maintenance.sort.requestCount"),
      },
      {
        value: "costRatio",
        label: t("reports.maintenance.sort.costRatio"),
      },
    ],
    [t],
  );

  const ORDER_OPTIONS = useMemo(
    () => [
      {
        value: "desc",
        label: t("common.descending"),
      },
      {
        value: "asc",
        label: t("common.ascending"),
      },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ---- API filters ----
  const apiFilters = useMemo<MaintenanceCostPerAssetFilters>(
    () => ({
      page,
      limit: pageSize,
      ...(localFilters.sortBy && {
        sortBy: localFilters.sortBy as MaintenanceCostPerAssetFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters, page, pageSize],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } =
    useMaintenanceCostPerAsset(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "sortBy",
        label: t("reports.maintenance.filters.sortBy"),
        placeholder: t("common.default"),
        options: SORT_OPTIONS,
      },
      {
        key: "sortOrder",
        label: t("reports.maintenance.filters.sortOrder"),
        placeholder: t("common.default"),
        options: ORDER_OPTIONS,
      },
    ],
    [t, SORT_OPTIONS, ORDER_OPTIONS],
  );

  const tableData = useMemo(() => data?.assets || [], [data]);

  const handleFilterChange = useCallback((f: LocalFilters) => {
    setLocalFilters(f);
    setPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;
  const summary = data?.summary;

  // ---- Columns ----
  const columns: ColumnConfig<AssetCostItem>[] = useMemo(
    () => [
      {
        key: "assetNumber",
        label: t("reports.maintenance.table.assetNumber"),
        render: (a) => (
          <span className="font-mono text-xs font-medium">{a.assetNumber}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.assetNumber.localeCompare(b.assetNumber),
        exportValue: (a) => a.assetNumber,
      },
      {
        key: "assetName",
        label: t("reports.maintenance.table.assetName"),
        render: (a) => (
          <div>
            <p className="font-medium text-sm">{a.assetName}</p>
            <p className="text-xs text-muted-foreground">{a.assetType}</p>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.assetName.localeCompare(b.assetName),
        exportValue: (a) => a.assetName,
      },
      {
        key: "requestCount",
        label: t("reports.maintenance.table.requests"),
        render: (a) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
            {a.requestCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.requestCount - b.requestCount,
        exportValue: (a) => a.requestCount,
        align: "center" as const,
      },
      {
        key: "totalEstimated",
        label: t("reports.maintenance.table.estimated"),
        render: (a) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(a.totalEstimated, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalEstimated - b.totalEstimated,
        exportValue: (a) => a.totalEstimated,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "totalActual",
        label: t("reports.maintenance.table.actual"),
        render: (a) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(a.totalActual, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalActual - b.totalActual,
        exportValue: (a) => a.totalActual,
        align: "end" as const,
      },
      {
        key: "costVariance",
        label: t("reports.maintenance.table.variance"),
        render: (a) => (
          <Badge className={getStatusBadgeClass(varianceTone(a.variancePercentage))}>
            {a.variancePercentage !== null
              ? `${a.variancePercentage > 0 ? "+" : ""}${a.variancePercentage.toFixed(1)}%`
              : "-"}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) =>
          (a.variancePercentage ?? 0) - (b.variancePercentage ?? 0),
        exportValue: (a) =>
          a.variancePercentage !== null
            ? `${a.variancePercentage.toFixed(1)}%`
            : "",
        align: "center" as const,
      },
      {
        key: "avgCostPerRequest",
        label: t("reports.maintenance.table.avgCost"),
        render: (a) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(a.avgCostPerRequest, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.avgCostPerRequest - b.avgCostPerRequest,
        exportValue: (a) => a.avgCostPerRequest,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "costToValueRatio",
        label: t("reports.maintenance.table.costValueRatio"),
        render: (a) =>
          a.costToValueRatio != null ? (
            <Badge
              className={getStatusBadgeClass(
                a.costToValueRatio > 50
                  ? "danger"
                  : a.costToValueRatio > 20
                    ? "warning"
                    : "success"
              )}
            >
              {a.costToValueRatio.toFixed(1)}%
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
        sortable: true,
        sortFn: (a, b) =>
          (a.costToValueRatio ?? -1) - (b.costToValueRatio ?? -1),
        exportValue: (a) =>
          a.costToValueRatio != null
            ? `${a.costToValueRatio.toFixed(1)}%`
            : "",
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t, currency],
  );

  return (
    <ReportPageLayout
      title={t("reports.maintenance.costPerAsset.title")}
      description={t("reports.maintenance.costPerAsset.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.maintenance.kpi.totalAssets")}
              value={summary.totalAssets}
              icon={Layers}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.grandTotalEstimated")}
              value={summary.grandTotalEstimated}
              currency={currency}
              icon={BarChart2}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.grandTotalActual")}
              value={summary.grandTotalActual}
              currency={currency}
              icon={DollarSign}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.totalVariance")}
              value={summary.totalVariance}
              currency={currency}
              icon={summary.totalVariance >= 0 ? TrendingDown : TrendingUp}
              variant={summary.totalVariance >= 0 ? "success" : "danger"}
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.avgCostPerAsset")}
              value={summary.avgCostPerAsset}
              currency={currency}
              icon={Package}
              variant="warning"
            />
            {summary.mostExpensiveAssetName && (
              <ReportMetricCard
                label={t("reports.maintenance.kpi.mostExpensive")}
                value={summary.mostExpensiveAssetName}
                icon={TrendingUp}
                variant="purple"
              />
            )}
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
      <DataTable<AssetCostItem>
        data={tableData}
        columns={columns}
        keyExtractor={(a) => a.assetId}
        enableClientSorting
        enableExport
        exportFilename="maintenance_cost_per_asset_report"
        exportTitle={t("reports.maintenance.costPerAsset.title")}
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

export default MaintenanceCostPerAssetReport;



