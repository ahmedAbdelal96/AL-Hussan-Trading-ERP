/**
 * ============================================================================
 * MAINTENANCE ANALYTICS REPORT
 * ============================================================================
 *
 * Consolidates: ByAsset + CostAnalysis + Performance + Preventive
 *
 * Layout -> 4 tabs:
 *   Tab 1: By Asset -> per-asset frequency, cost, preventive vs corrective
 *   Tab 2: Cost Analysis -> breakdowns by type/vendor, monthly trends
 *   Tab 3: Performance -> MTTR, MTBF, on-time rates, employee/vendor metrics
 *   Tab 4: Preventive -> compliance, upcoming/overdue schedules, cost savings
 *
 * @page MaintenanceAnalyticsReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Wrench,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Percent,
  BarChart3,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AreaChart from "@/components/charts-apex/AreaChart";
import DonutChart from "@/components/charts-apex/DonutChart";

import {
  useMaintenanceByAsset,
  useMaintenanceCostAnalysis,
  useMaintenancePerformance,
  usePreventiveMaintenance,
} from "@/hooks/reports/useMaintenanceReport";

import type {
  AssetMaintenanceBreakdown,
  CostByType,
  CostByAssetType,
  EmployeePerformance,
  VendorPerformance,
  UpcomingPreventiveMaintenance,
  OverduePreventiveMaintenance,
} from "@/types/reports/maintenance.types";

import { useTranslation } from "@/i18n/useTranslation";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

const getMaintenanceTypeTone = (type: string) => {
  switch (type.toUpperCase()) {
    case "PREVENTIVE":
      return "success";
    case "CORRECTIVE":
      return "warning";
    case "EMERGENCY":
      return "danger";
    case "SCHEDULED":
      return "info";
    default:
      return "neutral";
  }
};

const getPriorityTone = (priority: string) => {
  switch (priority.toUpperCase()) {
    case "LOW":
      return "success";
    case "MEDIUM":
      return "warning";
    case "HIGH":
      return "warning";
    case "CRITICAL":
      return "danger";
    default:
      return "neutral";
  }
};


interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}


export const MaintenanceAnalyticsReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const TYPE_MAP = useMemo(
    () => ({
      PREVENTIVE: t("reports.maintenance.type.PREVENTIVE"),
      CORRECTIVE: t("reports.maintenance.type.CORRECTIVE"),
      EMERGENCY: t("reports.maintenance.type.EMERGENCY"),
      SCHEDULED: t("reports.maintenance.type.SCHEDULED"),
    }),
    [t],
  );

  const PRIORITY_MAP = useMemo(
    () => ({
      LOW: t("reports.maintenance.priority.LOW"),
      MEDIUM: t("reports.maintenance.priority.MEDIUM"),
      HIGH: t("reports.maintenance.priority.HIGH"),
      CRITICAL: t("reports.maintenance.priority.CRITICAL"),
    }),
    [t],
  );

  
  const apiFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters.startDate, filters.endDate],
  );

  const byAsset = useMaintenanceByAsset({
    ...apiFilters,
    page,
    limit: pageSize,
    includeCostRatio: true,
  });
  const costAnalysis = useMaintenanceCostAnalysis({
    ...apiFilters,
    includeTrends: true,
    includeTopCostly: true,
  });
  const performance = useMaintenancePerformance({
    ...apiFilters,
    includeEmployeeMetrics: true,
    includeVendorMetrics: true,
    includeOnTimeMetrics: true,
    includeMTTR: true,
  });
  const preventive = usePreventiveMaintenance({
    ...apiFilters,
    includeUpcoming: true,
    includeOverdue: true,
    includeUnscheduled: true,
    includeCostSavings: true,
  });

  const isLoading =
    byAsset.isLoading ||
    costAnalysis.isLoading ||
    performance.isLoading ||
    preventive.isLoading;
  const error =
    byAsset.error ||
    costAnalysis.error ||
    performance.error ||
    preventive.error;
  const hasData = !!(
    byAsset.data ||
    costAnalysis.data ||
    performance.data ||
    preventive.data
  );

  const handleRefresh = useCallback(() => {
    byAsset.refetch();
    costAnalysis.refetch();
    performance.refetch();
    preventive.refetch();
  }, [byAsset, costAnalysis, performance, preventive]);

 
  const assetColumns: ColumnConfig<AssetMaintenanceBreakdown>[] = useMemo(
    () => [
      {
        key: "assetNumber",
        label: t("reports.maintenance.byAsset.assetNumber"),
        sortable: true,
        sortFn: (a, b) => a.assetNumber.localeCompare(b.assetNumber),
        exportValue: (row) => row.assetNumber,
        align: "start" as const,
      },
      {
        key: "assetName",
        label: t("reports.maintenance.byAsset.assetName"),
        sortable: true,
        sortFn: (a, b) => a.assetName.localeCompare(b.assetName),
        exportValue: (row) => row.assetName,
        align: "start" as const,
      },
      {
        key: "maintenanceCount",
        label: t("reports.maintenance.byAsset.count"),
        sortable: true,
        sortFn: (a, b) => a.maintenanceCount - b.maintenanceCount,
        render: (row) => row.maintenanceCount.toLocaleString(),
        exportValue: (row) => row.maintenanceCount,
        align: "end" as const,
      },
      {
        key: "totalCost",
        label: t("reports.maintenance.byAsset.totalCost"),
        sortable: true,
        sortFn: (a, b) => a.totalCost - b.totalCost,
        render: (row) => row.totalCost.toLocaleString(),
        exportValue: (row) => row.totalCost,
        align: "end" as const,
      },
      {
        key: "preventiveCount",
        label: t("reports.maintenance.byAsset.preventive"),
        sortable: true,
        sortFn: (a, b) => a.preventiveCount - b.preventiveCount,
        render: (row) => row.preventiveCount.toLocaleString(),
        exportValue: (row) => row.preventiveCount,
        align: "end" as const,
      },
      {
        key: "correctiveCount",
        label: t("reports.maintenance.byAsset.corrective"),
        sortable: true,
        sortFn: (a, b) => a.correctiveCount - b.correctiveCount,
        render: (row) => row.correctiveCount.toLocaleString(),
        exportValue: (row) => row.correctiveCount,
        align: "end" as const,
      },
      {
        key: "daysSinceLastMaintenance",
        label: t("reports.maintenance.byAsset.daysSince"),
        sortable: true,
        sortFn: (a, b) =>
          a.daysSinceLastMaintenance - b.daysSinceLastMaintenance,
        render: (row) => row.daysSinceLastMaintenance.toLocaleString(),
        exportValue: (row) => row.daysSinceLastMaintenance,
        align: "end" as const,
      },
    ],
    [t],
  );

  
  const costByTypeColumns: ColumnConfig<CostByType>[] = useMemo(
    () => [
      {
        key: "type",
        label: t("reports.maintenance.costAnalysis.type"),
        sortable: true,
        sortFn: (a, b) => a.type.localeCompare(b.type),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getMaintenanceTypeTone(row.type))}>
            {TYPE_MAP[row.type as keyof typeof TYPE_MAP] || row.type}
          </Badge>
        ),
        exportValue: (row) =>
          TYPE_MAP[row.type as keyof typeof TYPE_MAP] || row.type,
        align: "center" as const,
      },
      {
        key: "requestCount",
        label: t("reports.maintenance.costAnalysis.requests"),
        sortable: true,
        sortFn: (a, b) => a.requestCount - b.requestCount,
        render: (row) => row.requestCount.toLocaleString(),
        exportValue: (row) => row.requestCount,
        align: "end" as const,
      },
      {
        key: "estimatedCost",
        label: t("reports.maintenance.costAnalysis.estimated"),
        sortable: true,
        sortFn: (a, b) => a.estimatedCost - b.estimatedCost,
        render: (row) => row.estimatedCost.toLocaleString(),
        exportValue: (row) => row.estimatedCost,
        align: "end" as const,
      },
      {
        key: "actualCost",
        label: t("reports.maintenance.costAnalysis.actualCost"),
        sortable: true,
        sortFn: (a, b) => a.actualCost - b.actualCost,
        render: (row) => row.actualCost.toLocaleString(),
        exportValue: (row) => row.actualCost,
        align: "end" as const,
      },
      {
        key: "costVariance",
        label: t("reports.maintenance.costAnalysis.variance"),
        sortable: true,
        sortFn: (a, b) => a.costVariance - b.costVariance,
        render: (row) => (
          <span
            className={row.costVariance > 0 ? "text-red-600" : "text-green-600"}
          >
            {row.costVariance.toLocaleString()}
          </span>
        ),
        exportValue: (row) => row.costVariance,
        align: "end" as const,
      },
    ],
    [t, TYPE_MAP],
  );

  
  const costByAssetTypeColumns: ColumnConfig<CostByAssetType>[] = useMemo(
    () => [
      {
        key: "assetType",
        label: t("reports.maintenance.costAnalysis.assetType"),
        sortable: true,
        sortFn: (a, b) => a.assetType.localeCompare(b.assetType),
        exportValue: (row) => row.assetType,
        align: "start" as const,
      },
      {
        key: "assetCount",
        label: t("reports.maintenance.costAnalysis.assets"),
        sortable: true,
        sortFn: (a, b) => a.assetCount - b.assetCount,
        render: (row) => row.assetCount.toLocaleString(),
        exportValue: (row) => row.assetCount,
        align: "end" as const,
      },
      {
        key: "requestCount",
        label: t("reports.maintenance.costAnalysis.requests"),
        sortable: true,
        sortFn: (a, b) => a.requestCount - b.requestCount,
        render: (row) => row.requestCount.toLocaleString(),
        exportValue: (row) => row.requestCount,
        align: "end" as const,
      },
      {
        key: "totalCost",
        label: t("reports.maintenance.costAnalysis.totalCost"),
        sortable: true,
        sortFn: (a, b) => a.totalCost - b.totalCost,
        render: (row) => row.totalCost.toLocaleString(),
        exportValue: (row) => row.totalCost,
        align: "end" as const,
      },
      {
        key: "averageCostPerRequest",
        label: t("reports.maintenance.costAnalysis.avgCost"),
        sortable: true,
        sortFn: (a, b) => a.averageCostPerRequest - b.averageCostPerRequest,
        render: (row) => row.averageCostPerRequest.toLocaleString(),
        exportValue: (row) => row.averageCostPerRequest,
        align: "end" as const,
      },
    ],
    [t],
  );

  
  const employeeColumns: ColumnConfig<EmployeePerformance>[] = useMemo(
    () => [
      {
        key: "employeeName",
        label: t("reports.maintenance.performance.employee"),
        sortable: true,
        sortFn: (a, b) => a.employeeName.localeCompare(b.employeeName),
        exportValue: (row) => row.employeeName,
        align: "start" as const,
      },
      {
        key: "assignedCount",
        label: t("reports.maintenance.performance.assigned"),
        sortable: true,
        sortFn: (a, b) => a.assignedCount - b.assignedCount,
        render: (row) => row.assignedCount.toLocaleString(),
        exportValue: (row) => row.assignedCount,
        align: "end" as const,
      },
      {
        key: "completedCount",
        label: t("reports.maintenance.performance.completed"),
        sortable: true,
        sortFn: (a, b) => a.completedCount - b.completedCount,
        render: (row) => row.completedCount.toLocaleString(),
        exportValue: (row) => row.completedCount,
        align: "end" as const,
      },
      {
        key: "completionRate",
        label: t("reports.maintenance.overview.completionRate"),
        sortable: true,
        sortFn: (a, b) => a.completionRate - b.completionRate,
        render: (row) => `${row.completionRate.toFixed(1)}%`,
        exportValue: (row) => row.completionRate,
        align: "end" as const,
      },
      {
        key: "onTimeRate",
        label: t("reports.maintenance.performance.onTimeRate"),
        sortable: true,
        sortFn: (a, b) => a.onTimeRate - b.onTimeRate,
        render: (row) => `${row.onTimeRate.toFixed(1)}%`,
        exportValue: (row) => row.onTimeRate,
        align: "end" as const,
      },
    ],
    [t],
  );

  
  const vendorColumns: ColumnConfig<VendorPerformance>[] = useMemo(
    () => [
      {
        key: "vendor",
        label: t("reports.maintenance.performance.vendor"),
        sortable: true,
        sortFn: (a, b) => a.vendor.localeCompare(b.vendor),
        exportValue: (row) => row.vendor,
        align: "start" as const,
      },
      {
        key: "assignedCount",
        label: t("reports.maintenance.performance.assigned"),
        sortable: true,
        sortFn: (a, b) => a.assignedCount - b.assignedCount,
        render: (row) => row.assignedCount.toLocaleString(),
        exportValue: (row) => row.assignedCount,
        align: "end" as const,
      },
      {
        key: "completionRate",
        label: t("reports.maintenance.overview.completionRate"),
        sortable: true,
        sortFn: (a, b) => a.completionRate - b.completionRate,
        render: (row) => `${row.completionRate.toFixed(1)}%`,
        exportValue: (row) => row.completionRate,
        align: "end" as const,
      },
      {
        key: "totalCost",
        label: t("reports.maintenance.performance.totalCost"),
        sortable: true,
        sortFn: (a, b) => a.totalCost - b.totalCost,
        render: (row) => row.totalCost.toLocaleString(),
        exportValue: (row) => row.totalCost,
        align: "end" as const,
      },
      {
        key: "costVariancePercentage",
        label: t("reports.maintenance.performance.costVariance"),
        sortable: true,
        sortFn: (a, b) => a.costVariancePercentage - b.costVariancePercentage,
        render: (row) => (
          <span
            className={
              row.costVariancePercentage > 0 ? "text-red-600" : "text-green-600"
            }
          >
            {row.costVariancePercentage.toFixed(1)}%
          </span>
        ),
        exportValue: (row) => row.costVariancePercentage,
        align: "end" as const,
      },
    ],
    [t],
  );

  
  const upcomingColumns: ColumnConfig<UpcomingPreventiveMaintenance>[] =
    useMemo(
      () => [
        {
          key: "maintenanceNumber",
          label: t("reports.maintenance.preventive.number"),
          sortable: true,
          sortFn: (a, b) =>
            a.maintenanceNumber.localeCompare(b.maintenanceNumber),
          exportValue: (row) => row.maintenanceNumber,
          align: "start" as const,
        },
        {
          key: "assetName",
          label: t("reports.maintenance.preventive.assetName"),
          sortable: true,
          sortFn: (a, b) => a.assetName.localeCompare(b.assetName),
          exportValue: (row) => row.assetName,
          align: "start" as const,
        },
        {
          key: "title",
          label: t("reports.maintenance.preventive.requestTitle"),
          sortable: true,
          sortFn: (a, b) => a.title.localeCompare(b.title),
          exportValue: (row) => row.title,
          align: "start" as const,
          hideMobile: true,
        },
        {
          key: "daysUntilDue",
          label: t("reports.maintenance.preventive.daysUntil"),
          sortable: true,
          sortFn: (a, b) => a.daysUntilDue - b.daysUntilDue,
          render: (row) => (
            <span
              className={
                row.daysUntilDue <= 7 ? "text-amber-600 font-medium" : ""
              }
            >
              {row.daysUntilDue}
            </span>
          ),
          exportValue: (row) => row.daysUntilDue,
          align: "end" as const,
        },
        {
          key: "estimatedCost",
          label: t("reports.maintenance.preventive.estimatedCost"),
          sortable: true,
          sortFn: (a, b) => a.estimatedCost - b.estimatedCost,
          render: (row) => row.estimatedCost.toLocaleString(),
          exportValue: (row) => row.estimatedCost,
          align: "end" as const,
        },
      ],
      [t],
    );

 
  const overdueColumns: ColumnConfig<OverduePreventiveMaintenance>[] = useMemo(
    () => [
      {
        key: "maintenanceNumber",
        label: t("reports.maintenance.preventive.number"),
        sortable: true,
        sortFn: (a, b) =>
          a.maintenanceNumber.localeCompare(b.maintenanceNumber),
        exportValue: (row) => row.maintenanceNumber,
        align: "start" as const,
      },
      {
        key: "assetName",
        label: t("reports.maintenance.preventive.assetName"),
        sortable: true,
        sortFn: (a, b) => a.assetName.localeCompare(b.assetName),
        exportValue: (row) => row.assetName,
        align: "start" as const,
      },
      {
        key: "priority",
        label: t("reports.maintenance.preventive.priority"),
        sortable: true,
        sortFn: (a, b) => a.priority.localeCompare(b.priority),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getPriorityTone(row.priority))}>
            {PRIORITY_MAP[row.priority as keyof typeof PRIORITY_MAP] ||
              row.priority}
          </Badge>
        ),
        exportValue: (row) =>
          PRIORITY_MAP[row.priority as keyof typeof PRIORITY_MAP] ||
          row.priority,
        align: "center" as const,
      },
      {
        key: "daysOverdue",
        label: t("reports.maintenance.preventive.daysOverdue"),
        sortable: true,
        sortFn: (a, b) => a.daysOverdue - b.daysOverdue,
        render: (row) => (
          <span className="text-red-600 font-medium">{row.daysOverdue}</span>
        ),
        exportValue: (row) => row.daysOverdue,
        align: "end" as const,
      },
    ],
    [t, PRIORITY_MAP],
  );

  
  const costTrendData = useMemo(() => {
    const trends = costAnalysis.data?.monthlyTrends || [];
    return {
      categories: trends.map((m) => m.month),
      series: [
        {
          name: t("reports.maintenance.costAnalysis.estimated"),
          data: trends.map((m) => m.estimatedCost),
        },
        {
          name: t("reports.maintenance.costAnalysis.actualCost"),
          data: trends.map((m) => m.actualCost),
        },
      ],
    };
  }, [costAnalysis.data, t]);

  const preventiveChartData = useMemo(() => {
    const p = preventive.data;
    if (!p) return { labels: [], series: [], colors: [] };
    return {
      labels: [
        t("reports.maintenance.preventive.completedLabel"),
        t("reports.maintenance.preventive.overdueLabel"),
        t("reports.maintenance.preventive.upcomingLabel"),
      ],
      series: [p.completedPreventiveCount, p.overdueCount, p.upcomingCount],
      colors: ["#10b981", "#ef4444", "#f59e0b"],
    };
  }, [preventive.data, t]);

 
  const perf = performance.data;
  const ca = costAnalysis.data;
  const prev = preventive.data;

  return (
    <ReportPageLayout
      title={t("reports.maintenance.costAnalysis.title")}
      description={t("reports.maintenance.costAnalysis.description")}
      borderColor="error"
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      filters={
        <ReportFilters<AnalyticsFilters>
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          dateFilters={[
            { key: "startDate", label: t("reports.common.startDate") },
            { key: "endDate", label: t("reports.common.endDate") },
          ]}
          showReset
        />
      }
    >
      <Tabs defaultValue="byAsset" className="w-full">
        <TabsList>
          <TabsTrigger value="byAsset">
            {t("reports.maintenance.byAsset.title")}
          </TabsTrigger>
          <TabsTrigger value="cost">
            <DollarSign className="h-4 w-4 me-1" />
            {t("reports.maintenance.costAnalysis.title")}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 me-1" />
            {t("reports.maintenance.performance.title")}
          </TabsTrigger>
          <TabsTrigger value="preventive">
            <ShieldCheck className="h-4 w-4 me-1" />
            {t("reports.maintenance.preventive.title")}
          </TabsTrigger>
        </TabsList>

       
        <TabsContent value="byAsset" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.maintenance.byAsset.totalAssets")}
              value={byAsset.data?.totalAssets ?? 0}
              icon={Wrench}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.maintenance.byAsset.totalRequests")}
              value={byAsset.data?.totalMaintenanceRequests ?? 0}
              icon={BarChart3}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.maintenance.byAsset.avgFrequency")}
              value={(byAsset.data?.averageMaintenanceFrequency ?? 0).toFixed(
                1,
              )}
              icon={Clock}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.maintenance.byAsset.totalCost")}
              value={(
                byAsset.data?.breakdown?.reduce((s, b) => s + b.totalCost, 0) ?? 0
              ).toLocaleString()}
              icon={DollarSign}
              variant="purple"
            />
          </div>
          <DataTable<AssetMaintenanceBreakdown>
            data={byAsset.data?.breakdown || []}
            columns={assetColumns}
            keyExtractor={(item) => item.assetId}
                pagination={{
                  currentPage: page,
                  pageSize: pageSize,
                  totalItems: byAsset.data?.meta?.totalItems || 0,
                  totalPages: byAsset.data?.meta?.totalPages || 1,
                }}
            onPageChange={setPage}
            isLoading={byAsset.isLoading}
            enableExport
            exportFilename="maintenance-by-asset"
          />
        </TabsContent>

        
        <TabsContent value="cost" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.maintenance.costAnalysis.totalRequests")}
              value={ca?.totalRequests ?? 0}
              icon={Wrench}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.maintenance.costAnalysis.estimated")}
              value={(ca?.totalEstimatedCost ?? 0).toLocaleString()}
              icon={DollarSign}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.maintenance.costAnalysis.actual")}
              value={(ca?.totalActualCost ?? 0).toLocaleString()}
              icon={DollarSign}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.maintenance.costAnalysis.variance")}
              value={(ca?.totalCostVariance ?? 0).toLocaleString()}
              icon={TrendingUp}
              variant={(ca?.totalCostVariance ?? 0) > 0 ? "danger" : "success"}
            />
          </div>

          {costTrendData.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.maintenance.costAnalysis.monthlyTrends")}
            >
              <AreaChart
                categories={costTrendData.categories}
                series={costTrendData.series}
                height={300}
              />
            </ReportChartCard>
          )}

          <Tabs defaultValue="costByType">
            <TabsList>
              <TabsTrigger value="costByType">
                {t("reports.maintenance.costAnalysis.costByTypeTable")}
              </TabsTrigger>
              <TabsTrigger value="costByAssetType">
                {t("reports.maintenance.costAnalysis.costByAssetTypeTable")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="costByType">
              <DataTable<CostByType>
                data={ca?.costByType || []}
                columns={costByTypeColumns}
                keyExtractor={(item) => item.type}
                pagination={{
                  currentPage: page,
                  pageSize: pageSize,
                  totalItems: ca?.costByType?.length || 0,
                  totalPages: Math.ceil(
                    (ca?.costByType?.length || 0) / pageSize,
                  ),
                }}
                onPageChange={setPage}
                isLoading={costAnalysis.isLoading}
                enableExport
                exportFilename="maintenance-cost-by-type"
              />
            </TabsContent>
            <TabsContent value="costByAssetType">
              <DataTable<CostByAssetType>
                data={ca?.costByAssetType || []}
                columns={costByAssetTypeColumns}
                keyExtractor={(item) => item.assetType}
                pagination={{
                  currentPage: page,
                  pageSize: pageSize,
                  totalItems: ca?.costByAssetType?.length || 0,
                  totalPages: Math.ceil(
                    (ca?.costByAssetType?.length || 0) / pageSize,
                  ),
                }}
                onPageChange={setPage}
                isLoading={costAnalysis.isLoading}
                enableExport
                exportFilename="maintenance-cost-by-asset-type"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.maintenance.performance.completionRate")}
              value={`${(perf?.overallCompletionRate ?? 0).toFixed(1)}%`}
              icon={Percent}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.maintenance.performance.mttrLabel")}
              value={`${(perf?.mttr ?? 0).toFixed(1)} ${t("reports.maintenance.overview.days")}`}
              icon={Clock}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.maintenance.performance.mtbfLabel")}
              value={`${(perf?.mtbf ?? 0).toFixed(1)} ${t("reports.maintenance.overview.days")}`}
              icon={ShieldCheck}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.maintenance.performance.onTimeRate")}
              value={`${(perf?.onTimeMetrics?.onTimeRate ?? 0).toFixed(1)}%`}
              icon={TrendingUp}
              variant="warning"
            />
          </div>

          <Tabs defaultValue="employees">
            <TabsList>
              <TabsTrigger value="employees">
                {t("reports.maintenance.performance.employeeTable")}
              </TabsTrigger>
              <TabsTrigger value="vendors">
                {t("reports.maintenance.performance.vendorTable")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="employees">
              <DataTable<EmployeePerformance>
                data={perf?.employeePerformance || []}
                columns={employeeColumns}
                keyExtractor={(item) => item.employeeId}
                pagination={{
                  currentPage: page,
                  pageSize: pageSize,
                  totalItems: perf?.employeePerformance?.length || 0,
                  totalPages: Math.ceil(
                    (perf?.employeePerformance?.length || 0) / pageSize,
                  ),
                }}
                onPageChange={setPage}
                isLoading={performance.isLoading}
                enableExport
                exportFilename="maintenance-employee-performance"
              />
            </TabsContent>
            <TabsContent value="vendors">
              <DataTable<VendorPerformance>
                data={perf?.vendorPerformance || []}
                columns={vendorColumns}
                keyExtractor={(item) => item.vendor}
                pagination={{
                  currentPage: page,
                  pageSize: pageSize,
                  totalItems: perf?.vendorPerformance?.length || 0,
                  totalPages: Math.ceil(
                    (perf?.vendorPerformance?.length || 0) / pageSize,
                  ),
                }}
                onPageChange={setPage}
                isLoading={performance.isLoading}
                enableExport
                exportFilename="maintenance-vendor-performance"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

       
        <TabsContent value="preventive" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.maintenance.preventive.total")}
              value={prev?.totalPreventiveCount ?? 0}
              icon={ShieldCheck}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.maintenance.preventive.complianceRate")}
              value={`${(prev?.complianceRate ?? 0).toFixed(1)}%`}
              icon={Percent}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.maintenance.preventive.upcoming")}
              value={prev?.upcomingCount ?? 0}
              icon={Clock}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.maintenance.preventive.overdue")}
              value={prev?.overdueCount ?? 0}
              icon={AlertTriangle}
              variant="danger"
            />
          </div>

          {preventiveChartData.series.some((v) => v > 0) && (
            <ReportChartCard
              title={t("reports.maintenance.preventive.complianceChart")}
            >
              <DonutChart
                labels={preventiveChartData.labels}
                series={preventiveChartData.series}
                colors={preventiveChartData.colors}
                height={300}
              />
            </ReportChartCard>
          )}

          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">
                {t("reports.maintenance.preventive.upcomingTable")}
              </TabsTrigger>
              <TabsTrigger value="overdue">
                {t("reports.maintenance.preventive.overdueTable")}
                {(prev?.overdueCount ?? 0) > 0 && (
                  <Badge
                    className={`${getStatusBadgeClass("danger")} ms-1 text-xs`}
                  >
                    {prev?.overdueCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <DataTable<UpcomingPreventiveMaintenance>
                data={prev?.upcomingSchedule || []}
                columns={upcomingColumns}
                keyExtractor={(item) => item.maintenanceNumber}
                pagination={{
                  currentPage: page,
                  pageSize: pageSize,
                  totalItems: prev?.upcomingSchedule?.length || 0,
                  totalPages: Math.ceil(
                    (prev?.upcomingSchedule?.length || 0) / pageSize,
                  ),
                }}
                onPageChange={setPage}
                isLoading={preventive.isLoading}
                enableExport
                exportFilename="preventive-upcoming"
              />
            </TabsContent>
            <TabsContent value="overdue">
              <DataTable<OverduePreventiveMaintenance>
                data={prev?.overduePreventive || []}
                columns={overdueColumns}
                keyExtractor={(item) => item.maintenanceNumber}
                pagination={{
                  currentPage: page,
                  pageSize: pageSize,
                  totalItems: prev?.overduePreventive?.length || 0,
                  totalPages: Math.ceil(
                    (prev?.overduePreventive?.length || 0) / pageSize,
                  ),
                }}
                onPageChange={setPage}
                isLoading={preventive.isLoading}
                enableExport
                exportFilename="preventive-overdue"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default MaintenanceAnalyticsReport;

