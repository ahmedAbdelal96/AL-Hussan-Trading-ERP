/**
 * ============================================================================
 * EMPLOYEES DASHBOARD REPORT
 * ============================================================================
 *
 * Consolidates: Overview + ByDepartment + ByPosition + ByEmploymentType + StatusDistribution
 *
 * Layout:
 *   1. Filters bar  (month/year select, department, employment type, status)
 *   3. Charts       (DonutChart: status distribution | BarChart: department headcount)
 *   4. Tabs         (Department / Position / Employment Type / Status)
 *     Each tab has its own client-side paginated + sortable + exportable DataTable
 *
 * Lessons applied:
 *   - All translated maps inside component as useMemo
 *   - Numbers -> align:"end", Badges -> align:"center", Text -> align:"start"
 *   - exportValue on every JSX column
 *   - Client-side pagination (departments/positions are < 200 rows)
 *
 * @page EmployeesDashboardReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus,
  TrendingDown,
  AlertTriangle,
  Clock,
  Shield,
  Briefcase,
  Building2,
  PieChart,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router";

// Shared report components
import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";
import { ReportSummaryStrip } from "@/components/common/ReportSummaryStrip";

// UI
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Charts
import DonutChart from "@/components/charts-apex/DonutChart";
import BarChart from "@/components/charts-apex/BarChart";

// Data hooks
import {
  useEmployeesOverview,
  useEmployeesByDepartment,
  useEmployeesByPosition,
  useEmployeesByEmploymentType,
  useStatusDistribution,
} from "@/hooks/reports/useEmployeesReport";

// Types
import type {
  EmployeesReportFilters,
  DepartmentItem,
  PositionItem,
  EmploymentTypeItem,
} from "@/types/reports/employees.types";

// i18n
import { useTranslation } from "@/i18n/useTranslation";
import {
  getStatusBadgeClass,
  getStatusChartColor,
} from "@/components/common/statusBadgeStyles";

// ============ FILTER TYPES ============

interface DashboardFilters {
  department?: string;
  employmentType?: string;
  status?: string;
  search?: string;
}

// ============ COMPONENT ============

export const EmployeesDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  // ---- State ----
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [deptPage, setDeptPage] = useState(1);
  const [posPage, setPosPage] = useState(1);
  const [typePageNum, setTypePageNum] = useState(1);
  const PAGE_SIZE = 15;

  // ---- Translated options ----
  const STATUS_OPTIONS = useMemo(
    () => [
      {
        value: "ACTIVE",
        label: t("reports.employees.overview.activeEmployees"),
      },
      {
        value: "INACTIVE",
        label: t("reports.employees.overview.inactiveEmployees"),
      },
      {
        value: "ON_LEAVE",
        label: t("reports.employees.overview.onLeaveEmployees"),
      },
      {
        value: "SUSPENDED",
        label: t("reports.employees.overview.suspendedEmployees"),
      },
    ],
    [t],
  );

  const STATUS_LABEL = useMemo(
    () => ({
      ACTIVE: t("reports.employees.overview.activeEmployees"),
      INACTIVE: t("reports.employees.overview.inactiveEmployees"),
      ON_LEAVE: t("reports.employees.overview.onLeaveEmployees"),
      SUSPENDED: t("reports.employees.overview.suspendedEmployees"),
    }),
    [t],
  );

  const EMP_TYPE_LABEL = useMemo(
    () => ({
      PERMANENT: t("reports.employees.byEmploymentType.permanent"),
      CONTRACT: t("reports.employees.byEmploymentType.contract"),
      FREELANCE: t("reports.employees.byEmploymentType.freelance"),
      PART_TIME: t("reports.employees.byEmploymentType.partTime"),
    }),
    [t],
  );

  // ---- API filters ----
  const baseFilters: EmployeesReportFilters = useMemo(
    () => ({
      department: filters.department,
      employmentType: filters.employmentType,
      status: filters.status,
    }),
    [filters.department, filters.employmentType, filters.status],
  );

  const tabularFilters = useMemo(
    () => ({
      ...baseFilters,
      search: filters.search,
      limit: PAGE_SIZE,
    }),
    [baseFilters, filters.search],
  );

  // ---- Queries ----
  // overview: accepts includeDepartmentBreakdown, NOT includeSalaryCosts
  const overview = useEmployeesOverview({
    ...baseFilters,
    includeDepartmentBreakdown: true,
  });
  // by-department: accepts includeSalaryCosts, NOT includeDepartmentBreakdown
  const byDept = useEmployeesByDepartment({
    ...tabularFilters,
    includeSalaryCosts: true,
    page: deptPage,
  });
  // by-position, by-employment-type, status: base filters only
  const byPos = useEmployeesByPosition({
    ...tabularFilters,
    page: posPage,
  });
  const byType = useEmployeesByEmploymentType({
    ...tabularFilters,
    page: typePageNum,
  });
  const statusDist = useStatusDistribution(baseFilters);

  const isLoading = overview.isLoading;
  const error = overview.error || null;

  const handleRefresh = useCallback(() => {
    overview.refetch();
    byDept.refetch();
    byPos.refetch();
    byType.refetch();
    statusDist.refetch();
  }, [overview, byDept, byPos, byType, statusDist]);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: t("reports.employees.statusDistribution.title"),
        placeholder: t("reports.common.all"),
        options: STATUS_OPTIONS,
        width: "w-[170px]",
      },
    ],
    [t, STATUS_OPTIONS],
  );

  const handleFilterChange = useCallback((f: DashboardFilters) => {
    setFilters(f);
    setDeptPage(1);
    setPosPage(1);
    setTypePageNum(1);
  }, []);

  // ---- Status donut chart ----
  const donutData = useMemo(() => {
    const items = statusDist.data?.statusBreakdown;
    if (!items?.length) return { series: [], labels: [], colors: [] };
    const nonZero = items.filter((s) => s.employeeCount > 0);
    return {
      series: nonZero.map((s) => s.employeeCount),
      labels: nonZero.map(
        (s) =>
          STATUS_LABEL[s.status as keyof typeof STATUS_LABEL] ?? s.statusName,
      ),
      colors: nonZero.map((s) => getStatusChartColor(s.status)),
    };
  }, [statusDist.data, STATUS_LABEL]);

  // ---- Department bar chart ----
  const barData = useMemo(() => {
    const depts = byDept.data?.departments;
    if (!depts?.length) return { categories: [], series: [] };
    const sorted = [...depts]
      .sort((a, b) => b.employeeCount - a.employeeCount)
      .slice(0, 10);
    return {
      categories: sorted.map((d) => d.department),
      series: [
        {
          name: t("reports.employees.byDepartment.activeCount"),
          data: sorted.map((d) => d.activeCount),
        },
        {
          name: t("reports.employees.byDepartment.inactiveCount"),
          data: sorted.map((d) => d.inactiveCount),
        },
      ],
    };
  }, [byDept.data, t]);

  const deptColumns: ColumnConfig<DepartmentItem>[] = useMemo(
    () => [
      {
        key: "department",
        label: t("reports.employees.byDepartment.department"),
        render: (i) => (
          <span className="font-medium text-sm">{i.department}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.department.localeCompare(b.department, "ar"),
        exportValue: (i) => i.department,
        align: "start" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.employees.byDepartment.employeeCount"),
        render: (i) => (
          <span className="tabular-nums text-sm font-semibold">
            {i.employeeCount}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeCount - b.employeeCount,
        exportValue: (i) => i.employeeCount,
        align: "end" as const,
      },
      {
        key: "activeCount",
        label: t("reports.employees.byDepartment.activeCount"),
        render: (i) => (
          <Badge className={getStatusBadgeClass("info", "tabular-nums")}>
            {i.activeCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.activeCount - b.activeCount,
        exportValue: (i) => i.activeCount,
        align: "center" as const,
      },
      {
        key: "inactiveCount",
        label: t("reports.employees.byDepartment.inactiveCount"),
        render: (i) => (
          <span className="tabular-nums text-sm text-muted-foreground">
            {i.inactiveCount}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.inactiveCount - b.inactiveCount,
        exportValue: (i) => i.inactiveCount,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "onLeaveCount",
        label: t("reports.employees.byDepartment.onLeaveCount"),
        render: (i) => (
          <span className="tabular-nums text-sm text-muted-foreground">
            {i.onLeaveCount}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.onLeaveCount - b.onLeaveCount,
        exportValue: (i) => i.onLeaveCount,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "avgTenure",
        label: t("reports.employees.overview.avgTenure"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.avgTenure.toFixed(1)}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.avgTenure - b.avgTenure,
        exportValue: (i) => i.avgTenure.toFixed(1),
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "percentage",
        label: "%",
        render: (i) => (
          <div className="flex items-center gap-2 justify-end">
            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min(i.percentage, 100)}%` }}
              />
            </div>
            <span className="tabular-nums text-sm">
              {i.percentage.toFixed(1)}%
            </span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        exportValue: (i) => `${i.percentage.toFixed(1)}%`,
        align: "end" as const,
      },
    ],
    [t],
  );

  const posColumns: ColumnConfig<PositionItem>[] = useMemo(
    () => [
      {
        key: "position",
        label: t("reports.employees.byPosition.position"),
        render: (i) => (
          <span className="font-medium text-sm">{i.position}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.position.localeCompare(b.position, "ar"),
        exportValue: (i) => i.position,
        align: "start" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.employees.byPosition.employeeCount"),
        render: (i) => (
          <span className="tabular-nums text-sm font-semibold">
            {i.employeeCount}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeCount - b.employeeCount,
        exportValue: (i) => i.employeeCount,
        align: "end" as const,
      },
      {
        key: "activeCount",
        label: t("reports.employees.byDepartment.activeCount"),
        render: (i) => (
          <Badge className={getStatusBadgeClass("info", "tabular-nums")}>
            {i.activeCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.activeCount - b.activeCount,
        exportValue: (i) => i.activeCount,
        align: "center" as const,
      },
      {
        key: "avgAge",
        label: t("reports.employees.byPosition.avgAge"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.avgAge.toFixed(1)}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.avgAge - b.avgAge,
        exportValue: (i) => i.avgAge.toFixed(1),
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "avgTenure",
        label: t("reports.employees.overview.avgTenure"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.avgTenure.toFixed(1)}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.avgTenure - b.avgTenure,
        exportValue: (i) => i.avgTenure.toFixed(1),
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "percentage",
        label: "%",
        render: (i) => (
          <span className="tabular-nums text-sm">
            {i.percentage.toFixed(1)}%
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        exportValue: (i) => `${i.percentage.toFixed(1)}%`,
        align: "end" as const,
      },
    ],
    [t],
  );

  const typeColumns: ColumnConfig<EmploymentTypeItem>[] = useMemo(
    () => [
      {
        key: "typeName",
        label: t("reports.employees.byEmploymentType.type"),
        render: (i) => (
          <span className="font-medium text-sm">
            {EMP_TYPE_LABEL[i.employmentType as keyof typeof EMP_TYPE_LABEL] ??
              i.typeName}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.typeName.localeCompare(b.typeName),
        exportValue: (i) =>
          EMP_TYPE_LABEL[i.employmentType as keyof typeof EMP_TYPE_LABEL] ??
          i.typeName,
        align: "start" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.employees.byEmploymentType.employeeCount"),
        render: (i) => (
          <span className="tabular-nums text-sm font-semibold">
            {i.employeeCount}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeCount - b.employeeCount,
        exportValue: (i) => i.employeeCount,
        align: "end" as const,
      },
      {
        key: "activeCount",
        label: t("reports.employees.byDepartment.activeCount"),
        render: (i) => (
          <Badge className={getStatusBadgeClass("info", "tabular-nums")}>
            {i.activeCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.activeCount - b.activeCount,
        exportValue: (i) => i.activeCount,
        align: "center" as const,
      },
      {
        key: "avgTenure",
        label: t("reports.employees.overview.avgTenure"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.avgTenure.toFixed(1)}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.avgTenure - b.avgTenure,
        exportValue: (i) => i.avgTenure.toFixed(1),
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "percentage",
        label: "%",
        render: (i) => (
          <span className="tabular-nums text-sm">
            {i.percentage.toFixed(1)}%
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        exportValue: (i) => `${i.percentage.toFixed(1)}%`,
        align: "end" as const,
      },
    ],
    [t, EMP_TYPE_LABEL],
  );

  // ---- Data refs ----
  const ov = overview.data;
  const alerts = useMemo(() => {
    if (!ov) return [];
    const items: Array<{
      key: string;
      message: string;
      tone: "warning" | "danger";
    }> = [];

    if (ov.turnoverRate > 15) {
      items.push({
        key: "high-turnover",
        tone: "danger",
        message: `${t("reports.employees.turnover.title")} (HIGH)`,
      });
    } else if (ov.turnoverRate > 8) {
      items.push({
        key: "medium-turnover",
        tone: "warning",
        message: `${t("reports.employees.turnover.title")} (MEDIUM)`,
      });
    }

    const probationRatio = ov.totalEmployees
      ? (ov.employeesInProbation / ov.totalEmployees) * 100
      : 0;
    if (probationRatio > 10) {
      items.push({
        key: "probation-load",
        tone: "warning",
        message: t("reports.employees.overview.inProbation"),
      });
    }

    return items.slice(0, 2);
  }, [ov, t]);

  // ============ RENDER ============

  return (
    <ReportPageLayout
      title={t("reports.employees.overview.title")}
      description={t("reports.employees.overview.description")}
      isLoading={isLoading}
      error={error as Error | null}
      hasData={!!ov}
      onRefresh={handleRefresh}
      onPrint={() => window.print()}
      generatedAt={ov?.generatedAt}
      summaryStrip={
        ov && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.employees.overview.totalEmployees"),
                value: ov.totalEmployees.toLocaleString("en-US"),
              },
              {
                label: t("reports.employees.overview.activeEmployees"),
                value: ov.activeEmployees.toLocaleString("en-US"),
                valueClassName: "text-emerald-600",
              },
              {
                label: t("reports.employees.overview.newHires"),
                value: ov.newHires.toLocaleString("en-US"),
                valueClassName: "text-blue-600",
              },
              {
                label: t("reports.employees.overview.turnoverRate"),
                value: `${ov.turnoverRate.toFixed(1)}%`,
                valueClassName:
                  ov.turnoverRate > 15
                    ? "text-red-600"
                    : ov.turnoverRate > 8
                      ? "text-amber-600"
                      : "text-emerald-600",
              },
            ]}
          />
        )
      }
      // ---- Filters ----
      filters={
        <ReportFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.common.searchPlaceholder")}
          selectFilters={selectFilters}
        />
      }
      // ---- KPI Cards ----
      kpiCards={
        ov && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <ReportMetricCard
              label={t("reports.employees.overview.totalEmployees")}
              value={ov.totalEmployees}
              icon={Users}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.employees.overview.activeEmployees")}
              value={ov.activeEmployees}
              icon={UserCheck}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.employees.overview.onLeaveEmployees")}
              value={ov.onLeaveEmployees}
              icon={UserMinus}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.employees.overview.newHires")}
              value={ov.newHires}
              icon={UserPlus}
              variant="success"
              trend={ov.growthRate}
            />
            <ReportMetricCard
              label={t("reports.employees.overview.terminations")}
              value={ov.terminations}
              icon={UserX}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.employees.overview.turnoverRate")}
              value={ov.turnoverRate}
              isPercentage
              icon={TrendingDown}
              variant={
                ov.turnoverRate > 15
                  ? "danger"
                  : ov.turnoverRate > 8
                    ? "warning"
                    : "success"
              }
            />
            <ReportMetricCard
              label={t("reports.employees.overview.avgTenure")}
              value={ov.avgTenure.toFixed(1)}
              icon={Clock}
              variant="purple"
            />
            <ReportMetricCard
              label={t("reports.employees.overview.inProbation")}
              value={ov.employeesInProbation}
              icon={Shield}
              variant="default"
            />
          </div>
        )
      }
      // ---- Charts ----
      charts={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {donutData.series.length > 0 && (
            <ReportChartCard
              title={t("reports.employees.statusDistribution.chartTitle")}
              description={t(
                "reports.employees.statusDistribution.chartDescription",
              )}
              icon={PieChart}
            >
              <DonutChart
                series={donutData.series}
                labels={donutData.labels}
                colors={donutData.colors}
                showLegend
                centerLabel={{
                  value: ov?.totalEmployees ?? 0,
                  text: t("reports.employees.overview.totalEmployees"),
                }}
                height={280}
              />
            </ReportChartCard>
          )}

          {barData.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.employees.byDepartment.chartTitle")}
              description={t("reports.employees.byDepartment.chartDescription")}
              icon={BarChart3}
            >
              <BarChart
                series={barData.series}
                categories={barData.categories}
                height={280}
                stacked
              />
            </ReportChartCard>
          )}
        </div>
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
            {t("reports.employees.assignment.description")}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/reports/employees/assignment">
                {t("reports.employees.assignment.title")}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/reports/employees/contract-expiry">
                {t("reports.employees.contractExpiry.title")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ---- TABS: Department / Position / Employment Type ---- */}
      <Tabs defaultValue="department" className="space-y-4">
        <TabsList>
          <TabsTrigger value="department" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t("reports.employees.byDepartment.title")}
            {byDept.data && (
              <Badge
                className={getStatusBadgeClass(
                  "info",
                  "ms-1 px-2 py-0.5 text-xs",
                )}
              >
                {byDept.data.totalDepartments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="position" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {t("reports.employees.byPosition.title")}
            {byPos.data && (
              <Badge
                className={getStatusBadgeClass(
                  "purple",
                  "ms-1 px-2 py-0.5 text-xs",
                )}
              >
                {byPos.data.totalPositions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="type" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("reports.employees.byEmploymentType.title")}
          </TabsTrigger>
        </TabsList>

        {/* === TAB 1: Department === */}
        <TabsContent value="department" className="space-y-4 mt-0">
          <DataTable<DepartmentItem>
            data={byDept.data?.departments ?? []}
            columns={deptColumns}
            keyExtractor={(i) => i.department}
            enableClientSorting
            enableExport
            exportFilename="employees_by_department"
            exportTitle={t("reports.employees.byDepartment.title")}
            enableCompactMode
            pagination={{
              currentPage: deptPage,
              totalPages: byDept.data?.meta?.totalPages ?? 1,
              totalItems: byDept.data?.meta?.totalItems ?? 0,
              pageSize: byDept.data?.meta?.itemsPerPage ?? PAGE_SIZE,
            }}
            onPageChange={setDeptPage}
            emptyMessage={t("reports.employees.noData")}
            isLoading={byDept.isLoading}
          />
        </TabsContent>

        {/* === TAB 2: Position === */}
        <TabsContent value="position" className="space-y-4 mt-0">
          <DataTable<PositionItem>
            data={byPos.data?.positions ?? []}
            columns={posColumns}
            keyExtractor={(i) => i.position}
            enableClientSorting
            enableExport
            exportFilename="employees_by_position"
            exportTitle={t("reports.employees.byPosition.title")}
            enableCompactMode
            pagination={{
              currentPage: posPage,
              totalPages: byPos.data?.meta?.totalPages ?? 1,
              totalItems: byPos.data?.meta?.totalItems ?? 0,
              pageSize: byPos.data?.meta?.itemsPerPage ?? PAGE_SIZE,
            }}
            onPageChange={setPosPage}
            emptyMessage={t("reports.employees.noData")}
            isLoading={byPos.isLoading}
          />
        </TabsContent>

        {/* === TAB 3: Employment Type === */}
        <TabsContent value="type" className="space-y-4 mt-0">
          <DataTable<EmploymentTypeItem>
            data={byType.data?.employmentTypes ?? []}
            columns={typeColumns}
            keyExtractor={(i) => i.employmentType}
            enableClientSorting
            enableExport
            exportFilename="employees_by_type"
            exportTitle={t("reports.employees.byEmploymentType.title")}
            enableCompactMode
            pagination={{
              currentPage: typePageNum,
              totalPages: byType.data?.meta?.totalPages ?? 1,
              totalItems: byType.data?.meta?.totalItems ?? 0,
              pageSize: byType.data?.meta?.itemsPerPage ?? PAGE_SIZE,
            }}
            onPageChange={setTypePageNum}
            emptyMessage={t("reports.employees.noData")}
            isLoading={byType.isLoading}
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default EmployeesDashboardReport;

