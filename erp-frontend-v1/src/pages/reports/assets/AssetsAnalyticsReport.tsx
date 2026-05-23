/**
 * ============================================================================
 * ASSETS ANALYTICS REPORT (Operations-First)
 * ============================================================================
 *
 * Management-focused operational report:
 * - Which assets are running vs stopped
 * - Idle assets requiring action
 * - Utilization quality by asset type
 * - Operational alerts
 *
 * @page AssetsAnalyticsReport
 * @version 3.0.0
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Package,
  Settings2,
  Wrench,
} from "lucide-react";
import {
  ReportChartCard,
  ReportFilters,
  ReportMetricCard,
  ReportPageLayout,
} from "@/components/reports/shared";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BarChart from "@/components/charts-apex/BarChart";
import DonutChart from "@/components/charts-apex/DonutChart";
import {
  useAssetsByStatus,
  useUtilizationReport,
} from "@/hooks/reports/useAssetsReport";
import type {
  AssetAlert,
  AssetOperationSummary,
  AssetStatus,
  AssetType,
  IdleAsset,
  TypeUtilization,
} from "@/types/reports/assets.types";
import { useTranslation } from "@/i18n/useTranslation";
import {
  getStatusBadgeClass,
  getStatusChartColor,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

type TableKey = "utilByType" | "idleAssets" | "opsSummary" | "statusAlerts";
const DEFAULT_TABLE_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const getAssetTypeTone = (assetType: AssetType) => {
  switch (assetType) {
    case "TOOL":
      return "success";
    case "VEHICLE":
    case "COMPUTER":
      return "info";
    case "EQUIPMENT":
    case "FURNITURE":
      return "warning";
    case "MACHINERY":
      return "neutral";
    default:
      return "neutral";
  }
};

const getUtilizationTone = (value: number) => {
  if (value >= 70) return "success";
  if (value >= 40) return "warning";
  return "danger";
};

export const AssetsAnalyticsReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [tablePages, setTablePages] = useState<Record<TableKey, number>>({
    utilByType: 1,
    idleAssets: 1,
    opsSummary: 1,
    statusAlerts: 1,
  });
  const [tablePageSizes, setTablePageSizes] = useState<Record<TableKey, number>>(
    {
      utilByType: DEFAULT_TABLE_PAGE_SIZE,
      idleAssets: DEFAULT_TABLE_PAGE_SIZE,
      opsSummary: DEFAULT_TABLE_PAGE_SIZE,
      statusAlerts: DEFAULT_TABLE_PAGE_SIZE,
    },
  );

  const TYPE_MAP = useMemo(
    () =>
      ({
        VEHICLE: t("reports.assets.type.VEHICLE"),
        EQUIPMENT: t("reports.assets.type.EQUIPMENT"),
        MACHINERY: t("reports.assets.type.MACHINERY"),
        TOOL: t("reports.assets.type.TOOL"),
        COMPUTER: t("reports.assets.type.COMPUTER"),
        FURNITURE: t("reports.assets.type.FURNITURE"),
        OTHER: t("reports.assets.type.OTHER"),
      }) as const,
    [t],
  );

  const STATUS_MAP = useMemo(
    () =>
      ({
        AVAILABLE: t("reports.assets.status.AVAILABLE"),
        IN_USE: t("reports.assets.status.IN_USE"),
        UNDER_MAINTENANCE: t("reports.assets.status.UNDER_MAINTENANCE"),
        OUT_OF_SERVICE: t("reports.assets.status.OUT_OF_SERVICE"),
        RETIRED: t("reports.assets.status.RETIRED"),
      }) as const,
    [t],
  );

  const queryFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters],
  );

  const utilization = useUtilizationReport({
    ...queryFilters,
    includeIdleAssets: true,
    includeOperations: true,
  });

  const byStatus = useAssetsByStatus({
    ...queryFilters,
    includeAlerts: true,
  });

  const isLoading = utilization.isLoading || byStatus.isLoading;
  const error = utilization.error || byStatus.error;
  const hasData = !!(utilization.data || byStatus.data);

  const handleRefresh = useCallback(() => {
    utilization.refetch();
    byStatus.refetch();
  }, [utilization, byStatus]);

  const paginate = useCallback(
    <T,>(items: T[] | undefined, table: TableKey) => {
      const list = items || [];
      const totalItems = list.length;
      const pageSize = tablePageSizes[table] || DEFAULT_TABLE_PAGE_SIZE;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const currentPage = Math.min(
        Math.max(tablePages[table] || 1, 1),
        totalPages,
      );
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
    [tablePageSizes, tablePages],
  );

  const pagedUtilByType = useMemo(
    () => paginate(utilization.data?.byType, "utilByType"),
    [utilization.data?.byType, paginate],
  );
  const pagedIdleAssets = useMemo(
    () => paginate(utilization.data?.idleAssets, "idleAssets"),
    [utilization.data?.idleAssets, paginate],
  );
  const pagedOpsSummary = useMemo(
    () => paginate(utilization.data?.mostUtilized, "opsSummary"),
    [utilization.data?.mostUtilized, paginate],
  );
  const pagedStatusAlerts = useMemo(
    () => paginate(byStatus.data?.alerts, "statusAlerts"),
    [byStatus.data?.alerts, paginate],
  );

  const statusCount = useCallback(
    (status: AssetStatus) =>
      byStatus.data?.breakdown.find((row) => row.status === status)?.assetCount ??
      0,
    [byStatus.data?.breakdown],
  );

  const utilTypeColumns: ColumnConfig<TypeUtilization>[] = useMemo(
    () => [
      {
        key: "assetType",
        label: t("reports.assets.byType.type"),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getAssetTypeTone(row.assetType))}>
            {TYPE_MAP[row.assetType] || row.assetType}
          </Badge>
        ),
        align: "center",
      },
      {
        key: "assetCount",
        label: t("reports.assets.utilization.count"),
        render: (row) => row.assetCount.toLocaleString(),
        align: "end",
      },
      {
        key: "averageUtilization",
        label: t("reports.assets.utilization.rate"),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              getUtilizationTone(row.averageUtilization),
            )}
          >
            {row.averageUtilization.toFixed(1)}%
          </Badge>
        ),
        align: "center",
      },
      {
        key: "totalHours",
        label: t("reports.assets.utilization.totalHours"),
        render: (row) => row.totalHours.toLocaleString(),
        align: "end",
      },
      {
        key: "idleAssets",
        label: t("reports.assets.utilization.idleAssets"),
        render: (row) => row.idleAssets.toLocaleString(),
        align: "end",
      },
    ],
    [t, TYPE_MAP],
  );

  const idleColumns: ColumnConfig<IdleAsset>[] = useMemo(
    () => [
      {
        key: "assetNumber",
        label: t("reports.assets.utilization.assetNumber"),
      },
      {
        key: "name",
        label: t("reports.assets.utilization.name"),
      },
      {
        key: "assetType",
        label: t("reports.assets.byType.type"),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getAssetTypeTone(row.assetType))}>
            {TYPE_MAP[row.assetType] || row.assetType}
          </Badge>
        ),
        align: "center",
      },
      {
        key: "daysIdle",
        label: t("reports.assets.utilization.daysSinceLastUse"),
        render: (row) => (
          <span className="font-medium text-amber-600">{row.daysIdle}</span>
        ),
        align: "end",
      },
      {
        key: "location",
        label: t("reports.assets.utilization.location"),
      },
    ],
    [t, TYPE_MAP],
  );

  const opsColumns: ColumnConfig<AssetOperationSummary>[] = useMemo(
    () => [
      {
        key: "assetNumber",
        label: t("reports.assets.utilization.assetNumber"),
      },
      {
        key: "name",
        label: t("reports.assets.utilization.name"),
      },
      {
        key: "operationCount",
        label: t("reports.assets.utilization.totalOps"),
        render: (row) => row.operationCount.toLocaleString(),
        align: "end",
      },
      {
        key: "totalHours",
        label: t("reports.assets.utilization.totalHours"),
        render: (row) => row.totalHours.toLocaleString(),
        align: "end",
      },
      {
        key: "utilizationRate",
        label: t("reports.assets.utilization.rate"),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              getUtilizationTone(row.utilizationRate),
            )}
          >
            {row.utilizationRate.toFixed(1)}%
          </Badge>
        ),
        align: "center",
      },
    ],
    [t],
  );

  const alertColumns: ColumnConfig<AssetAlert>[] = useMemo(
    () => [
      {
        key: "assetNumber",
        label: t("reports.assets.byStatus.assetNumber"),
      },
      {
        key: "name",
        label: t("reports.assets.byStatus.name"),
      },
      {
        key: "status",
        label: t("reports.assets.byStatus.status"),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getStatusTone(row.status))}>
            {STATUS_MAP[row.status] || row.status}
          </Badge>
        ),
        align: "center",
      },
      {
        key: "alertReason",
        label: t("reports.assets.byStatus.alertReason"),
      },
      {
        key: "daysInStatus",
        label: t("reports.assets.byStatus.daysInStatus"),
        render: (row) => (
          <span className="font-medium text-amber-600">{row.daysInStatus}</span>
        ),
        align: "end",
      },
    ],
    [t, STATUS_MAP],
  );

  const utilByTypeChart = useMemo(() => {
    const rows = utilization.data?.byType || [];
    return {
      categories: rows.map((row) => TYPE_MAP[row.assetType] || row.assetType),
      series: [
        {
          name: t("reports.assets.utilization.rate"),
          data: rows.map((row) => row.averageUtilization),
        },
      ],
    };
  }, [utilization.data?.byType, TYPE_MAP, t]);

  const statusChart = useMemo(() => {
    const rows = byStatus.data?.breakdown || [];
    return {
      labels: rows.map((row) => STATUS_MAP[row.status] || row.status),
      series: rows.map((row) => row.assetCount),
      colors: rows.map((row) => getStatusChartColor(row.status)),
    };
  }, [byStatus.data?.breakdown, STATUS_MAP]);

  return (
    <ReportPageLayout
      title={t("reports.assets.utilization.title")}
      description={t("reports.assets.utilization.description")}
      borderColor="warning"
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      filters={
        <ReportFilters<AnalyticsFilters>
          filters={filters}
          onFilterChange={(next) => {
            setFilters(next);
            setTablePages({
              utilByType: 1,
              idleAssets: 1,
              opsSummary: 1,
              statusAlerts: 1,
            });
          }}
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
            label={t("reports.assets.utilization.totalAssets")}
            value={utilization.data?.totalAssets ?? 0}
            icon={Package}
            variant="info"
          />
          <ReportMetricCard
            label={t("reports.assets.status.IN_USE")}
            value={statusCount("IN_USE")}
            icon={Activity}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.assets.status.UNDER_MAINTENANCE")}
            value={statusCount("UNDER_MAINTENANCE")}
            icon={Wrench}
            variant="warning"
          />
          <ReportMetricCard
            label={t("reports.assets.status.OUT_OF_SERVICE")}
            value={statusCount("OUT_OF_SERVICE")}
            icon={Settings2}
            variant="danger"
          />
          <ReportMetricCard
            label={t("reports.assets.utilization.overall")}
            value={`${(utilization.data?.overallUtilization ?? 0).toFixed(1)}%`}
            icon={BarChart3}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.assets.utilization.highUtil")}
            value={utilization.data?.highUtilizationCount ?? 0}
            icon={BarChart3}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.assets.utilization.idle")}
            value={utilization.data?.idleAssetsCount ?? 0}
            icon={Clock}
            variant="warning"
          />
          <ReportMetricCard
            label={t("reports.assets.byStatus.alertsTitle")}
            value={byStatus.data?.alerts?.length ?? 0}
            icon={AlertTriangle}
            variant="danger"
          />
        </div>
      }
      charts={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChartCard title={t("reports.assets.utilization.typeChart")}>
            {utilByTypeChart.categories.length > 0 ? (
              <BarChart
                categories={utilByTypeChart.categories}
                series={utilByTypeChart.series}
                height={300}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>

          <ReportChartCard title={t("reports.assets.byStatus.chartTitle")}>
            {statusChart.series.length > 0 ? (
              <DonutChart
                labels={statusChart.labels}
                series={statusChart.series}
                colors={statusChart.colors}
                height={300}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>
        </div>
      }
    >
      <Tabs defaultValue="utilByType" className="w-full">
        <TabsList>
          <TabsTrigger value="utilByType">
            {t("reports.assets.utilization.byTypeTable")}
          </TabsTrigger>
          <TabsTrigger value="idleAssets">
            {t("reports.assets.utilization.idleTable")}
          </TabsTrigger>
          <TabsTrigger value="opsSummary">
            {t("reports.assets.utilization.opsTable")}
          </TabsTrigger>
          <TabsTrigger value="statusAlerts">
            {t("reports.assets.byStatus.alertsTitle")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="utilByType">
          <DataTable<TypeUtilization>
            data={pagedUtilByType.rows}
            columns={utilTypeColumns}
            keyExtractor={(row) => row.assetType}
            pagination={pagedUtilByType.pagination}
            onPageChange={(nextPage) =>
              setTablePages((prev) => ({ ...prev, utilByType: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTablePageSizes((prev) => ({ ...prev, utilByType: nextSize }));
              setTablePages((prev) => ({ ...prev, utilByType: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={utilization.isLoading}
            enableExport
            exportFilename="assets-utilization-by-type"
          />
        </TabsContent>

        <TabsContent value="idleAssets">
          <DataTable<IdleAsset>
            data={pagedIdleAssets.rows}
            columns={idleColumns}
            keyExtractor={(row) => row.assetId}
            pagination={pagedIdleAssets.pagination}
            onPageChange={(nextPage) =>
              setTablePages((prev) => ({ ...prev, idleAssets: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTablePageSizes((prev) => ({ ...prev, idleAssets: nextSize }));
              setTablePages((prev) => ({ ...prev, idleAssets: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={utilization.isLoading}
            enableExport
            exportFilename="assets-idle"
          />
        </TabsContent>

        <TabsContent value="opsSummary">
          <DataTable<AssetOperationSummary>
            data={pagedOpsSummary.rows}
            columns={opsColumns}
            keyExtractor={(row) => row.assetId}
            pagination={pagedOpsSummary.pagination}
            onPageChange={(nextPage) =>
              setTablePages((prev) => ({ ...prev, opsSummary: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTablePageSizes((prev) => ({ ...prev, opsSummary: nextSize }));
              setTablePages((prev) => ({ ...prev, opsSummary: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={utilization.isLoading}
            enableExport
            exportFilename="assets-operations-summary"
          />
        </TabsContent>

        <TabsContent value="statusAlerts">
          <DataTable<AssetAlert>
            data={pagedStatusAlerts.rows}
            columns={alertColumns}
            keyExtractor={(row) => row.assetId}
            pagination={pagedStatusAlerts.pagination}
            onPageChange={(nextPage) =>
              setTablePages((prev) => ({ ...prev, statusAlerts: nextPage }))
            }
            onPageSizeChange={(nextSize) => {
              setTablePageSizes((prev) => ({ ...prev, statusAlerts: nextSize }));
              setTablePages((prev) => ({ ...prev, statusAlerts: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byStatus.isLoading}
            enableExport
            exportFilename="assets-status-alerts"
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default AssetsAnalyticsReport;
