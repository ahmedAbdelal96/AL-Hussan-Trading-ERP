/**
 * ============================================================================
 * SITES DASHBOARD REPORT
 * ============================================================================
 *
 * Consolidates: Overview + ByStatus + ByLocation + Capacity
 *
 * Layout:
 *   1. Filters bar    (date range, status)
 *   3. Charts         (DonutChart: status | BarChart: capacity per site)
 *   4. Tabbed tables  (By Status / By Location / Capacity Detail)
 *
 * @page SitesDashboardReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  MapPin,
  Building2,
  Percent,
  BarChart3,
  AlertTriangle,
  Activity,
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
  useSitesOverview,
  useSitesByStatus,
  useSitesByLocation,
  useSitesCapacity,
} from "@/hooks/reports/useSitesReport";

import type {
  SiteStatus,
  SiteStatusBreakdown,
  SitesPerStatusDetail,
  LocationDistribution,
  SiteCapacityDetail,
} from "@/types/reports/sites.types";

import { useTranslation } from "@/i18n/useTranslation";
import {
  getStatusBadgeClass,
  getStatusChartColor,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  status?: SiteStatus;
  search?: string;
}

type SitesDashboardTab = "byStatus" | "transitions" | "byLocation" | "capacity";
const TABLE_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const SitesDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<DashboardFilters>({});
  const [tabPages, setTabPages] = useState<Record<SitesDashboardTab, number>>({
    byStatus: 1,
    transitions: 1,
    byLocation: 1,
    capacity: 1,
  });
  const [tabPageSizes, setTabPageSizes] = useState<
    Record<SitesDashboardTab, number>
  >({
    byStatus: TABLE_PAGE_SIZE,
    transitions: TABLE_PAGE_SIZE,
    byLocation: TABLE_PAGE_SIZE,
    capacity: TABLE_PAGE_SIZE,
  });

  const STATUS_MAP = useMemo(
    () => ({
      ACTIVE: t("reports.sites.status.ACTIVE"),
      INACTIVE: t("reports.sites.status.INACTIVE"),
      UNDER_PREPARATION: t("reports.sites.status.UNDER_PREPARATION"),
      CLOSED: t("reports.sites.status.CLOSED"),
    }),
    [t],
  );

  const STATUS_OPTIONS: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: t("reports.sites.byStatus.status"),
        options: Object.entries(STATUS_MAP).map(([value, label]) => ({
          value,
          label,
        })),
      },
    ],
    [t, STATUS_MAP],
  );

  const apiFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
    }),
    [filters],
  );

  const paginateTab = useCallback(
    <T,>(items: T[] | undefined, tab: SitesDashboardTab) => {
      const list = items || [];
      const pageSize = tabPageSizes[tab] || TABLE_PAGE_SIZE;
      const totalItems = list.length;
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
    [tabPages, tabPageSizes],
  );

  const overview = useSitesOverview(apiFilters);
  const byStatus = useSitesByStatus(apiFilters);
  const byLocation = useSitesByLocation(apiFilters);
  const capacity = useSitesCapacity(apiFilters);

  const isLoading =
    overview.isLoading ||
    byStatus.isLoading ||
    byLocation.isLoading ||
    capacity.isLoading;
  const error =
    overview.error || byStatus.error || byLocation.error || capacity.error;
  const hasData = !!(
    overview.data ||
    byStatus.data ||
    byLocation.data ||
    capacity.data
  );

  const handleRefresh = useCallback(() => {
    overview.refetch();
    byStatus.refetch();
    byLocation.refetch();
    capacity.refetch();
  }, [overview, byStatus, byLocation, capacity]);

  const kpi = overview.data?.kpi;
  const cap = overview.data?.capacityMetrics;

  const statusColumns: ColumnConfig<SiteStatusBreakdown>[] = useMemo(
    () => [
      {
        key: "status",
        label: t("reports.sites.byStatus.status"),
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
        label: t("reports.sites.byStatus.count"),
        sortable: true,
        sortFn: (a, b) => a.count - b.count,
        render: (row) => row.count.toLocaleString(),
        exportValue: (row) => row.count,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.sites.byStatus.percentage"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "totalArea",
        label: t("reports.sites.byStatus.totalArea"),
        sortable: true,
        sortFn: (a, b) => a.totalArea - b.totalArea,
        render: (row) => row.totalArea.toLocaleString(),
        exportValue: (row) => row.totalArea,
        align: "end" as const,
      },
      {
        key: "averageDaysInStatus",
        label: t("reports.sites.byStatus.avgDays"),
        sortable: true,
        sortFn: (a, b) => a.averageDaysInStatus - b.averageDaysInStatus,
        render: (row) => row.averageDaysInStatus.toFixed(0),
        exportValue: (row) => row.averageDaysInStatus,
        align: "end" as const,
      },
      {
        key: "sitesExceedingThreshold",
        label: t("reports.sites.byStatus.exceeding"),
        sortable: true,
        sortFn: (a, b) => a.sitesExceedingThreshold - b.sitesExceedingThreshold,
        render: (row) =>
          row.sitesExceedingThreshold > 0 ? (
            <span className="text-amber-600 font-medium">
              {row.sitesExceedingThreshold}
            </span>
          ) : (
            "0"
          ),
        exportValue: (row) => row.sitesExceedingThreshold,
        align: "end" as const,
      },
    ],
    [t, STATUS_MAP],
  );

  const transitionColumns: ColumnConfig<SitesPerStatusDetail>[] = useMemo(
    () => [
      {
        key: "siteCode",
        label: t("reports.sites.byStatus.siteCode"),
        sortable: true,
        sortFn: (a, b) => a.siteCode.localeCompare(b.siteCode),
        exportValue: (row) => row.siteCode,
        align: "start" as const,
      },
      {
        key: "siteName",
        label: t("reports.sites.byStatus.siteName"),
        sortable: true,
        sortFn: (a, b) => a.siteName.localeCompare(b.siteName),
        exportValue: (row) => row.siteName,
        align: "start" as const,
      },
      {
        key: "status",
        label: t("reports.sites.byStatus.status"),
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
        key: "daysInCurrentStatus",
        label: t("reports.sites.byStatus.daysInStatus"),
        sortable: true,
        sortFn: (a, b) => a.daysInCurrentStatus - b.daysInCurrentStatus,
        render: (row) => row.daysInCurrentStatus.toLocaleString(),
        exportValue: (row) => row.daysInCurrentStatus,
        align: "end" as const,
      },
    ],
    [t, STATUS_MAP],
  );

  const locationColumns: ColumnConfig<LocationDistribution>[] = useMemo(
    () => [
      {
        key: "location",
        label: t("reports.sites.byLocation.location"),
        sortable: true,
        sortFn: (a, b) => a.location.localeCompare(b.location),
        exportValue: (row) => row.location,
        align: "start" as const,
      },
      {
        key: "siteCount",
        label: t("reports.sites.byLocation.siteCount"),
        sortable: true,
        sortFn: (a, b) => a.siteCount - b.siteCount,
        render: (row) => row.siteCount.toLocaleString(),
        exportValue: (row) => row.siteCount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.sites.byLocation.percentage"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "totalArea",
        label: t("reports.sites.byLocation.totalArea"),
        sortable: true,
        sortFn: (a, b) => a.totalArea - b.totalArea,
        render: (row) => row.totalArea.toLocaleString(),
        exportValue: (row) => row.totalArea,
        align: "end" as const,
      },
      {
        key: "averageArea",
        label: t("reports.sites.byLocation.avgArea"),
        sortable: true,
        sortFn: (a, b) => a.averageArea - b.averageArea,
        render: (row) => row.averageArea.toLocaleString(),
        exportValue: (row) => row.averageArea,
        align: "end" as const,
      },
    ],
    [t],
  );

  const capacityColumns: ColumnConfig<SiteCapacityDetail>[] = useMemo(
    () => [
      {
        key: "siteCode",
        label: t("reports.sites.capacity.siteCode"),
        sortable: true,
        sortFn: (a, b) => a.siteCode.localeCompare(b.siteCode),
        exportValue: (row) => row.siteCode,
        align: "start" as const,
      },
      {
        key: "siteName",
        label: t("reports.sites.capacity.siteName"),
        sortable: true,
        sortFn: (a, b) => a.siteName.localeCompare(b.siteName),
        exportValue: (row) => row.siteName,
        align: "start" as const,
      },
      {
        key: "status",
        label: t("reports.sites.capacity.status"),
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
        key: "capacity",
        label: t("reports.sites.capacity.capacity"),
        sortable: true,
        sortFn: (a, b) => a.capacity - b.capacity,
        render: (row) => row.capacity.toLocaleString(),
        exportValue: (row) => row.capacity,
        align: "end" as const,
      },
      {
        key: "activeProjects",
        label: t("reports.sites.capacity.activeProjects"),
        sortable: true,
        sortFn: (a, b) => a.activeProjects - b.activeProjects,
        render: (row) => row.activeProjects.toLocaleString(),
        exportValue: (row) => row.activeProjects,
        align: "end" as const,
      },
      {
        key: "utilizationPercentage",
        label: t("reports.sites.capacity.utilizationPct"),
        sortable: true,
        sortFn: (a, b) => a.utilizationPercentage - b.utilizationPercentage,
        render: (row) => (
          <span
            className={
              row.utilizationPercentage >= 70
                ? "text-green-600"
                : "text-amber-600"
            }
          >
            {row.utilizationPercentage.toFixed(1)}%
          </span>
        ),
        exportValue: (row) => row.utilizationPercentage,
        align: "end" as const,
      },
      {
        key: "area",
        label: t("reports.sites.capacity.area"),
        sortable: true,
        sortFn: (a, b) => a.area - b.area,
        render: (row) => row.area.toLocaleString(),
        exportValue: (row) => row.area,
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t, STATUS_MAP],
  );

  const statusChartData = useMemo(() => {
    const dist = overview.data?.statusDistribution || [];
    return {
      labels: dist.map(
        (s) => STATUS_MAP[s.status as keyof typeof STATUS_MAP] || s.status,
      ),
      series: dist.map((s) => s.count),
      colors: dist.map((s) => getStatusChartColor(s.status)),
    };
  }, [overview.data, STATUS_MAP]);

  const capacityChartData = useMemo(() => {
    const sites = (capacity.data?.sites || []).slice(0, 15);
    return {
      categories: sites.map((s) => s.siteCode),
      series: [
        {
          name: t("reports.sites.capacity.utilization"),
          data: sites.map((s) => s.utilizationPercentage),
        },
      ],
      colors: ["#3b82f6"],
    };
  }, [capacity.data, t]);

  const pagedByStatus = useMemo(
    () => paginateTab(byStatus.data?.statusBreakdown, "byStatus"),
    [byStatus.data?.statusBreakdown, paginateTab],
  );
  const pagedTransitions = useMemo(
    () => paginateTab(byStatus.data?.recentStatusTransitions, "transitions"),
    [byStatus.data?.recentStatusTransitions, paginateTab],
  );
  const pagedByLocation = useMemo(
    () => paginateTab(byLocation.data?.locationDistribution, "byLocation"),
    [byLocation.data?.locationDistribution, paginateTab],
  );
  const pagedCapacity = useMemo(
    () => paginateTab(capacity.data?.sites, "capacity"),
    [capacity.data?.sites, paginateTab],
  );

  return (
    <ReportPageLayout
      title={t("reports.sites.overview.title")}
      description={t("reports.sites.overview.description")}
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      onPrint={() => window.print()}
      generatedAt={overview.data?.reportDate}
      summaryStrip={
        kpi && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.sites.overview.totalSites"),
                value: (kpi.totalSites ?? 0).toLocaleString("en-US"),
              },
              {
                label: t("reports.sites.overview.activeSites"),
                value: (kpi.activeSites ?? 0).toLocaleString("en-US"),
                valueClassName: "text-emerald-600",
              },
              {
                label: t("reports.sites.overview.utilizationRate"),
                value: `${(cap?.utilizationRate ?? 0).toFixed(1)}%`,
                valueClassName:
                  (cap?.utilizationRate ?? 0) >= 70
                    ? "text-emerald-600"
                    : (cap?.utilizationRate ?? 0) >= 40
                      ? "text-amber-600"
                      : "text-red-600",
              },
              {
                label: t("reports.sites.overview.closedSites"),
                value: (kpi.closedSites ?? 0).toLocaleString("en-US"),
                valueClassName:
                  (kpi.closedSites ?? 0) > 0 ? "text-red-600" : undefined,
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
              byStatus: 1,
              transitions: 1,
              byLocation: 1,
              capacity: 1,
            });
            setTabPageSizes({
              byStatus: TABLE_PAGE_SIZE,
              transitions: TABLE_PAGE_SIZE,
              byLocation: TABLE_PAGE_SIZE,
              capacity: TABLE_PAGE_SIZE,
            });
          }}
          selectFilters={STATUS_OPTIONS}
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
            label={t("reports.sites.overview.totalSites")}
            value={kpi?.totalSites ?? 0}
            icon={MapPin}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.sites.overview.activeSites")}
            value={kpi?.activeSites ?? 0}
            icon={Building2}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.sites.overview.activePercentage")}
            value={`${(kpi?.activePercentage ?? 0).toFixed(1)}%`}
            icon={Percent}
            variant="info"
          />
          <ReportMetricCard
            label={t("reports.sites.overview.closedSites")}
            value={kpi?.closedSites ?? 0}
            icon={AlertTriangle}
            variant="danger"
          />
          <ReportMetricCard
            label={t("reports.sites.overview.totalCapacity")}
            value={(cap?.totalCapacity ?? 0).toLocaleString()}
            icon={BarChart3}
            variant="purple"
          />
          <ReportMetricCard
            label={t("reports.sites.overview.totalArea")}
            value={(cap?.totalArea ?? 0).toLocaleString()}
            icon={MapPin}
            variant="warning"
          />
          <ReportMetricCard
            label={t("reports.sites.overview.utilizationRate")}
            value={`${(cap?.utilizationRate ?? 0).toFixed(1)}%`}
            icon={Activity}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.sites.overview.underPreparation")}
            value={kpi?.underPreparationSites ?? 0}
            icon={Building2}
            variant="warning"
          />
        </div>
      }
      charts={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChartCard title={t("reports.sites.overview.statusChartTitle")}>
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

          <ReportChartCard title={t("reports.sites.capacity.chartTitle")}>
            {capacityChartData.categories.length > 0 ? (
              <BarChart
                categories={capacityChartData.categories}
                series={capacityChartData.series}
                colors={capacityChartData.colors}
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
      <Tabs defaultValue="byStatus" className="w-full">
        <TabsList>
          <TabsTrigger value="byStatus">
            {t("reports.sites.byStatus.title")}
          </TabsTrigger>
          <TabsTrigger value="transitions">
            {t("reports.sites.byStatus.transitionsTable")}
          </TabsTrigger>
          <TabsTrigger value="byLocation">
            {t("reports.sites.byLocation.title")}
          </TabsTrigger>
          <TabsTrigger value="capacity">
            {t("reports.sites.capacity.tableTitle")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="byStatus">
          <DataTable<SiteStatusBreakdown>
            data={pagedByStatus.rows}
            columns={statusColumns}
            keyExtractor={(item) => item.status}
            pagination={pagedByStatus.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, byStatus: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTabPageSizes((prev) => ({ ...prev, byStatus: nextPageSize }));
              setTabPages((prev) => ({ ...prev, byStatus: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byStatus.isLoading}
            enableExport
            exportFilename="sites-by-status"
          />
        </TabsContent>

        <TabsContent value="transitions">
          <DataTable<SitesPerStatusDetail>
            data={pagedTransitions.rows}
            columns={transitionColumns}
            keyExtractor={(item) => item.siteId}
            pagination={pagedTransitions.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, transitions: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTabPageSizes((prev) => ({
                ...prev,
                transitions: nextPageSize,
              }));
              setTabPages((prev) => ({ ...prev, transitions: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byStatus.isLoading}
            enableExport
            exportFilename="sites-transitions"
          />
        </TabsContent>

        <TabsContent value="byLocation">
          <DataTable<LocationDistribution>
            data={pagedByLocation.rows}
            columns={locationColumns}
            keyExtractor={(item) => `${item.location}-${item.level}`}
            pagination={pagedByLocation.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, byLocation: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTabPageSizes((prev) => ({
                ...prev,
                byLocation: nextPageSize,
              }));
              setTabPages((prev) => ({ ...prev, byLocation: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={byLocation.isLoading}
            enableExport
            exportFilename="sites-by-location"
          />
        </TabsContent>

        <TabsContent value="capacity">
          <DataTable<SiteCapacityDetail>
            data={pagedCapacity.rows}
            columns={capacityColumns}
            keyExtractor={(item) => item.siteId}
            pagination={pagedCapacity.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, capacity: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTabPageSizes((prev) => ({ ...prev, capacity: nextPageSize }));
              setTabPages((prev) => ({ ...prev, capacity: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={capacity.isLoading}
            enableExport
            exportFilename="sites-capacity"
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default SitesDashboardReport;
