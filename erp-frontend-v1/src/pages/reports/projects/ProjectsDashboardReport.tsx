import React, { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  FolderKanban,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

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
import { Progress } from "@/components/ui/progress";
import BarChart from "@/components/charts-apex/BarChart";

import {
  useProjectsOverview,
  useProjectsBySite,
  useTimelineProgress,
} from "@/hooks/reports/useProjectsReport";
import { useSites } from "@/hooks/useSites";

import {
  ProjectStatus,
  type ProjectsReportFilters,
  type ProjectTimelineItem,
} from "@/types/reports/projects.types";

import { useTranslation } from "@/i18n/useTranslation";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DashboardFilters {
  status?: string;
  siteId?: string;
  search?: string;
}

export const ProjectsDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const statusOptions = useMemo(
    () => [
      { value: "PLANNING", label: t("reports.projects.status.PLANNING") },
      { value: "ACTIVE", label: t("reports.projects.status.ACTIVE") },
      { value: "ON_HOLD", label: t("reports.projects.status.ON_HOLD") },
      { value: "COMPLETED", label: t("reports.projects.status.COMPLETED") },
      { value: "CANCELLED", label: t("reports.projects.status.CANCELLED") },
    ],
    [t],
  );

  const statusLabelMap = useMemo(
    () => ({
      PLANNING: t("reports.projects.status.PLANNING"),
      ACTIVE: t("reports.projects.status.ACTIVE"),
      ON_HOLD: t("reports.projects.status.ON_HOLD"),
      COMPLETED: t("reports.projects.status.COMPLETED"),
      CANCELLED: t("reports.projects.status.CANCELLED"),
    }),
    [t],
  );

  const [filters, setFilters] = useState<DashboardFilters>({});

  const apiFilters: ProjectsReportFilters = useMemo(
    () => ({
      projectStatus: filters.status as ProjectStatus | undefined,
      siteId: filters.siteId,
    }),
    [filters.status, filters.siteId],
  );

  const overview = useProjectsOverview(apiFilters);
  const bySite = useProjectsBySite(apiFilters);
  const timeline = useTimelineProgress(apiFilters);

  const { data: sitesData } = useSites({ page: 1, pageSize: 200 });
  const siteOptions = useMemo(
    () =>
      (sitesData?.data || []).map((site) => ({
        value: site.id,
        label: site.name || site.code,
      })),
    [sitesData],
  );

  const isLoading =
    overview.isLoading || bySite.isLoading || timeline.isLoading;
  const error = overview.error || bySite.error || timeline.error || null;

  const handleRefresh = useCallback(() => {
    overview.refetch();
    bySite.refetch();
    timeline.refetch();
  }, [overview, bySite, timeline]);

  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: t("reports.projects.filters.status"),
        placeholder: t("common.all"),
        options: statusOptions,
      },
      {
        key: "siteId",
        label: t("reports.projects.filters.site"),
        placeholder: t("common.allSites"),
        options: siteOptions,
        width: "w-[200px]",
      },
    ],
    [t, statusOptions, siteOptions],
  );

  const actionProjects = useMemo(() => {
    let items = timeline.data?.projects ?? [];
    const query = (filters.search ?? "").trim().toLowerCase();

    if (query) {
      items = items.filter(
        (project) =>
          project.projectCode.toLowerCase().includes(query) ||
          project.projectName.toLowerCase().includes(query),
      );
    }

    const urgent = items
      .filter((project) => project.isAtRisk || project.daysRemaining < 0)
      .sort(
        (a, b) =>
          Number(b.isAtRisk) - Number(a.isAtRisk) ||
          a.daysRemaining - b.daysRemaining,
      )
      .slice(0, 10);

    if (urgent.length > 0) {
      return urgent;
    }

    return [...items]
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 10);
  }, [timeline.data, filters.search]);

  const bySiteTrend = useMemo(() => {
    const sites = bySite.data?.sites ?? [];
    if (sites.length === 0) {
      return {
        categories: [] as string[],
        series: [] as Array<{ name: string; data: number[] }>,
      };
    }

    const top = [...sites]
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, 6);
    return {
      categories: top.map((site) => site.siteName),
      series: [
        {
          name: t("reports.projects.kpi.active"),
          data: top.map((site) => site.activeCount),
        },
      ],
    };
  }, [bySite.data, t]);

  const columns: ColumnConfig<ProjectTimelineItem>[] = useMemo(
    () => [
      {
        key: "projectCode",
        label: t("reports.projects.table.code"),
        render: (project) => (
          <span className="font-mono text-xs font-medium">
            {project.projectCode}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectCode.localeCompare(b.projectCode),
        exportValue: (project) => project.projectCode,
      },
      {
        key: "projectName",
        label: t("reports.projects.table.name"),
        render: (project) => (
          <span className="font-medium text-sm">{project.projectName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (project) => project.projectName,
      },
      {
        key: "status",
        label: t("reports.projects.table.status"),
        render: (project) => (
          <Badge className={getStatusBadgeClass(getStatusTone(project.status))}>
            {statusLabelMap[project.status as keyof typeof statusLabelMap] ||
              project.status}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.status.localeCompare(b.status),
        exportValue: (project) =>
          statusLabelMap[project.status as keyof typeof statusLabelMap] ||
          project.status,
      },
      {
        key: "completionPercentage",
        label: t("reports.projects.table.completion"),
        render: (project) => (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress
              value={project.completionPercentage}
              className="h-2 flex-1"
            />
            <span className="text-xs font-medium w-10 text-end">
              {project.completionPercentage}%
            </span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.completionPercentage - b.completionPercentage,
        exportValue: (project) => `${project.completionPercentage}%`,
        align: "center" as const,
      },
      {
        key: "daysRemaining",
        label: t("reports.projects.table.remaining"),
        render: (project) => (
          <span
            className={`text-sm font-medium ${project.daysRemaining < 0 ? "text-danger" : "text-muted-foreground"}`}
          >
            {project.daysRemaining} {t("common.days")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.daysRemaining - b.daysRemaining,
        exportValue: (project) => project.daysRemaining,
        align: "center" as const,
      },
      {
        key: "risk",
        label: t("reports.projects.table.risk"),
        render: (project) =>
          project.isAtRisk ? (
            <Badge className={getStatusBadgeClass(getStatusTone("AT_RISK"))}>
              {t("reports.projects.atRisk")}
            </Badge>
          ) : (
            <Badge className={getStatusBadgeClass(getStatusTone("SAFE"))}>
              {t("reports.projects.safe")}
            </Badge>
          ),
        sortable: true,
        sortFn: (a, b) => Number(b.isAtRisk) - Number(a.isAtRisk),
        exportValue: (project) =>
          project.isAtRisk
            ? t("reports.projects.atRisk")
            : t("reports.projects.safe"),
        align: "center" as const,
      },
    ],
    [t, statusLabelMap],
  );

  const handleFilterChange = useCallback((next: DashboardFilters) => {
    setFilters(next);
  }, []);

  const overviewData = overview.data;
  const atRiskCount = timeline.data?.atRiskCount ?? 0;
  const behindScheduleCount = timeline.data?.behindScheduleCount ?? 0;

  return (
    <ReportPageLayout
      title={t("reports.projects.dashboard.title")}
      description={t("reports.projects.dashboard.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!overviewData}
      onRefresh={handleRefresh}
      onPrint={() => window.print()}
      splitLayout
      generatedAt={overviewData?.generatedAt}
      summaryStrip={
        overviewData && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.projects.kpi.total"),
                value: overviewData.totalProjects.toLocaleString("en-US"),
              },
              {
                label: t("reports.projects.kpi.active"),
                value: overviewData.activeProjects.toLocaleString("en-US"),
                valueClassName: "text-blue-600",
              },
              {
                label: t("reports.projects.atRisk"),
                value: atRiskCount.toLocaleString("en-US"),
                valueClassName: atRiskCount > 0 ? "text-red-600" : undefined,
              },
              {
                label: t("reports.projects.kpi.utilization"),
                value: `${overviewData.budgetUtilization.toFixed(1)}%`,
                valueClassName:
                  overviewData.budgetUtilization > 100
                    ? "text-red-600"
                    : overviewData.budgetUtilization > 80
                      ? "text-amber-600"
                      : "text-emerald-600",
              },
            ]}
          />
        )
      }
      filters={
        <ReportFilters<DashboardFilters>
          filters={filters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.projects.searchPlaceholder")}
          selectFilters={selectFilters}
        />
      }
      kpiCards={
        overviewData && (
          <div className="space-y-4">
            {(atRiskCount > 0 || behindScheduleCount > 0) && (
              <Alert className="border-warning/40 bg-warning/10 text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {t("reports.projects.atRisk")}:{" "}
                    {atRiskCount.toLocaleString("en-US")} |{" "}
                    {t("reports.projects.timelineStatus.BEHIND_SCHEDULE")}:{" "}
                    {behindScheduleCount.toLocaleString("en-US")}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/reports/projects/budget-delays"
                      className="inline-flex items-center gap-1.5"
                    >
                      {t("reports.projects.budgetDelays.title")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReportMetricCard
                label={t("reports.projects.kpi.active")}
                value={overviewData.activeProjects}
                icon={FolderKanban}
                variant="info"
              />
              <ReportMetricCard
                label={t("reports.projects.atRisk")}
                value={atRiskCount}
                icon={AlertTriangle}
                variant={atRiskCount > 0 ? "danger" : "success"}
              />
              <ReportMetricCard
                label={t("reports.projects.kpi.utilization")}
                value={overviewData.budgetUtilization}
                icon={Target}
                isPercentage
                variant={
                  overviewData.budgetUtilization > 100
                    ? "danger"
                    : overviewData.budgetUtilization > 80
                      ? "warning"
                      : "success"
                }
              />
            </div>
          </div>
        )
      }
      charts={
        <div className="grid grid-cols-1 gap-6">
          {bySiteTrend.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.projects.charts.bySite")}
              description={t("reports.projects.charts.activeProjects")}
              icon={BarChart3}
            >
              <BarChart
                categories={bySiteTrend.categories}
                series={bySiteTrend.series}
                height={280}
              />
            </ReportChartCard>
          )}
        </div>
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("reports.projects.table.risk")}
        </h3>
        <Button asChild size="sm" variant="outline">
          <Link
            to="/reports/projects/budget-delays"
            className="inline-flex items-center gap-1.5"
          >
            {t("reports.projects.budgetDelays.title")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <DataTable<ProjectTimelineItem>
        data={actionProjects}
        columns={columns}
        keyExtractor={(project) => project.projectId}
        enableClientSorting
        enableExport
        exportFilename="projects_dashboard_report"
        exportTitle={t("reports.projects.dashboard.title")}
        enableCompactMode
        emptyMessage={t("reports.projects.table.empty")}
      />
    </ReportPageLayout>
  );
};

export default ProjectsDashboardReport;


