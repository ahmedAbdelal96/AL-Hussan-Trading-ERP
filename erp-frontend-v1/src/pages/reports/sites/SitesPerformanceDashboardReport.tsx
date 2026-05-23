/**
 * ============================================================================
 * SITES PERFORMANCE DASHBOARD REPORT
 * ============================================================================
 *
 * Consolidates: WithProjects + Performance
 *
 * Layout:
 *   1. Filters bar  (date range)
 *   3. Charts       (BarChart: performance scores)
 *   4. Tabbed tables (Projects per Site / Performance Detail)
 *
 * @page SitesPerformanceDashboardReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  MapPin,
  Briefcase,
  TrendingUp,
  BarChart3,
  AlertTriangle,
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
import { Button } from "@/components/ui/button";

import BarChart from "@/components/charts-apex/BarChart";

import {
  useSitesWithProjects,
  useSitesPerformance,
} from "@/hooks/reports/useSitesReport";

import type {
  SiteWithProjectsDetail,
  SitePerformanceDetail,
} from "@/types/reports/sites.types";

import { useTranslation } from "@/i18n/useTranslation";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";
import { Link } from "react-router";

const PERFORMANCE_COLORS: Record<string, string> = {
  HIGH: "#10b981",
  MEDIUM: "#f59e0b",
  LOW: "#ef4444",
};

const getPerformanceTone = (rating: string) => {
  switch (rating) {
    case "HIGH":
      return "success" as const;
    case "MEDIUM":
      return "warning" as const;
    case "LOW":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

interface PerformanceFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
}

type PerformanceTab = "projects" | "performance";
const TABLE_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const SitesPerformanceDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<PerformanceFilters>({});
  const [tabPages, setTabPages] = useState<Record<PerformanceTab, number>>({
    projects: 1,
    performance: 1,
  });
  const [tabPageSizes, setTabPageSizes] = useState<Record<PerformanceTab, number>>({
    projects: TABLE_PAGE_SIZE,
    performance: TABLE_PAGE_SIZE,
  });

  const apiFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters.startDate, filters.endDate],
  );

  const withProjects = useSitesWithProjects(apiFilters);
  const performance = useSitesPerformance(apiFilters);

  const isLoading = withProjects.isLoading || performance.isLoading;
  const error = withProjects.error || performance.error;
  const hasData = !!(withProjects.data || performance.data);

  const handleRefresh = useCallback(() => {
    withProjects.refetch();
    performance.refetch();
  }, [withProjects, performance]);

  const wp = withProjects.data;
  const perf = performance.data;

  const projectsColumns: ColumnConfig<SiteWithProjectsDetail>[] = useMemo(
    () => [
      {
        key: "siteCode",
        label: t("reports.sites.withProjects.siteCode"),
        sortable: true,
        sortFn: (a, b) => a.siteCode.localeCompare(b.siteCode),
        exportValue: (row) => row.siteCode,
        align: "start" as const,
      },
      {
        key: "siteName",
        label: t("reports.sites.withProjects.siteName"),
        sortable: true,
        sortFn: (a, b) => a.siteName.localeCompare(b.siteName),
        exportValue: (row) => row.siteName,
        align: "start" as const,
      },
      {
        key: "city",
        label: t("reports.sites.withProjects.city"),
        sortable: true,
        sortFn: (a, b) => a.city.localeCompare(b.city),
        exportValue: (row) => row.city,
        align: "start" as const,
        hideMobile: true,
      },
      {
        key: "totalProjectCount",
        label: t("reports.sites.withProjects.totalProjects"),
        sortable: true,
        sortFn: (a, b) => a.totalProjectCount - b.totalProjectCount,
        render: (row) => row.totalProjectCount.toLocaleString(),
        exportValue: (row) => row.totalProjectCount,
        align: "end" as const,
      },
      {
        key: "activeProjectCount",
        label: t("reports.sites.withProjects.activeProjects"),
        sortable: true,
        sortFn: (a, b) => a.activeProjectCount - b.activeProjectCount,
        render: (row) => (
          <span className="font-medium text-blue-600">
            {row.activeProjectCount}
          </span>
        ),
        exportValue: (row) => row.activeProjectCount,
        align: "end" as const,
      },
      {
        key: "totalProjectBudget",
        label: t("reports.sites.withProjects.totalBudget"),
        sortable: true,
        sortFn: (a, b) =>
          (a.totalProjectBudget ?? 0) - (b.totalProjectBudget ?? 0),
        render: (row) => (row.totalProjectBudget ?? 0).toLocaleString(),
        exportValue: (row) => row.totalProjectBudget ?? 0,
        align: "end" as const,
      },
    ],
    [t],
  );

  const performanceColumns: ColumnConfig<SitePerformanceDetail>[] = useMemo(
    () => [
      {
        key: "siteCode",
        label: t("reports.sites.performance.siteCode"),
        sortable: true,
        sortFn: (a, b) => a.siteCode.localeCompare(b.siteCode),
        exportValue: (row) => row.siteCode,
        align: "start" as const,
      },
      {
        key: "siteName",
        label: t("reports.sites.performance.siteName"),
        sortable: true,
        sortFn: (a, b) => a.siteName.localeCompare(b.siteName),
        exportValue: (row) => row.siteName,
        align: "start" as const,
      },
      {
        key: "performanceScore",
        label: t("reports.sites.performance.score"),
        sortable: true,
        sortFn: (a, b) => a.performanceScore - b.performanceScore,
        render: (row) => (
          <span className="font-semibold">
            {row.performanceScore.toFixed(1)}
          </span>
        ),
        exportValue: (row) => row.performanceScore,
        align: "end" as const,
      },
      {
        key: "performanceRating",
        label: t("reports.sites.performance.rating"),
        sortable: true,
        sortFn: (a, b) =>
          a.performanceRating.localeCompare(b.performanceRating),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getPerformanceTone(row.performanceRating))}>
            {row.performanceRating}
          </Badge>
        ),
        exportValue: (row) => row.performanceRating,
        align: "center" as const,
      },
      {
        key: "completionRate",
        label: t("reports.sites.performance.completionRate"),
        sortable: true,
        sortFn: (a, b) =>
          a.projectMetrics.completionRate - b.projectMetrics.completionRate,
        render: (row) => `${row.projectMetrics.completionRate.toFixed(1)}%`,
        exportValue: (row) => row.projectMetrics.completionRate,
        align: "end" as const,
      },
      {
        key: "roiPerSqm",
        label: t("reports.sites.performance.roiPerSqm"),
        sortable: true,
        sortFn: (a, b) =>
          a.roiMetrics.roiPerSquareMeter - b.roiMetrics.roiPerSquareMeter,
        render: (row) => row.roiMetrics.roiPerSquareMeter.toLocaleString(),
        exportValue: (row) => row.roiMetrics.roiPerSquareMeter,
        align: "end" as const,
      },
    ],
    [t],
  );

  const performanceChartData = useMemo(() => {
    const sites = (perf?.sites || [])
      .slice()
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 15);
    return {
      categories: sites.map((s) => s.siteCode),
      series: [
        {
          name: t("reports.sites.performance.score"),
          data: sites.map((s) => s.performanceScore),
        },
      ],
      colors: sites.map(
        (s) => PERFORMANCE_COLORS[s.performanceRating] || "#6b7280",
      ),
    };
  }, [perf, t]);

  const paginateTab = useCallback(
    <T,>(items: T[] | undefined, tab: PerformanceTab) => {
      const list = items || [];
      const pageSize = tabPageSizes[tab] || TABLE_PAGE_SIZE;
      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const currentPage = Math.min(
        Math.max(tabPages[tab] || 1, 1),
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
    [tabPages, tabPageSizes],
  );

  const pagedProjects = useMemo(
    () => paginateTab(wp?.sites, "projects"),
    [wp?.sites, paginateTab],
  );
  const pagedPerformance = useMemo(
    () => paginateTab(perf?.sites, "performance"),
    [perf?.sites, paginateTab],
  );

  const alerts = useMemo(() => {
    if (!perf) return [];
    const items: Array<{ key: string; tone: "warning" | "danger"; message: string }> = [];
    if (perf.candidatesForClosure > 0) {
      items.push({
        key: "closure-candidates",
        tone: "danger",
        message: `${perf.candidatesForClosure} ${t("reports.sites.performance.closureCandidates")}`,
      });
    }
    if (perf.lowPerformingSites > 0) {
      items.push({
        key: "low-performing",
        tone: "warning",
        message: `${perf.lowPerformingSites} ${t("reports.sites.performance.lowPerforming")}`,
      });
    }
    return items;
  }, [perf, t]);

  return (
    <ReportPageLayout
      title={t("reports.sites.performance.title")}
      description={t("reports.sites.performance.description")}
      borderColor="info"
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      filters={
        <ReportFilters<PerformanceFilters>
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            setTabPages({ projects: 1, performance: 1 });
            setTabPageSizes({
              projects: TABLE_PAGE_SIZE,
              performance: TABLE_PAGE_SIZE,
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ReportMetricCard
            label={t("reports.sites.withProjects.totalSites")}
            value={wp?.totalSites ?? 0}
            icon={MapPin}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.sites.withProjects.sitesWithProjects")}
            value={wp?.sitesWithProjects ?? 0}
            icon={Briefcase}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.sites.withProjects.totalProjectCount")}
            value={wp?.totalProjectCount ?? 0}
            icon={BarChart3}
            variant="info"
          />
          <ReportMetricCard
            label={t("reports.sites.performance.avgScore")}
            value={(perf?.averagePerformanceScore ?? 0).toFixed(1)}
            icon={TrendingUp}
            variant="purple"
          />
          <ReportMetricCard
            label={t("reports.sites.performance.highPerforming")}
            value={perf?.highPerformingSites ?? 0}
            icon={TrendingUp}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.sites.performance.closureCandidates")}
            value={perf?.candidatesForClosure ?? 0}
            icon={AlertTriangle}
            variant="danger"
          />
        </div>
      }
      charts={
        performanceChartData.categories.length > 0 ? (
          <ReportChartCard title={t("reports.sites.performance.chartTitle")}>
            <BarChart
              categories={performanceChartData.categories}
              series={performanceChartData.series}
              height={300}
            />
          </ReportChartCard>
        ) : undefined
      }
    >
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.key}
              className={
                alert.tone === "danger"
                  ? "rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
                  : "rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
              }
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border/70 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t("reports.sites.performance.description")}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/reports/sites/dashboard">
                {t("reports.sites.overview.title")}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/reports/sites/profitability">
                {t("reports.sites.profitability.title")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList>
          <TabsTrigger value="projects">
            <Briefcase className="h-4 w-4 me-1" />
            {t("reports.sites.withProjects.title")}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 me-1" />
            {t("reports.sites.performance.tableTitle")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <DataTable<SiteWithProjectsDetail>
            data={pagedProjects.rows}
            columns={projectsColumns}
            keyExtractor={(item) => item.siteId}
            pagination={pagedProjects.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, projects: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTabPageSizes((prev) => ({
                ...prev,
                projects: nextPageSize,
              }));
              setTabPages((prev) => ({ ...prev, projects: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={withProjects.isLoading}
            enableExport
            exportFilename="sites-with-projects"
          />
        </TabsContent>

        <TabsContent value="performance">
          <DataTable<SitePerformanceDetail>
            data={pagedPerformance.rows}
            columns={performanceColumns}
            keyExtractor={(item) => item.siteId}
            pagination={pagedPerformance.pagination}
            onPageChange={(nextPage) =>
              setTabPages((prev) => ({ ...prev, performance: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTabPageSizes((prev) => ({
                ...prev,
                performance: nextPageSize,
              }));
              setTabPages((prev) => ({ ...prev, performance: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={performance.isLoading}
            enableExport
            exportFilename="sites-performance"
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default SitesPerformanceDashboardReport;
