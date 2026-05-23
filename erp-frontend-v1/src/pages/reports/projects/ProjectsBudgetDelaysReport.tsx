/**
 * ============================================================================
 * PROJECTS BUDGET & DELAYS REPORT
 * ============================================================================
 *
 * Replaces: BudgetUtilizationReport + DelayedProjectsReport
 *
 * Two tabs:
 *   Tab 1 — Budget Utilization: table with budget vs actual, sorted by utilization
 *   Tab 2 — Delayed Projects: table with delay days, sorted by severity
 *
 * Both tabs have: KPIs, Filters, Pagination, Sort, Search, Export
 *
 * @page ProjectsBudgetDelaysReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

// Shared report components
import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";

// UI
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Data hooks
import {
  useBudgetUtilization,
  useDelayedProjects,
} from "@/hooks/reports/useProjectsReport";

// Types
import type {
  ProjectBudgetItem,
  DelayedProjectItem,
} from "@/types/reports/projects.types";

// i18n
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

// ============ FILTER TYPES ============

interface BudgetFilters {
  search?: string;
  budgetStatus?: string;
}

interface DelayFilters {
  search?: string;
  severity?: string;
}

// ============ PAGE COMPONENT ============

export const ProjectsBudgetDelaysReport: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  // ---- Translated maps (reactive to language) ----
  const STATUS_MAP = useMemo(
    () => ({
      PLANNING: t("reports.projects.status.PLANNING"),
      ACTIVE: t("reports.projects.status.ACTIVE"),
      ON_HOLD: t("reports.projects.status.ON_HOLD"),
      COMPLETED: t("reports.projects.status.COMPLETED"),
      CANCELLED: t("reports.projects.status.CANCELLED"),
    }),
    [t],
  );

  const BUDGET_STATUS_MAP = useMemo(
    () => ({
      WITHIN_BUDGET: t("reports.projects.budgetStatus.WITHIN_BUDGET"),
      OVER_BUDGET: t("reports.projects.budgetStatus.OVER_BUDGET"),
      UNDER_BUDGET: t("reports.projects.budgetStatus.UNDER_BUDGET"),
      NO_BUDGET: t("reports.projects.budgetStatus.NO_BUDGET"),
    }),
    [t],
  );

  const DELAY_CATEGORY_MAP = useMemo(
    () => ({
      Minor: t("reports.projects.delayCategory.Minor"),
      Moderate: t("reports.projects.delayCategory.Moderate"),
      Major: t("reports.projects.delayCategory.Major"),
      Critical: t("reports.projects.delayCategory.Critical"),
    }),
    [t],
  );

  const BUDGET_FILTER_OPTIONS = useMemo(
    () => [
      { value: "over", label: t("reports.projects.filters.overBudget") },
      { value: "within", label: t("reports.projects.filters.withinBudget") },
      { value: "under", label: t("reports.projects.filters.underBudget") },
    ],
    [t],
  );

  const DELAY_FILTER_OPTIONS = useMemo(
    () => [
      { value: "Minor", label: t("reports.projects.filters.minor") },
      { value: "Moderate", label: t("reports.projects.filters.moderate") },
      { value: "Major", label: t("reports.projects.filters.major") },
      { value: "Critical", label: t("reports.projects.filters.critical") },
    ],
    [t],
  );

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState("budget");

  // ---- Budget tab state ----
  const [budgetFilters, setBudgetFilters] = useState<BudgetFilters>({});
  const [budgetPage, setBudgetPage] = useState(1);
  const [budgetPageSize, setBudgetPageSize] = useState(10);

  // ---- Delay tab state ----
  const [delayFilters, setDelayFilters] = useState<DelayFilters>({});
  const [delayPage, setDelayPage] = useState(1);
  const [delayPageSize, setDelayPageSize] = useState(10);

  // ---- Data hooks ----
  const budget = useBudgetUtilization({});
  const delayed = useDelayedProjects({});

  const isLoading = budget.isLoading || delayed.isLoading;
  const error = budget.error || delayed.error;

  const handleRefresh = useCallback(() => {
    budget.refetch();
    delayed.refetch();
  }, [budget, delayed]);

  // ============ BUDGET TAB ============

  const budgetSelectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "budgetStatus",
        label: t("reports.projects.filters.budgetStatus"),
        placeholder: t("common.all"),
        options: BUDGET_FILTER_OPTIONS,
      },
    ],
    [t, BUDGET_FILTER_OPTIONS],
  );

  const filteredBudgetData = useMemo(() => {
    let items = budget.data?.projects || [];

    if (budgetFilters.budgetStatus) {
      const map: Record<string, string> = {
        over: "OVER_BUDGET",
        within: "WITHIN_BUDGET",
        under: "UNDER_BUDGET",
      };
      const target = map[budgetFilters.budgetStatus];
      if (target) items = items.filter((p) => p.budgetStatus === target);
    }

    if (budgetFilters.search) {
      const q = budgetFilters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.projectCode.toLowerCase().includes(q) ||
          p.projectName.toLowerCase().includes(q),
      );
    }

    return items;
  }, [budget.data, budgetFilters]);

  const paginatedBudget = useMemo(() => {
    const start = (budgetPage - 1) * budgetPageSize;
    return filteredBudgetData.slice(start, start + budgetPageSize);
  }, [filteredBudgetData, budgetPage, budgetPageSize]);

  const budgetTotalPages = Math.ceil(
    filteredBudgetData.length / budgetPageSize,
  );

  const handleBudgetFilterChange = useCallback((f: BudgetFilters) => {
    setBudgetFilters(f);
    setBudgetPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;

  const budgetColumns: ColumnConfig<ProjectBudgetItem>[] = useMemo(
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
          <span className="font-medium text-sm">{p.projectName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (p) => p.projectName,
      },
      {
        key: "status",
        label: t("reports.projects.table.status"),
        render: (p) => (
          <Badge className={getStatusBadgeClass(getStatusTone(p.status))}>
            {STATUS_MAP[p.status as keyof typeof STATUS_MAP] || p.status}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.status.localeCompare(b.status),
        exportValue: (p) =>
          STATUS_MAP[p.status as keyof typeof STATUS_MAP] || p.status,
      },
      {
        key: "budget",
        label: t("reports.projects.table.budget"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {currency} {p.budget.toLocaleString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.budget - b.budget,
        exportValue: (p) => p.budget,
        align: "end" as const,
        hidden: true,
      },
      {
        key: "actualCost",
        label: t("reports.projects.table.actualCost"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {currency} {p.actualCost.toLocaleString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.actualCost - b.actualCost,
        exportValue: (p) => p.actualCost,
        align: "end" as const,
        hidden: true,
      },
      {
        key: "budgetVariance",
        label: t("reports.projects.table.budgetVariance"),
        render: (p) => (
          <span
            className={`text-sm font-medium ${
              p.budgetVariance < 0 ? "text-red-600" : "text-green-600"
            }`}
            dir="ltr"
          >
            {p.budgetVariance > 0 ? "+" : ""}
            {currency} {p.budgetVariance.toLocaleString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.budgetVariance - b.budgetVariance,
        exportValue: (p) => p.budgetVariance,
        align: "end" as const,
        hidden: true,
      },
      {
        key: "utilization",
        label: t("reports.projects.table.utilization"),
        render: (p) => (
          <div className="flex items-center gap-2">
            <Progress
              value={Math.min(p.utilization, 100)}
              className="h-2 flex-1 min-w-[60px]"
            />
            <span
              className={`text-xs font-semibold w-12 text-end ${
                p.utilization > 100
                  ? "text-red-600"
                  : p.utilization > 80
                    ? "text-amber-600"
                    : "text-green-600"
              }`}
            >
              {p.utilization.toFixed(1)}%
            </span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.utilization - b.utilization,
        exportValue: (p) => `${p.utilization.toFixed(1)}%`,
        align: "center" as const,
      },
      {
        key: "budgetStatus",
        label: t("reports.projects.table.budgetStatus"),
        render: (p) => (
          <Badge className={getStatusBadgeClass(getStatusTone(p.budgetStatus))}>
            {BUDGET_STATUS_MAP[
              p.budgetStatus as keyof typeof BUDGET_STATUS_MAP
            ] || p.budgetStatus}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.budgetStatus.localeCompare(b.budgetStatus),
        exportValue: (p) =>
          BUDGET_STATUS_MAP[p.budgetStatus as keyof typeof BUDGET_STATUS_MAP] ||
          p.budgetStatus,
      },
      {
        key: "completionPercentage",
        label: t("reports.projects.table.completion"),
        render: (p) => (
          <span className="text-sm">{p.completionPercentage}%</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.completionPercentage - b.completionPercentage,
        exportValue: (p) => `${p.completionPercentage}%`,
        align: "center" as const,
        hidden: true,
      },
    ],
    [t, currency, STATUS_MAP, BUDGET_STATUS_MAP],
  );

  // ============ DELAYS TAB ============

  const delaySelectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "severity",
        label: t("reports.projects.filters.severity"),
        placeholder: t("common.all"),
        options: DELAY_FILTER_OPTIONS,
      },
    ],
    [t, DELAY_FILTER_OPTIONS],
  );

  const filteredDelayData = useMemo(() => {
    let items = delayed.data?.projects || [];

    if (delayFilters.severity) {
      items = items.filter((p) => p.delayCategory === delayFilters.severity);
    }

    if (delayFilters.search) {
      const q = delayFilters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.projectCode.toLowerCase().includes(q) ||
          p.projectName.toLowerCase().includes(q),
      );
    }

    return items;
  }, [delayed.data, delayFilters]);

  const paginatedDelay = useMemo(() => {
    const start = (delayPage - 1) * delayPageSize;
    return filteredDelayData.slice(start, start + delayPageSize);
  }, [filteredDelayData, delayPage, delayPageSize]);

  const delayTotalPages = Math.ceil(filteredDelayData.length / delayPageSize);

  const handleDelayFilterChange = useCallback((f: DelayFilters) => {
    setDelayFilters(f);
    setDelayPage(1);
  }, []);

  const delayColumns: ColumnConfig<DelayedProjectItem>[] = useMemo(
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
          <span className="font-medium text-sm">{p.projectName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (p) => p.projectName,
      },
      {
        key: "status",
        label: t("reports.projects.table.status"),
        render: (p) => (
          <Badge className={getStatusBadgeClass(getStatusTone(p.status))}>
            {STATUS_MAP[p.status as keyof typeof STATUS_MAP] || p.status}
          </Badge>
        ),
        exportValue: (p) =>
          STATUS_MAP[p.status as keyof typeof STATUS_MAP] || p.status,
      },
      {
        key: "delayDays",
        label: t("reports.projects.table.delayDays"),
        render: (p) => (
          <span className="text-sm font-bold text-red-600">
            {p.delayDays} {t("common.days")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.delayDays - b.delayDays,
        exportValue: (p) => p.delayDays,
        align: "center" as const,
      },
      {
        key: "delayCategory",
        label: t("reports.projects.table.severity"),
        render: (p) => (
          <Badge className={getStatusBadgeClass(getStatusTone(p.delayCategory))}>
            {DELAY_CATEGORY_MAP[
              p.delayCategory as keyof typeof DELAY_CATEGORY_MAP
            ] || p.delayCategory}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.delayDays - b.delayDays,
        exportValue: (p) =>
          DELAY_CATEGORY_MAP[
            p.delayCategory as keyof typeof DELAY_CATEGORY_MAP
          ] || p.delayCategory,
        align: "center" as const,
      },
      {
        key: "completionPercentage",
        label: t("reports.projects.table.completion"),
        render: (p) => (
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress value={p.completionPercentage} className="h-2 flex-1" />
            <span className="text-xs font-medium w-10 text-end">
              {p.completionPercentage}%
            </span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.completionPercentage - b.completionPercentage,
        exportValue: (p) => `${p.completionPercentage}%`,
        align: "center" as const,
      },
      {
        key: "budget",
        label: t("reports.projects.table.budget"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {currency} {p.budget.toLocaleString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.budget - b.budget,
        exportValue: (p) => p.budget,
        align: "end" as const,
        hidden: true,
      },
      {
        key: "managerName",
        label: t("reports.projects.table.manager"),
        render: (p) => (
          <span className="text-sm text-muted-foreground">
            {p.managerName || "-"}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          (a.managerName || "").localeCompare(b.managerName || "", "ar"),
        exportValue: (p) => p.managerName || "-",
        hidden: true,
      },
      {
        key: "isCritical",
        label: t("reports.projects.table.critical"),
        render: (p) =>
          p.isCritical ? (
            <AlertTriangle className="h-5 w-5 text-red-600 mx-auto" />
          ) : (
            <span className="text-muted-foreground text-center block">-</span>
          ),
        sortable: true,
        sortFn: (a, b) => Number(b.isCritical) - Number(a.isCritical),
        exportValue: (p) =>
          p.isCritical ? t("reports.projects.table.critical") : "-",
        align: "center" as const,
      },
    ],
    [t, currency, STATUS_MAP, DELAY_CATEGORY_MAP],
  );

  // ---- Derived KPIs ----
  const bd = budget.data;
  const dd = delayed.data;

  return (
    <ReportPageLayout
      title={t("reports.projects.budgetDelays.title")}
      description={t("reports.projects.budgetDelays.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!(bd || dd)}
      onRefresh={handleRefresh}
      generatedAt={bd?.generatedAt || dd?.generatedAt}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        dir={language === "ar" ? "rtl" : "ltr"}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="budget" className="gap-2">
            <DollarSign className="h-4 w-4" />
            {t("reports.projects.tabs.budget")}
            {bd && (
              <Badge className={getStatusBadgeClass("neutral", "ms-1")}>
                {bd.totalProjects}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="delays" className="gap-2">
            <Clock className="h-4 w-4" />
            {t("reports.projects.tabs.delays")}
            {dd && (
              <Badge className={getStatusBadgeClass("danger", "ms-1")}>
                {dd.totalDelayedProjects}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ======== BUDGET TAB ======== */}
        <TabsContent value="budget" className="space-y-6">
          {/* KPIs */}
          {bd && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ReportMetricCard
                label={t("reports.projects.kpi.totalBudget")}
                value={bd.totalBudget}
                currency={currency}
                icon={DollarSign}
                variant="info"
              />
              <ReportMetricCard
                label={t("reports.projects.kpi.totalCost")}
                value={bd.totalActualCost}
                currency={currency}
                icon={DollarSign}
                variant={
                  bd.totalActualCost > bd.totalBudget ? "danger" : "success"
                }
              />
              <ReportMetricCard
                label={t("reports.projects.kpi.avgUtilization")}
                value={bd.avgUtilization}
                isPercentage
                icon={Target}
                variant={
                  bd.avgUtilization > 100
                    ? "danger"
                    : bd.avgUtilization > 80
                      ? "warning"
                      : "success"
                }
              />
              <ReportMetricCard
                label={t("reports.projects.kpi.overBudget")}
                value={bd.overBudgetCount}
                icon={TrendingUp}
                variant="danger"
              />
            </div>
          )}

          {/* Filters */}
          <ReportFilters<BudgetFilters>
            filters={budgetFilters}
            onFilterChange={handleBudgetFilterChange}
            searchKey="search"
            searchPlaceholder={t("reports.projects.searchPlaceholder")}
            selectFilters={budgetSelectFilters}
          />

          {/* Table */}
          <DataTable<ProjectBudgetItem>
            data={paginatedBudget}
            columns={budgetColumns}
            keyExtractor={(p) => p.projectId}
            enableClientSorting
            enableExport
            exportFilename="budget_utilization_report"
            enableCompactMode
            pagination={{
              currentPage: budgetPage,
              totalPages: budgetTotalPages,
              totalItems: filteredBudgetData.length,
              pageSize: budgetPageSize,
            }}
            onPageChange={setBudgetPage}
            onPageSizeChange={(size) => {
              setBudgetPageSize(size);
              setBudgetPage(1);
            }}
            emptyMessage={t("reports.projects.table.emptyBudget")}
          />
        </TabsContent>

        {/* ======== DELAYS TAB ======== */}
        <TabsContent value="delays" className="space-y-6">
          {/* KPIs */}
          {dd && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ReportMetricCard
                label={t("reports.projects.kpi.totalDelayed")}
                value={dd.totalDelayedProjects}
                icon={Clock}
                variant="danger"
              />
              <ReportMetricCard
                label={t("reports.projects.kpi.critical")}
                value={dd.criticalProjectsCount}
                icon={ShieldAlert}
                variant="danger"
              />
              <ReportMetricCard
                label={t("reports.projects.kpi.avgDelay")}
                value={`${dd.avgDelayDays} ${t("common.days")}`}
                icon={Clock}
                variant="warning"
              />
              <ReportMetricCard
                label={t("reports.projects.kpi.budgetAtRisk")}
                value={dd.totalBudgetAtRisk}
                currency={currency}
                icon={BarChart3}
                variant="danger"
              />
            </div>
          )}

          {/* Filters */}
          <ReportFilters<DelayFilters>
            filters={delayFilters}
            onFilterChange={handleDelayFilterChange}
            searchKey="search"
            searchPlaceholder={t("reports.projects.searchPlaceholder")}
            selectFilters={delaySelectFilters}
          />

          {/* Table */}
          <DataTable<DelayedProjectItem>
            data={paginatedDelay}
            columns={delayColumns}
            keyExtractor={(p) => p.projectId}
            enableClientSorting
            enableExport
            exportFilename="delayed_projects_report"
            enableCompactMode
            pagination={{
              currentPage: delayPage,
              totalPages: delayTotalPages,
              totalItems: filteredDelayData.length,
              pageSize: delayPageSize,
            }}
            onPageChange={setDelayPage}
            onPageSizeChange={(size) => {
              setDelayPageSize(size);
              setDelayPage(1);
            }}
            emptyMessage={t("reports.projects.table.emptyDelayed")}
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default ProjectsBudgetDelaysReport;



