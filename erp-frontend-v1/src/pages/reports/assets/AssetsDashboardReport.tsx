/**
 * ============================================================================
 * ASSETS DASHBOARD REPORT
 * ============================================================================
 *
 * Consolidates: Overview + ByType + ByStatus + ByLocation
 *
 * Layout:
 *   1. Filters bar  (date range, asset type, status)
 *   3. Charts       (DonutChart: status | BarChart: value by type)
 *   4. Tabbed tables (By Type / By Status / By Location)
 *
 * @page AssetsDashboardReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Package,
  DollarSign,
  Percent,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  TrendingUp,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";
import { ReportSummaryStrip } from "@/components/common/ReportSummaryStrip";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DonutChart from "@/components/charts-apex/DonutChart";
import BarChart from "@/components/charts-apex/BarChart";

import {
  useAssetsOverview,
  useAssetsByType,
  useAssetsByStatus,
  useAssetsByLocation,
} from "@/hooks/reports/useAssetsReport";

import type {
  AssetType,
  AssetStatus,
  AssetTypeBreakdown,
  AssetStatusBreakdown,
  LocationBreakdown,
  AssetAlert,
} from "@/types/reports/assets.types";

import { useTranslation } from "@/i18n/useTranslation";
import {
  getStatusBadgeClass,
  getStatusChartColor,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

const TYPE_COLORS: Record<string, string> = {
  VEHICLE: "#3b82f6",
  EQUIPMENT: "#f59e0b",
  MACHINERY: "#8b5cf6",
  TOOL: "#10b981",
  COMPUTER: "#06b6d4",
  FURNITURE: "#f97316",
  OTHER: "#6b7280",
};

const getAssetTypeTone = (assetType: string) => {
  switch (assetType.toUpperCase()) {
    case "VEHICLE":
      return "info";
    case "EQUIPMENT":
      return "warning";
    case "MACHINERY":
      return "neutral";
    case "TOOL":
      return "success";
    case "COMPUTER":
      return "info";
    case "FURNITURE":
      return "warning";
    default:
      return "neutral";
  }
};

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  assetType?: AssetType;
  status?: AssetStatus;
  search?: string;
}

type DashboardTableTab = "byType" | "byStatus" | "alerts" | "byLocation";
const DEFAULT_TABLE_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const AssetsDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<DashboardFilters>({});
  const [activeTab, setActiveTab] = useState<DashboardTableTab>("byType");
  const [tabPages, setTabPages] = useState<Record<DashboardTableTab, number>>({
    byType: 1,
    byStatus: 1,
    alerts: 1,
    byLocation: 1,
  });
  const [tabPageSizes, setTabPageSizes] = useState<
    Record<DashboardTableTab, number>
  >({
    byType: DEFAULT_TABLE_PAGE_SIZE,
    byStatus: DEFAULT_TABLE_PAGE_SIZE,
    alerts: DEFAULT_TABLE_PAGE_SIZE,
    byLocation: DEFAULT_TABLE_PAGE_SIZE,
  });

  const STATUS_MAP = useMemo(
    () => ({
      AVAILABLE: t("reports.assets.status.AVAILABLE"),
      IN_USE: t("reports.assets.status.IN_USE"),
      UNDER_MAINTENANCE: t("reports.assets.status.UNDER_MAINTENANCE"),
      OUT_OF_SERVICE: t("reports.assets.status.OUT_OF_SERVICE"),
      RETIRED: t("reports.assets.status.RETIRED"),
    }),
    [t],
  );

  const TYPE_MAP = useMemo(
    () => ({
      VEHICLE: t("reports.assets.type.VEHICLE"),
      EQUIPMENT: t("reports.assets.type.EQUIPMENT"),
      MACHINERY: t("reports.assets.type.MACHINERY"),
      TOOL: t("reports.assets.type.TOOL"),
      COMPUTER: t("reports.assets.type.COMPUTER"),
      FURNITURE: t("reports.assets.type.FURNITURE"),
      OTHER: t("reports.assets.type.OTHER"),
    }),
    [t],
  );

  const SELECT_FILTERS: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "assetType",
        label: t("reports.assets.byType.type"),
        options: Object.entries(TYPE_MAP).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        key: "status",
        label: t("reports.assets.byStatus.status"),
        options: Object.entries(STATUS_MAP).map(([value, label]) => ({
          value,
          label,
        })),
      },
    ],
    [t, TYPE_MAP, STATUS_MAP],
  );

  const baseFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      assetType: filters.assetType,
      status: filters.status,
    }),
    [filters],
  );

  const paginateTab = useCallback(
    <T,>(items: T[] | undefined, tab: DashboardTableTab) => {
      const list = items || [];
      const totalItems = list.length;
      const pageSize = tabPageSizes[tab] || DEFAULT_TABLE_PAGE_SIZE;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const currentPage = Math.min(Math.max(tabPages[tab] || 1, 1), totalPages);
      const start = (currentPage - 1) * pageSize;
      return {
        rows: list.slice(start, start + pageSize),
        pagination: {
          currentPage,
          pageSize,
          totalItems,
          totalPages,
        },
      };
    },
    [tabPageSizes, tabPages],
  );

  const overview = useAssetsOverview({
    ...baseFilters,
    includeComparison: true,
    includeWarrantyStatus: true,
  });
  const byType = useAssetsByType(baseFilters);
  const byStatus = useAssetsByStatus({ ...baseFilters, includeAlerts: true });
  const byLocation = useAssetsByLocation(baseFilters);

  const pagedByType = useMemo(
    () => paginateTab(byType.data?.breakdown, "byType"),
    [byType.data?.breakdown, paginateTab],
  );
  const pagedByStatus = useMemo(
    () => paginateTab(byStatus.data?.breakdown, "byStatus"),
    [byStatus.data?.breakdown, paginateTab],
  );
  const pagedAlerts = useMemo(
    () => paginateTab(byStatus.data?.alerts, "alerts"),
    [byStatus.data?.alerts, paginateTab],
  );
  const pagedByLocation = useMemo(
    () => paginateTab(byLocation.data?.breakdown, "byLocation"),
    [byLocation.data?.breakdown, paginateTab],
  );

  const isLoading =
    overview.isLoading ||
    byType.isLoading ||
    byStatus.isLoading ||
    byLocation.isLoading;
  const error =
    overview.error || byType.error || byStatus.error || byLocation.error;
  const hasData = !!(
    overview.data ||
    byType.data ||
    byStatus.data ||
    byLocation.data
  );

  const handleRefresh = useCallback(() => {
    overview.refetch();
    byType.refetch();
    byStatus.refetch();
    byLocation.refetch();
  }, [overview, byType, byStatus, byLocation]);

  const d = overview.data;

  const typeColumns: ColumnConfig<AssetTypeBreakdown>[] = useMemo(
    () => [
      {
        key: "assetType",
        label: t("reports.assets.byType.type"),
        sortable: true,
        sortFn: (a, b) => a.assetType.localeCompare(b.assetType),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(getAssetTypeTone(row.assetType))}
          >
            {TYPE_MAP[row.assetType as keyof typeof TYPE_MAP] || row.assetType}
          </Badge>
        ),
        exportValue: (row) =>
          TYPE_MAP[row.assetType as keyof typeof TYPE_MAP] || row.assetType,
        align: "center" as const,
      },
      {
        key: "assetCount",
        label: t("reports.assets.byType.count"),
        sortable: true,
        sortFn: (a, b) => a.assetCount - b.assetCount,
        render: (row) => row.assetCount.toLocaleString(),
        exportValue: (row) => row.assetCount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.assets.byType.share"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "totalValue",
        label: t("reports.assets.overview.totalValue"),
        sortable: true,
        sortFn: (a, b) => a.totalValue - b.totalValue,
        render: (row) => row.totalValue.toLocaleString(),
        exportValue: (row) => row.totalValue,
        align: "end" as const,
      },
      {
        key: "averageValue",
        label: t("reports.assets.byType.avgValue"),
        sortable: true,
        sortFn: (a, b) => a.averageValue - b.averageValue,
        render: (row) => row.averageValue.toLocaleString(),
        exportValue: (row) => row.averageValue,
        align: "end" as const,
      },
      {
        key: "averageAge",
        label: t("reports.assets.byType.avgAge"),
        sortable: true,
        sortFn: (a, b) => a.averageAge - b.averageAge,
        render: (row) => row.averageAge.toFixed(1),
        exportValue: (row) => row.averageAge,
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t, TYPE_MAP],
  );

  const statusColumns: ColumnConfig<AssetStatusBreakdown>[] = useMemo(
    () => [
      {
        key: "status",
        label: t("reports.assets.byStatus.status"),
        sortable: true,
        sortFn: (a, b) => a.status.localeCompare(b.status),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getStatusTone(row.status))}>
            {STATUS_MAP[row.status as keyof typeof STATUS_MAP] || row.status}
          </Badge>
        ),
        exportValue: (row) =>
          STATUS_MAP[row.status as keyof typeof STATUS_MAP] || row.status,
        align: "center" as const,
      },
      {
        key: "assetCount",
        label: t("reports.assets.byStatus.count"),
        sortable: true,
        sortFn: (a, b) => a.assetCount - b.assetCount,
        render: (row) => row.assetCount.toLocaleString(),
        exportValue: (row) => row.assetCount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.assets.byStatus.share"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "totalValue",
        label: t("reports.assets.byStatus.value"),
        sortable: true,
        sortFn: (a, b) => a.totalValue - b.totalValue,
        render: (row) => row.totalValue.toLocaleString(),
        exportValue: (row) => row.totalValue,
        align: "end" as const,
      },
      {
        key: "averageAge",
        label: t("reports.assets.byStatus.avgAge"),
        sortable: true,
        sortFn: (a, b) => a.averageAge - b.averageAge,
        render: (row) => row.averageAge.toFixed(1),
        exportValue: (row) => row.averageAge,
        align: "end" as const,
      },
      {
        key: "averageDaysInStatus",
        label: t("reports.assets.byStatus.avgDays"),
        sortable: true,
        sortFn: (a, b) => a.averageDaysInStatus - b.averageDaysInStatus,
        render: (row) => row.averageDaysInStatus.toFixed(0),
        exportValue: (row) => row.averageDaysInStatus,
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t, STATUS_MAP],
  );

  const alertColumns: ColumnConfig<AssetAlert>[] = useMemo(
    () => [
      {
        key: "assetNumber",
        label: t("reports.assets.byStatus.assetNumber"),
        sortable: true,
        sortFn: (a, b) => a.assetNumber.localeCompare(b.assetNumber),
        exportValue: (row) => row.assetNumber,
        align: "start" as const,
      },
      {
        key: "name",
        label: t("reports.assets.byStatus.name"),
        sortable: true,
        sortFn: (a, b) => a.name.localeCompare(b.name),
        exportValue: (row) => row.name,
        align: "start" as const,
      },
      {
        key: "status",
        label: t("reports.assets.byStatus.status"),
        sortable: true,
        sortFn: (a, b) => a.status.localeCompare(b.status),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getStatusTone(row.status))}>
            {STATUS_MAP[row.status as keyof typeof STATUS_MAP] || row.status}
          </Badge>
        ),
        exportValue: (row) =>
          STATUS_MAP[row.status as keyof typeof STATUS_MAP] || row.status,
        align: "center" as const,
      },
      {
        key: "alertReason",
        label: t("reports.assets.byStatus.alertReason"),
        sortable: true,
        sortFn: (a, b) => a.alertReason.localeCompare(b.alertReason),
        exportValue: (row) => row.alertReason,
        align: "start" as const,
      },
      {
        key: "daysInStatus",
        label: t("reports.assets.byStatus.daysInStatus"),
        sortable: true,
        sortFn: (a, b) => a.daysInStatus - b.daysInStatus,
        render: (row) => (
          <span className="text-amber-600 font-medium">{row.daysInStatus}</span>
        ),
        exportValue: (row) => row.daysInStatus,
        align: "end" as const,
      },
    ],
    [t, STATUS_MAP],
  );

  const locationColumns: ColumnConfig<LocationBreakdown>[] = useMemo(
    () => [
      {
        key: "location",
        label: t("reports.assets.byLocation.location"),
        sortable: true,
        sortFn: (a, b) => a.location.localeCompare(b.location),
        exportValue: (row) => row.location,
        align: "start" as const,
      },
      {
        key: "assetCount",
        label: t("reports.assets.byLocation.count"),
        sortable: true,
        sortFn: (a, b) => a.assetCount - b.assetCount,
        render: (row) => row.assetCount.toLocaleString(),
        exportValue: (row) => row.assetCount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.assets.byLocation.share"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "totalValue",
        label: t("reports.assets.byLocation.totalValue"),
        sortable: true,
        sortFn: (a, b) => a.totalValue - b.totalValue,
        render: (row) => row.totalValue.toLocaleString(),
        exportValue: (row) => row.totalValue,
        align: "end" as const,
      },
      {
        key: "availableAssets",
        label: t("reports.assets.byLocation.available"),
        sortable: true,
        sortFn: (a, b) => a.availableAssets - b.availableAssets,
        render: (row) => row.availableAssets.toLocaleString(),
        exportValue: (row) => row.availableAssets,
        align: "end" as const,
      },
      {
        key: "assetsInUse",
        label: t("reports.assets.byLocation.inUse"),
        sortable: true,
        sortFn: (a, b) => a.assetsInUse - b.assetsInUse,
        render: (row) => row.assetsInUse.toLocaleString(),
        exportValue: (row) => row.assetsInUse,
        align: "end" as const,
      },
    ],
    [t],
  );

  const statusChartData = useMemo(() => {
    const bk = byStatus.data?.breakdown || [];
    return {
      labels: bk.map(
        (s) => STATUS_MAP[s.status as keyof typeof STATUS_MAP] || s.status,
      ),
      series: bk.map((s) => s.assetCount),
      colors: bk.map((s) => getStatusChartColor(s.status)),
    };
  }, [byStatus.data, STATUS_MAP]);

  const typeChartData = useMemo(() => {
    const bk = byType.data?.breakdown || [];
    return {
      categories: bk.map(
        (b) => TYPE_MAP[b.assetType as keyof typeof TYPE_MAP] || b.assetType,
      ),
      series: [
        {
          name: t("reports.assets.overview.totalValue"),
          data: bk.map((b) => b.totalValue),
        },
      ],
      colors: bk.map((b) => TYPE_COLORS[b.assetType] || "#6b7280"),
    };
  }, [byType.data, t, TYPE_MAP]);

  return (
    <ReportPageLayout
      title={t("reports.assets.overview.title")}
      description={t("reports.assets.overview.description")}
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      onPrint={() => window.print()}
      summaryStrip={
        d && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.assets.overview.totalAssets"),
                value: (d.totalAssets ?? 0).toLocaleString("en-US"),
              },
              {
                label: t("reports.assets.overview.inUse"),
                value: (d.assetsInUse ?? 0).toLocaleString("en-US"),
                valueClassName: "text-blue-600",
              },
              {
                label: t("reports.assets.overview.utilizationRate"),
                value: `${(d.utilizationRate ?? 0).toFixed(1)}%`,
                valueClassName:
                  (d.utilizationRate ?? 0) >= 70
                    ? "text-emerald-600"
                    : (d.utilizationRate ?? 0) >= 40
                      ? "text-amber-600"
                      : "text-red-600",
              },
              {
                label: t("reports.assets.overview.outOfService"),
                value: (d.assetsOutOfService ?? 0).toLocaleString("en-US"),
                valueClassName:
                  (d.assetsOutOfService ?? 0) > 0 ? "text-red-600" : undefined,
              },
            ]}
          />
        )
      }
      filters={
        <ReportFilters<DashboardFilters>
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            setTabPages({
              byType: 1,
              byStatus: 1,
              alerts: 1,
              byLocation: 1,
            });
          }}
          selectFilters={SELECT_FILTERS}
          dateFilters={[
            { key: "startDate", label: t("reports.common.startDate") },
            { key: "endDate", label: t("reports.common.endDate") },
          ]}
          showReset
        />
      }
      kpiCards={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportMetricCard
            label={t("reports.assets.overview.totalAssets")}
            value={d?.totalAssets ?? 0}
            icon={Package}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.assets.overview.totalValue")}
            value={(d?.totalValue ?? 0).toLocaleString()}
            icon={DollarSign}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.assets.overview.inUse")}
            value={d?.assetsInUse ?? 0}
            icon={CheckCircle2}
            variant="info"
          />
          <ReportMetricCard
            label={t("reports.assets.overview.maintenance")}
            value={d?.assetsUnderMaintenance ?? 0}
            icon={Wrench}
            variant="warning"
          />
          <ReportMetricCard
            label={t("reports.assets.overview.utilizationRate")}
            value={`${(d?.utilizationRate ?? 0).toFixed(1)}%`}
            icon={Percent}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.assets.overview.availabilityRate")}
            value={`${(d?.availabilityRate ?? 0).toFixed(1)}%`}
            icon={TrendingUp}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.assets.overview.newAcquisitions")}
            value={d?.newAcquisitions ?? 0}
            icon={BarChart3}
            variant="purple"
          />
          <ReportMetricCard
            label={t("reports.assets.overview.outOfService")}
            value={d?.assetsOutOfService ?? 0}
            icon={AlertTriangle}
            variant="danger"
          />
        </div>
      }
      charts={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChartCard title={t("reports.assets.byStatus.chartTitle")}>
            {statusChartData.series.length > 0 ? (
              <DonutChart
                labels={statusChartData.labels}
                series={statusChartData.series}
                colors={statusChartData.colors}
                height={300}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>

          <ReportChartCard title={t("reports.assets.byType.valueChart")}>
            {typeChartData.categories.length > 0 ? (
              <BarChart
                categories={typeChartData.categories}
                series={typeChartData.series}
                height={300}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>
        </div>
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DashboardTableTab)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="byType">
            {t("reports.assets.byType.tableTitle")}
          </TabsTrigger>
          <TabsTrigger value="byStatus">
            {t("reports.assets.byStatus.breakdownTable")}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 me-1" />
            {t("reports.assets.byStatus.alertsTitle")}
          </TabsTrigger>
          <TabsTrigger value="byLocation">
            {t("reports.assets.byLocation.tableTitle")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="byType">
          <DataTable<AssetTypeBreakdown>
            data={pagedByType.rows}
            columns={typeColumns}
            keyExtractor={(item) => item.assetType}
            pagination={pagedByType.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, byType: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTabPageSizes((prev) => ({ ...prev, byType: nextSize }));
              setTabPages((prev) => ({ ...prev, byType: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byType.isLoading}
            enableExport
            exportFilename="assets-by-type"
          />
        </TabsContent>

        <TabsContent value="byStatus">
          <DataTable<AssetStatusBreakdown>
            data={pagedByStatus.rows}
            columns={statusColumns}
            keyExtractor={(item) => item.status}
            pagination={pagedByStatus.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, byStatus: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTabPageSizes((prev) => ({ ...prev, byStatus: nextSize }));
              setTabPages((prev) => ({ ...prev, byStatus: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byStatus.isLoading}
            enableExport
            exportFilename="assets-by-status"
          />
        </TabsContent>

        <TabsContent value="alerts">
          <DataTable<AssetAlert>
            data={pagedAlerts.rows}
            columns={alertColumns}
            keyExtractor={(item) => item.assetId}
            pagination={pagedAlerts.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, alerts: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTabPageSizes((prev) => ({ ...prev, alerts: nextSize }));
              setTabPages((prev) => ({ ...prev, alerts: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byStatus.isLoading}
            enableExport
            exportFilename="assets-alerts"
          />
        </TabsContent>

        <TabsContent value="byLocation">
          <DataTable<LocationBreakdown>
            data={pagedByLocation.rows}
            columns={locationColumns}
            keyExtractor={(item) => item.location}
            pagination={pagedByLocation.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, byLocation: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTabPageSizes((prev) => ({ ...prev, byLocation: nextSize }));
              setTabPages((prev) => ({ ...prev, byLocation: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byLocation.isLoading}
            enableExport
            exportFilename="assets-by-location"
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default AssetsDashboardReport;
