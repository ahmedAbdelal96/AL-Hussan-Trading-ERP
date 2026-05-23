/**
 * ============================================================================
 * HR ANALYTICS REPORT
 * ============================================================================
 *
 * Consolidates: TurnoverAnalysis + AgeExperience
 *
 * Layout:
 *   Tabs:
 *       KPI cards (hires, terms, rate, risk) + LineChart (monthly trend) + 2 tables
 *       KPI cards (median age, ranges) + BarChart (age groups) + 3 tables
 *
 * @page HRAnalyticsReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  TrendingDown,
  TrendingUp,
  UserPlus,
  UserX,
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  Activity,
  Calendar,
} from "lucide-react";

// Shared report components
import {
  ReportPageLayout,
  ReportMetricCard,
  ReportChartCard,
  type MetricVariant,
} from "@/components/reports/shared";

// UI
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  getStatusBadgeClass,
} from "@/components/common/statusBadgeStyles";

// Charts
import AreaChart from "@/components/charts-apex/AreaChart";
import BarChart from "@/components/charts-apex/BarChart";

// Data hooks
import {
  useTurnoverAnalysis,
  useAgeExperience,
} from "@/hooks/reports/useEmployeesReport";

// Types
import type {
  TerminationReason,
  DepartmentTurnover,
  AgeGroupItem,
  ExperienceRangeItem,
  DeptAgeExperience,
} from "@/types/reports/employees.types";

// i18n
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router";

// ============ RISK COLORS ============

const RISK_COLORS = {
  Low: "success",
  Medium: "warning",
  High: "danger",
} as const satisfies Record<string, MetricVariant>;

// ============ COMPONENT ============

export const HRAnalyticsReport: React.FC = () => {
  const { t } = useTranslation();

  // ---- Pagination ----
  const [reasonsPage, setReasonsPage] = useState(1);
  const [deptTurnoverPage, setDeptTurnoverPage] = useState(1);
  const [ageGroupPage, setAgeGroupPage] = useState(1);
  const [expRangePage, setExpRangePage] = useState(1);
  const [deptDemoPage, setDeptDemoPage] = useState(1);
  const PAGE_SIZE = 15;

  // ---- Data ----
  const turnover = useTurnoverAnalysis({
    periodMonths: 12,
    includeReasons: true,
    includeDepartmentBreakdown: true,
  });
  const ageExp = useAgeExperience();

  const isLoading = turnover.isLoading && ageExp.isLoading;
  const error = turnover.error || ageExp.error || null;

  const handleRefresh = useCallback(() => {
    turnover.refetch();
    ageExp.refetch();
  }, [turnover, ageExp]);

  // ---- Turnover trend chart ----
  const trendData = useMemo(() => {
    const points = turnover.data?.monthlyTrend;
    if (!points?.length) return { categories: [], series: [] };
    return {
      categories: points.map((p) => p.month),
      series: [
        {
          name: t("reports.employees.turnover.newHires"),
          data: points.map((p) => p.newHires),
        },
        {
          name: t("reports.employees.turnover.terminations"),
          data: points.map((p) => p.terminations),
        },
      ],
    };
  }, [turnover.data, t]);

  // ---- Age groups bar chart ----
  const ageBarData = useMemo(() => {
    const groups = ageExp.data?.ageGroups;
    if (!groups?.length) return { categories: [], series: [] };
    return {
      categories: groups.map((g) => g.ageRange),
      series: [
        {
          name: t("reports.employees.ageExperience.male"),
          data: groups.map((g) => g.maleCount),
        },
        {
          name: t("reports.employees.ageExperience.female"),
          data: groups.map((g) => g.femaleCount),
        },
      ],
    };
  }, [ageExp.data, t]);

  // ---- Turnover tab columns ----
  const reasonsColumns: ColumnConfig<TerminationReason>[] = useMemo(
    () => [
      {
        key: "reason",
        label: t("reports.employees.turnover.reason"),
        render: (i) => <span className="font-medium text-sm">{i.reason}</span>,
        sortable: true,
        sortFn: (a, b) => a.reason.localeCompare(b.reason, "ar"),
        exportValue: (i) => i.reason,
        align: "start" as const,
      },
      {
        key: "count",
        label: t("reports.employees.turnover.count"),
        render: (i) => (
          <span className="tabular-nums text-sm font-semibold">{i.count}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.count - b.count,
        exportValue: (i) => i.count,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: "%",
        render: (i) => (
          <div className="flex items-center gap-2 justify-end">
            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
              <div
                className="h-full rounded-full bg-red-500"
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

  const deptTurnoverColumns: ColumnConfig<DepartmentTurnover>[] = useMemo(
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
        key: "totalEmployees",
        label: t("reports.employees.overview.totalEmployees"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.totalEmployees}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalEmployees - b.totalEmployees,
        exportValue: (i) => i.totalEmployees,
        align: "end" as const,
      },
      {
        key: "terminations",
        label: t("reports.employees.turnover.terminations"),
        render: (i) => (
          <Badge className={getStatusBadgeClass("danger", "tabular-nums")}>
            {i.terminations}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.terminations - b.terminations,
        exportValue: (i) => i.terminations,
        align: "center" as const,
      },
      {
        key: "turnoverRate",
        label: t("reports.employees.turnover.turnoverRate"),
        render: (i) => (
          <Badge
            className={getStatusBadgeClass(
              i.turnoverRate > 15
                ? "danger"
                : i.turnoverRate > 8
                  ? "warning"
                  : "info",
              "tabular-nums",
            )}
          >
            {i.turnoverRate.toFixed(1)}%
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.turnoverRate - b.turnoverRate,
        exportValue: (i) => `${i.turnoverRate.toFixed(1)}%`,
        align: "center" as const,
      },
      {
        key: "avgTenureOfLeavers",
        label: t("reports.employees.turnover.avgTenureOfLeavers"),
        render: (i) => (
          <span className="tabular-nums text-sm">
            {i.avgTenureOfLeavers.toFixed(1)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.avgTenureOfLeavers - b.avgTenureOfLeavers,
        exportValue: (i) => i.avgTenureOfLeavers.toFixed(1),
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  // ---- Age & Experience tab columns ----
  const ageGroupColumns: ColumnConfig<AgeGroupItem>[] = useMemo(
    () => [
      {
        key: "ageRange",
        label: t("reports.employees.ageExperience.ageRange"),
        render: (i) => (
          <span className="font-medium text-sm">{i.ageRange}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.ageRange.localeCompare(b.ageRange),
        exportValue: (i) => i.ageRange,
        align: "start" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.employees.ageExperience.employeeCount"),
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
        key: "maleCount",
        label: t("reports.employees.ageExperience.male"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.maleCount}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.maleCount - b.maleCount,
        exportValue: (i) => i.maleCount,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "femaleCount",
        label: t("reports.employees.ageExperience.female"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.femaleCount}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.femaleCount - b.femaleCount,
        exportValue: (i) => i.femaleCount,
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

  const expColumns: ColumnConfig<ExperienceRangeItem>[] = useMemo(
    () => [
      {
        key: "experienceRange",
        label: t("reports.employees.ageExperience.experienceRange"),
        render: (i) => (
          <span className="font-medium text-sm">{i.experienceRange}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.experienceRange.localeCompare(b.experienceRange),
        exportValue: (i) => i.experienceRange,
        align: "start" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.employees.ageExperience.employeeCount"),
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
        key: "avgAge",
        label: t("reports.employees.ageExperience.avgAge"),
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

  const deptDemoColumns: ColumnConfig<DeptAgeExperience>[] = useMemo(
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
        label: t("reports.employees.ageExperience.employeeCount"),
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
        key: "avgAge",
        label: t("reports.employees.ageExperience.avgAge"),
        render: (i) => (
          <span className="tabular-nums text-sm">{i.avgAge.toFixed(1)}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.avgAge - b.avgAge,
        exportValue: (i) => i.avgAge.toFixed(1),
        align: "end" as const,
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
      },
      {
        key: "minAge",
        label: t("reports.employees.ageExperience.minAge"),
        render: (i) => <span className="tabular-nums text-sm">{i.minAge}</span>,
        sortable: true,
        sortFn: (a, b) => a.minAge - b.minAge,
        exportValue: (i) => i.minAge,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "maxAge",
        label: t("reports.employees.ageExperience.maxAge"),
        render: (i) => <span className="tabular-nums text-sm">{i.maxAge}</span>,
        sortable: true,
        sortFn: (a, b) => a.maxAge - b.maxAge,
        exportValue: (i) => i.maxAge,
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  // ---- Pagination helpers ----
  const paginate = <T,>(data: T[], page: number) => {
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  };

  const reasonsData = turnover.data?.terminationReasons ?? [];
  const deptTurnoverData = turnover.data?.departmentTurnover ?? [];
  const ageGroupData = ageExp.data?.ageGroups ?? [];
  const expData = ageExp.data?.experienceRanges ?? [];
  const deptDemoData = ageExp.data?.departmentSummary ?? [];

  const tv = turnover.data;
  const ae = ageExp.data;
  const alerts = useMemo(() => {
    if (!tv) return [];
    const list: Array<{ key: string; tone: "warning" | "danger"; message: string }> = [];
    if (tv.riskLevel === "High") {
      list.push({
        key: "high-risk",
        tone: "danger",
        message: `${t("reports.employees.turnover.title")} (HIGH)`,
      });
    } else if (tv.riskLevel === "Medium") {
      list.push({
        key: "medium-risk",
        tone: "warning",
        message: `${t("reports.employees.turnover.title")} (MEDIUM)`,
      });
    }

    if (tv.voluntaryTerminationRate > 40) {
      list.push({
        key: "voluntary-rate",
        tone: "warning",
        message: t("reports.employees.turnover.voluntaryRate"),
      });
    }
    return list.slice(0, 2);
  }, [tv, t]);

  // ============ RENDER ============

  return (
    <ReportPageLayout
      title={t("reports.employees.ageExperience.title")}
      description={t("reports.employees.ageExperience.description")}
      borderColor="info"
      isLoading={isLoading}
      error={error as Error | null}
      hasData={!!(tv || ae)}
      onRefresh={handleRefresh}
      generatedAt={tv?.generatedAt ?? ae?.generatedAt}
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
            {t("reports.employees.turnover.description")}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/reports/employees/dashboard">
                {t("reports.employees.overview.title")}
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

      <Tabs defaultValue="turnover" className="space-y-4">
        <TabsList>
          <TabsTrigger value="turnover" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t("reports.employees.turnover.title")}
            {tv && (
              <Badge
                className={getStatusBadgeClass(
                  RISK_COLORS[tv.riskLevel] ?? "warning",
                  "ms-1 text-xs",
                )}
              >
                {tv.riskLevel}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="age-exp" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t("reports.employees.ageExperience.title")}
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: TURNOVER ANALYSIS ===== */}
        <TabsContent value="turnover" className="space-y-6 mt-0">
          {tv && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ReportMetricCard
                label={t("reports.employees.turnover.totalNewHires")}
                value={tv.totalNewHires}
                icon={UserPlus}
                variant="success"
              />
              <ReportMetricCard
                label={t("reports.employees.turnover.totalTerminations")}
                value={tv.totalTerminations}
                icon={UserX}
                variant="danger"
              />
              <ReportMetricCard
                label={t("reports.employees.turnover.avgTurnoverRate")}
                value={tv.avgTurnoverRate}
                isPercentage
                icon={TrendingDown}
                variant={RISK_COLORS[tv.riskLevel] ?? "warning"}
              />
              <ReportMetricCard
                label={t("reports.employees.turnover.voluntaryRate")}
                value={tv.voluntaryTerminationRate}
                isPercentage
                icon={AlertTriangle}
                variant={
                  tv.voluntaryTerminationRate > 50 ? "danger" : "warning"
                }
              />
            </div>
          )}

          {/* Trend chart */}
          {trendData.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.employees.turnover.trendChartTitle")}
              description={t(
                "reports.employees.turnover.trendChartDescription",
              )}
              icon={BarChart3}
            >
              <AreaChart
                series={trendData.series}
                categories={trendData.categories}
                height={280}
              />
            </ReportChartCard>
          )}

          {/* Termination Reasons table */}
          {reasonsData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                {t("reports.employees.turnover.terminationReasonsTable")}
              </h3>
              <DataTable<TerminationReason>
                data={paginate(reasonsData, reasonsPage)}
                columns={reasonsColumns}
                keyExtractor={(i) => i.reason}
                enableClientSorting
                enableExport
                exportFilename="turnover_reasons"
                enableCompactMode
                pagination={{
                  currentPage: reasonsPage,
                  totalPages: Math.ceil(reasonsData.length / PAGE_SIZE),
                  totalItems: reasonsData.length,
                  pageSize: PAGE_SIZE,
                }}
                onPageChange={setReasonsPage}
              />
            </div>
          )}

          {/* Department Turnover table */}
          {deptTurnoverData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                {t("reports.employees.turnover.deptTurnoverTable")}
              </h3>
              <DataTable<DepartmentTurnover>
                data={paginate(deptTurnoverData, deptTurnoverPage)}
                columns={deptTurnoverColumns}
                keyExtractor={(i) => i.department}
                enableClientSorting
                enableExport
                exportFilename="department_turnover"
                enableCompactMode
                pagination={{
                  currentPage: deptTurnoverPage,
                  totalPages: Math.ceil(deptTurnoverData.length / PAGE_SIZE),
                  totalItems: deptTurnoverData.length,
                  pageSize: PAGE_SIZE,
                }}
                onPageChange={setDeptTurnoverPage}
              />
            </div>
          )}
        </TabsContent>

        {/* ===== TAB 2: AGE & EXPERIENCE ===== */}
        <TabsContent value="age-exp" className="space-y-6 mt-0">
          {ae && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ReportMetricCard
                label={t("reports.employees.ageExperience.medianAge")}
                value={ae.medianAge}
                icon={Users}
                variant="info"
              />
              <ReportMetricCard
                label={t("reports.employees.ageExperience.under30")}
                value={ae.under30Count}
                icon={TrendingUp}
                variant="success"
              />
              <ReportMetricCard
                label={t("reports.employees.ageExperience.age30to45")}
                value={ae.age30to45Count}
                icon={Users}
                variant="purple"
              />
              <ReportMetricCard
                label={t("reports.employees.ageExperience.over45")}
                value={ae.over45Count}
                icon={Clock}
                variant="warning"
              />
            </div>
          )}

          {/* Age distribution bar chart */}
          {ageBarData.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.employees.ageExperience.ageChartTitle")}
              description={t(
                "reports.employees.ageExperience.ageChartDescription",
              )}
              icon={BarChart3}
            >
              <BarChart
                series={ageBarData.series}
                categories={ageBarData.categories}
                height={280}
                stacked
              />
            </ReportChartCard>
          )}

          {/* Age groups table */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              {t("reports.employees.ageExperience.ageGroupsTable")}
            </h3>
            <DataTable<AgeGroupItem>
              data={paginate(ageGroupData, ageGroupPage)}
              columns={ageGroupColumns}
              keyExtractor={(i) => i.ageRange}
              enableClientSorting
              enableExport
              exportFilename="age_groups"
              enableCompactMode
              pagination={{
                currentPage: ageGroupPage,
                totalPages: Math.ceil(ageGroupData.length / PAGE_SIZE),
                totalItems: ageGroupData.length,
                pageSize: PAGE_SIZE,
              }}
              onPageChange={setAgeGroupPage}
            />
          </div>

          {/* Experience ranges table */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              {t("reports.employees.ageExperience.expRangesTable")}
            </h3>
            <DataTable<ExperienceRangeItem>
              data={paginate(expData, expRangePage)}
              columns={expColumns}
              keyExtractor={(i) => i.experienceRange}
              enableClientSorting
              enableExport
              exportFilename="experience_ranges"
              enableCompactMode
              pagination={{
                currentPage: expRangePage,
                totalPages: Math.ceil(expData.length / PAGE_SIZE),
                totalItems: expData.length,
                pageSize: PAGE_SIZE,
              }}
              onPageChange={setExpRangePage}
            />
          </div>

          {/* Department demographics table */}
          {deptDemoData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                {t("reports.employees.ageExperience.deptSummaryTable")}
              </h3>
              <DataTable<DeptAgeExperience>
                data={paginate(deptDemoData, deptDemoPage)}
                columns={deptDemoColumns}
                keyExtractor={(i) => i.department}
                enableClientSorting
                enableExport
                exportFilename="dept_demographics"
                enableCompactMode
                pagination={{
                  currentPage: deptDemoPage,
                  totalPages: Math.ceil(deptDemoData.length / PAGE_SIZE),
                  totalItems: deptDemoData.length,
                  pageSize: PAGE_SIZE,
                }}
                onPageChange={setDeptDemoPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default HRAnalyticsReport;

