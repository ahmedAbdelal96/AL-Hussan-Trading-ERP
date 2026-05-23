/**
 * ============================================================================
 * PROJECT ASSET UTILIZATION REPORT
 * ============================================================================
 *
 * Report 10: Assets assigned to each project with values and maintenance costs.
 *
 * @page ProjectAssetUtilizationReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  Package,
  DollarSign,
  Wrench,
  BarChart2,
  Layers,
  Activity,
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

import { useProjectAssetUtilization } from "@/hooks/reports/useProjectsReport";

import type {
  ProjectAssetUtilizationItem,
  ProjectAssetUtilizationFilters,
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

const intensityTone = (pct: number): StatusTone => {
  if (pct > 30) return "danger";
  if (pct >= 15) return "warning";
  return "success";
};

// ============ PAGE COMPONENT ============

export const ProjectAssetUtilizationReport: React.FC = () => {
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
      { value: "totalAssetValue", label: t("reports.projects.sort.assetValue") },
      { value: "totalAssets", label: t("reports.projects.sort.assetCount") },
      { value: "maintenanceCost", label: t("reports.projects.sort.maintenanceCost") },
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
  const apiFilters = useMemo<ProjectAssetUtilizationFilters>(
    () => ({
      ...(localFilters.projectStatus && {
        projectStatus: localFilters.projectStatus as ProjectStatus,
      }),
      ...(localFilters.sortBy && {
        sortBy: localFilters.sortBy as ProjectAssetUtilizationFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useProjectAssetUtilization(apiFilters);

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
  const summary = data?.summary;

  // ---- Columns ----
  const columns: ColumnConfig<ProjectAssetUtilizationItem>[] = useMemo(
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
        key: "totalAssets",
        label: t("reports.projects.table.assets"),
        render: (p) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs font-bold")}>
            {p.totalAssets}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalAssets - b.totalAssets,
        exportValue: (p) => p.totalAssets,
        align: "center" as const,
      },
      {
        key: "totalAllocatedAssetValue",
        label: t("reports.projects.table.assetValue"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(p.totalAllocatedAssetValue, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalAllocatedAssetValue - b.totalAllocatedAssetValue,
        exportValue: (p) => p.totalAllocatedAssetValue,
        align: "end" as const,
      },
      {
        key: "totalMaintenanceCost",
        label: t("reports.projects.table.maintenanceCost"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(p.totalMaintenanceCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalMaintenanceCost - b.totalMaintenanceCost,
        exportValue: (p) => p.totalMaintenanceCost,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "totalAssetCost",
        label: t("reports.projects.table.totalAssetCost"),
        render: (p) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(p.totalAssetCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalAssetCost - b.totalAssetCost,
        exportValue: (p) => p.totalAssetCost,
        align: "end" as const,
      },
      {
        key: "maintenanceIntensity",
        label: t("reports.projects.table.maintenanceIntensity"),
        render: (p) => (
          p.totalAllocatedAssetValue > 0 ? (
            <Badge className={getStatusBadgeClass(intensityTone(p.maintenanceIntensity))}>
              {p.maintenanceIntensity.toFixed(1)}%
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )
        ),
        sortable: true,
        sortFn: (a, b) => a.maintenanceIntensity - b.maintenanceIntensity,
        exportValue: (p) => `${p.maintenanceIntensity.toFixed(1)}%`,
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t, currency],
  );

  return (
    <ReportPageLayout
      title={t("reports.projects.assetUtilization.title")}
      description={t("reports.projects.assetUtilization.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.projects.kpi.totalProjects")}
              value={data.projectCount}
              icon={Layers}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalAssets")}
              value={summary.totalAssignedAssets}
              icon={Package}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.avgAssetsPerProject")}
              value={summary.avgAssetsPerProject}
              icon={BarChart2}
              variant="purple"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalAssetValue")}
              value={summary.totalAllocatedAssetValue}
              currency={currency}
              icon={DollarSign}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalMaintenanceCost")}
              value={summary.totalMaintenanceCost}
              currency={currency}
              icon={Wrench}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.maintenanceIntensity")}
              value={summary.overallMaintenanceIntensity}
              isPercentage
              icon={Activity}
              variant={
                summary.overallMaintenanceIntensity > 30
                  ? "danger"
                  : summary.overallMaintenanceIntensity >= 15
                    ? "warning"
                    : "success"
              }
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
      <DataTable<ProjectAssetUtilizationItem>
        data={paginatedData}
        columns={columns}
        keyExtractor={(p) => p.projectId}
        enableClientSorting
        enableExport
        exportFilename="project_asset_utilization_report"
        exportTitle={t("reports.projects.assetUtilization.title")}
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

export default ProjectAssetUtilizationReport;


