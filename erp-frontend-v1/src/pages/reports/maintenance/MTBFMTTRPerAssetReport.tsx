/**
 * ============================================================================
 * MTBF / MTTR PER ASSET REPORT
 * ============================================================================
 *
 * Report 8: Per-asset reliability metrics - Mean Time Between Failures and
 * Mean Time To Repair - with a composite reliability score.
 *
 * @page MTBFMTTRPerAssetReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Activity,
  Timer,
  Clock,
  ShieldCheck,
  Layers,
  TrendingUp,
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

import { useMaintenanceMtbfMttr } from "@/hooks/reports/useMaintenanceReport";

import type {
  AssetMtbfMttrItem,
  MaintenanceMtbfMttrFilters,
} from "@/types/reports/maintenance.types";

import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface LocalFilters {
  sortBy?: string;
  sortOrder?: string;
}

// ============ HELPERS ============

const reliabilityTone = (score: number): StatusTone => {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
};

const fmtDays = (days: number) =>
  days === 0 ? "-" : `${days.toFixed(1)} d`;

// ============ PAGE COMPONENT ============

export const MTBFMTTRPerAssetReport: React.FC = () => {
  const { t } = useTranslation();

  const SORT_OPTIONS = useMemo(
    () => [
      {
        value: "mtbf",
        label: t("reports.maintenance.sort.mtbf"),
      },
      {
        value: "mttr",
        label: t("reports.maintenance.sort.mttr"),
      },
      {
        value: "assetName",
        label: t("reports.maintenance.sort.assetName"),
      },
      {
        value: "failureCount",
        label: t("reports.maintenance.sort.failureCount"),
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
  const apiFilters = useMemo<MaintenanceMtbfMttrFilters>(
    () => ({
      page,
      limit: pageSize,
      ...(localFilters.sortBy && {
        sortBy: localFilters.sortBy as MaintenanceMtbfMttrFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters, page, pageSize],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useMaintenanceMtbfMttr(apiFilters);

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

  const summary = data?.summary;

  // ---- Columns ----
  const columns: ColumnConfig<AssetMtbfMttrItem>[] = useMemo(
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
        key: "totalMaintenanceCount",
        label: t("reports.maintenance.table.totalCount"),
        render: (a) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
            {a.totalMaintenanceCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalMaintenanceCount - b.totalMaintenanceCount,
        exportValue: (a) => a.totalMaintenanceCount,
        align: "center" as const,
        hideMobile: true,
      },
      {
        key: "completedCount",
        label: t("reports.maintenance.table.completed"),
        render: (a) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs font-bold")}>
            {a.completedCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.completedCount - b.completedCount,
        exportValue: (a) => a.completedCount,
        align: "center" as const,
      },
      {
        key: "mttr",
        label: t("reports.maintenance.table.mttr"),
        render: (a) => (
          <span className="text-sm font-medium">{fmtDays(a.mttr)}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.mttr - b.mttr,
        exportValue: (a) => a.mttr,
        align: "center" as const,
      },
      {
        key: "mtbf",
        label: t("reports.maintenance.table.mtbf"),
        render: (a) => (
          <span className="text-sm font-medium">{fmtDays(a.mtbf)}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.mtbf - b.mtbf,
        exportValue: (a) => a.mtbf,
        align: "center" as const,
      },
      {
        key: "reliabilityScore",
        label: t("reports.maintenance.table.reliability"),
        render: (a) => (
          <Badge className={getStatusBadgeClass(reliabilityTone(a.reliabilityScore))}>
            {a.reliabilityScore.toFixed(0)}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.reliabilityScore - b.reliabilityScore,
        exportValue: (a) => a.reliabilityScore.toFixed(0),
        align: "center" as const,
      },
      {
        key: "lastMaintenanceDate",
        label: t("reports.maintenance.table.lastDate"),
        render: (a) =>
          a.lastMaintenanceDate ? (
            <span className="text-xs text-muted-foreground">
              {new Date(a.lastMaintenanceDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          ),
        exportValue: (a) => a.lastMaintenanceDate ?? "",
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  return (
    <ReportPageLayout
      title={t("reports.maintenance.mtbfMttr.title")}
      description={t("reports.maintenance.mtbfMttr.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.maintenance.kpi.totalAssets")}
              value={summary.totalAssets}
              icon={Layers}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.avgMttr")}
              value={summary.avgMttr}
              icon={Clock}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.avgMtbf")}
              value={summary.avgMtbf}
              icon={Timer}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.maintenance.kpi.avgReliability")}
              value={summary.avgReliabilityScore}
              icon={ShieldCheck}
              variant={
                summary.avgReliabilityScore >= 70
                  ? "success"
                  : summary.avgReliabilityScore >= 40
                    ? "warning"
                    : "danger"
              }
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
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {t("reports.maintenance.mtbfMttr.mttrExplain")}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {t("reports.maintenance.mtbfMttr.mtbfExplain")}
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          {t("reports.maintenance.mtbfMttr.reliabilityExplain")}
        </span>
      </div>

      <DataTable<AssetMtbfMttrItem>
        data={tableData}
        columns={columns}
        keyExtractor={(a) => a.assetId}
        enableClientSorting
        enableExport
        exportFilename="mtbf_mttr_per_asset_report"
        exportTitle={t("reports.maintenance.mtbfMttr.title")}
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

export default MTBFMTTRPerAssetReport;




