/**
 * ============================================================================
 * MAINTENANCE DASHBOARD REPORT
 * ============================================================================
 *
 * Consolidates: Overview + ByType + ByStatus
 *
 * Layout:
 *   1. Filters bar  (date range)
 *   2. KPI cards    (8 cards - totals, completion, costs, overdue)
 *   3. Charts       (DonutChart: status | BarChart: type distribution)
 *   4. Tabbed tables (Type / Status / Overdue Alerts)
 *
 * @page MaintenanceDashboardReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Percent,
  DollarSign,
  BarChart3,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";
import { ReportSummaryStrip } from "@/components/common/ReportSummaryStrip";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DonutChart from "@/components/charts-apex/DonutChart";
import BarChart from "@/components/charts-apex/BarChart";

import {
  useMaintenanceOverview,
  useMaintenanceByType,
  useMaintenanceByStatus,
} from "@/hooks/reports/useMaintenanceReport";

import type {
  MaintenanceTypeBreakdown,
  MaintenanceStatusBreakdown,
  OverdueMaintenance,
} from "@/types/reports/maintenance.types";

import { useTranslation } from "@/i18n/useTranslation";
import {
  getStatusBadgeClass,
  getStatusChartColor,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

const TYPE_COLORS: Record<string, string> = {
  PREVENTIVE: "#10b981",
  CORRECTIVE: "#f59e0b",
  EMERGENCY: "#ef4444",
  SCHEDULED: "#3b82f6",
};

const getMaintenanceTypeTone = (type: string) => {
  switch (type) {
    case "PREVENTIVE":
      return "success" as const;
    case "CORRECTIVE":
      return "warning" as const;
    case "EMERGENCY":
      return "danger" as const;
    case "SCHEDULED":
      return "info" as const;
    default:
      return "neutral" as const;
  }
};

const getPriorityTone = (priority: string) => {
  switch (priority) {
    case "CRITICAL":
      return "danger" as const;
    case "HIGH":
      return "accent" as const;
    case "MEDIUM":
      return "warning" as const;
    case "LOW":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
};

// --- Filter type ---
interface DashboardFilters {
  startDate?: string;
  endDate?: string;
}

// --- Component ---
export const MaintenanceDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<DashboardFilters>({});
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // ---
  const STATUS_MAP = useMemo(
    () => ({
      PENDING: t("reports.maintenance.status.PENDING"),
      IN_PROGRESS: t("reports.maintenance.status.IN_PROGRESS"),
      ON_HOLD: t("reports.maintenance.status.ON_HOLD"),
      COMPLETED: t("reports.maintenance.status.COMPLETED"),
      CANCELLED: t("reports.maintenance.status.CANCELLED"),
    }),
    [t],
  );

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

  // ---
  const baseFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters.startDate, filters.endDate],
  );

  const overview = useMaintenanceOverview({
    ...baseFilters,
    includeComparison: true,
    includeOverdueAlerts: true,
  });
  const byType = useMaintenanceByType(baseFilters);
  const byStatus = useMaintenanceByStatus({
    ...baseFilters,
    includeAlerts: true,
  });

  const isLoading =
    overview.isLoading || byType.isLoading || byStatus.isLoading;
  const error = overview.error || byType.error || byStatus.error;
  const hasData = !!(overview.data || byType.data || byStatus.data);

  const handleRefresh = useCallback(() => {
    overview.refetch();
    byType.refetch();
    byStatus.refetch();
  }, [overview, byType, byStatus]);

  // ---
  const d = overview.data;

  // ---
  const typeColumns: ColumnConfig<MaintenanceTypeBreakdown>[] = useMemo(
    () => [
      {
        key: "type",
        label: t("reports.maintenance.byType.type"),
        sortable: true,
        sortFn: (a, b) => a.type.localeCompare(b.type),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(getMaintenanceTypeTone(row.type))}
          >
            {TYPE_MAP[row.type as keyof typeof TYPE_MAP] || row.type}
          </Badge>
        ),
        exportValue: (row) =>
          TYPE_MAP[row.type as keyof typeof TYPE_MAP] || row.type,
        align: "center" as const,
      },
      {
        key: "count",
        label: t("reports.maintenance.byType.count"),
        sortable: true,
        sortFn: (a, b) => a.count - b.count,
        render: (row) => row.count.toLocaleString(),
        exportValue: (row) => row.count,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.maintenance.byType.share"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "totalEstimatedCost",
        label: t("reports.maintenance.byType.estimatedCost"),
        sortable: true,
        sortFn: (a, b) => a.totalEstimatedCost - b.totalEstimatedCost,
        render: (row) => row.totalEstimatedCost.toLocaleString(),
        exportValue: (row) => row.totalEstimatedCost,
        align: "end" as const,
      },
      {
        key: "totalActualCost",
        label: t("reports.maintenance.byType.actualCost"),
        sortable: true,
        sortFn: (a, b) => a.totalActualCost - b.totalActualCost,
        render: (row) => row.totalActualCost.toLocaleString(),
        exportValue: (row) => row.totalActualCost,
        align: "end" as const,
      },
      {
        key: "completionRate",
        label: t("reports.maintenance.byType.completionRate"),
        sortable: true,
        sortFn: (a, b) => a.completionRate - b.completionRate,
        render: (row) => `${row.completionRate.toFixed(1)}%`,
        exportValue: (row) => row.completionRate,
        align: "end" as const,
      },
    ],
    [t, TYPE_MAP],
  );

  // ---
  const statusColumns: ColumnConfig<MaintenanceStatusBreakdown>[] = useMemo(
    () => [
      {
        key: "status",
        label: t("reports.maintenance.byStatus.status"),
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
        key: "count",
        label: t("reports.maintenance.byStatus.count"),
        sortable: true,
        sortFn: (a, b) => a.count - b.count,
        render: (row) => row.count.toLocaleString(),
        exportValue: (row) => row.count,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.maintenance.byStatus.share"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "totalCost",
        label: t("reports.maintenance.byStatus.totalCost"),
        sortable: true,
        sortFn: (a, b) => a.totalCost - b.totalCost,
        render: (row) => row.totalCost.toLocaleString(),
        exportValue: (row) => row.totalCost,
        align: "end" as const,
      },
      {
        key: "averageDaysInStatus",
        label: t("reports.maintenance.byStatus.avgDays"),
        sortable: true,
        sortFn: (a, b) => a.averageDaysInStatus - b.averageDaysInStatus,
        render: (row) => row.averageDaysInStatus.toFixed(1),
        exportValue: (row) => row.averageDaysInStatus,
        align: "end" as const,
      },
    ],
    [t, STATUS_MAP],
  );

  // ---
  const overdueColumns: ColumnConfig<OverdueMaintenance>[] = useMemo(
    () => [
      {
        key: "maintenanceNumber",
        label: t("reports.maintenance.overview.number"),
        sortable: true,
        sortFn: (a, b) =>
          a.maintenanceNumber.localeCompare(b.maintenanceNumber),
        exportValue: (row) => row.maintenanceNumber,
        align: "start" as const,
      },
      {
        key: "title",
        label: t("reports.maintenance.byStatus.requestTitle"),
        sortable: true,
        sortFn: (a, b) => a.title.localeCompare(b.title),
        exportValue: (row) => row.title,
        align: "start" as const,
        hideMobile: true,
      },
      {
        key: "assetName",
        label: t("reports.maintenance.overview.asset"),
        sortable: true,
        sortFn: (a, b) => a.assetName.localeCompare(b.assetName),
        exportValue: (row) => row.assetName,
        align: "start" as const,
      },
      {
        key: "priority",
        label: t("reports.maintenance.overview.priority"),
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
        label: t("reports.maintenance.overview.daysOverdue"),
        sortable: true,
        sortFn: (a, b) => a.daysOverdue - b.daysOverdue,
        render: (row) => (
          <span className="text-red-600 font-medium">{row.daysOverdue}</span>
        ),
        exportValue: (row) => row.daysOverdue,
        align: "end" as const,
      },
      {
        key: "estimatedCost",
        label: t("reports.maintenance.byType.estimatedCost"),
        sortable: true,
        sortFn: (a, b) => a.estimatedCost - b.estimatedCost,
        render: (row) => row.estimatedCost.toLocaleString(),
        exportValue: (row) => row.estimatedCost,
        align: "end" as const,
      },
    ],
    [t, PRIORITY_MAP],
  );

  // ---
  const statusChartData = useMemo(() => {
    const dist = d?.statusDistribution || [];
    return {
      labels: dist.map(
        (s) => STATUS_MAP[s.status as keyof typeof STATUS_MAP] || s.status,
      ),
      series: dist.map((s) => s.count),
      colors: dist.map((s) => getStatusChartColor(s.status)),
    };
  }, [d, STATUS_MAP]);

  const typeChartData = useMemo(() => {
    const bk = byType.data?.breakdown || [];
    return {
      categories: bk.map(
        (b) => TYPE_MAP[b.type as keyof typeof TYPE_MAP] || b.type,
      ),
      series: [
        {
          name: t("reports.maintenance.byType.estimatedCost"),
          data: bk.map((b) => b.totalEstimatedCost),
        },
        {
          name: t("reports.maintenance.byType.actualCost"),
          data: bk.map((b) => b.totalActualCost),
        },
      ],
      colors: bk.map((b) => TYPE_COLORS[b.type] || "#6b7280"),
    };
  }, [byType.data, t, TYPE_MAP]);

  return (
    <ReportPageLayout
      title={t("reports.maintenance.overview.title")}
      description={t("reports.maintenance.overview.description")}
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
                label: t("reports.maintenance.overview.totalRequests"),
                value: (d.totalRequests ?? 0).toLocaleString("en-US"),
              },
              {
                label: t("reports.maintenance.overview.completed"),
                value: (d.completedRequests ?? 0).toLocaleString("en-US"),
                valueClassName: "text-emerald-600",
              },
              {
                label: t("reports.maintenance.overview.overdue"),
                value: (d.overdueCount ?? 0).toLocaleString("en-US"),
                valueClassName:
                  (d.overdueCount ?? 0) > 0 ? "text-red-600" : undefined,
              },
              {
                label: t("reports.maintenance.overview.completionRate"),
                value: `${(d.completionRate ?? 0).toFixed(1)}%`,
                valueClassName:
                  (d.completionRate ?? 0) >= 80
                    ? "text-emerald-600"
                    : (d.completionRate ?? 0) >= 50
                      ? "text-amber-600"
                      : "text-red-600",
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
            setPage(1);
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
            label={t("reports.maintenance.overview.totalRequests")}
            value={d?.totalRequests ?? 0}
            icon={Wrench}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.maintenance.overview.completed")}
            value={d?.completedRequests ?? 0}
            icon={CheckCircle2}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.maintenance.overview.inProgress")}
            value={d?.inProgressRequests ?? 0}
            icon={Clock}
            variant="info"
          />
          <ReportMetricCard
            label={t("reports.maintenance.overview.pending")}
            value={d?.pendingRequests ?? 0}
            icon={Clock}
            variant="warning"
          />
          <ReportMetricCard
            label={t("reports.maintenance.overview.completionRate")}
            value={`${(d?.completionRate ?? 0).toFixed(1)}%`}
            icon={Percent}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.maintenance.overview.avgRepairTime")}
            value={`${(d?.averageRepairTime ?? 0).toFixed(1)} ${t("reports.maintenance.overview.days")}`}
            icon={TrendingUp}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.maintenance.overview.overdue")}
            value={d?.overdueCount ?? 0}
            icon={AlertTriangle}
            variant="danger"
          />
          <ReportMetricCard
            label={t("reports.maintenance.overview.actualCost")}
            value={(d?.totalActualCost ?? 0).toLocaleString()}
            icon={DollarSign}
            variant="purple"
          />
        </div>
      }
      charts={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChartCard
            title={t("reports.maintenance.overview.statusDistribution")}
          >
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

          <ReportChartCard
            title={t("reports.maintenance.byType.costComparison")}
          >
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
      {/* --- */}
      <Tabs defaultValue="byType" className="w-full">
        <TabsList>
          <TabsTrigger value="byType">
            <BarChart3 className="h-4 w-4 me-1" />
            {t("reports.maintenance.byType.title")}
          </TabsTrigger>
          <TabsTrigger value="byStatus">
            {t("reports.maintenance.byStatus.title")}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            <AlertTriangle className="h-4 w-4 me-1" />
            {t("reports.maintenance.overview.overdueAlerts")}
            {(d?.overdueCount ?? 0) > 0 && (
              <Badge className={getStatusBadgeClass("danger", "ms-1 text-xs")}>
                {d?.overdueCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="byType">
          <DataTable<MaintenanceTypeBreakdown>
            data={byType.data?.breakdown || []}
            columns={typeColumns}
            keyExtractor={(item) => item.type}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              totalItems: byType.data?.breakdown?.length || 0,
              totalPages: Math.ceil(
                (byType.data?.breakdown?.length || 0) / pageSize,
              ),
            }}
            onPageChange={setPage}
            isLoading={byType.isLoading}
            enableExport
            exportFilename="maintenance-by-type"
          />
        </TabsContent>

        <TabsContent value="byStatus">
          <DataTable<MaintenanceStatusBreakdown>
            data={byStatus.data?.breakdown || []}
            columns={statusColumns}
            keyExtractor={(item) => item.status}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              totalItems: byStatus.data?.breakdown?.length || 0,
              totalPages: Math.ceil(
                (byStatus.data?.breakdown?.length || 0) / pageSize,
              ),
            }}
            onPageChange={setPage}
            isLoading={byStatus.isLoading}
            enableExport
            exportFilename="maintenance-by-status"
          />
        </TabsContent>

        <TabsContent value="overdue">
          <DataTable<OverdueMaintenance>
            data={d?.overdueAlerts || []}
            columns={overdueColumns}
            keyExtractor={(item) => item.maintenanceNumber}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              totalItems: d?.overdueAlerts?.length || 0,
              totalPages: Math.ceil((d?.overdueAlerts?.length || 0) / pageSize),
            }}
            onPageChange={setPage}
            isLoading={overview.isLoading}
            enableExport
            exportFilename="maintenance-overdue-alerts"
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default MaintenanceDashboardReport;
