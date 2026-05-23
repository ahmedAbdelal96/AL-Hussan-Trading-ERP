/**
 * ============================================================================
 * PROJECT LABOR COST REPORT
 * ============================================================================
 *
 * Report 9: Labor costs (SALARY + ALLOWANCE) broken down per project.
 *
 * @page ProjectLaborCostReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  Users,
  DollarSign,
  Briefcase,
  TrendingUp,
  PieChart,
  Layers,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

import { useProjectLaborCost } from "@/hooks/reports/useProjectsReport";

import type {
  ProjectLaborCostItem,
  ProjectLaborCostFilters,
} from "@/types/reports/projects.types";
import { ProjectStatus } from "@/types/reports/projects.types";

import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface LocalFilters {
  search?: string;
  projectStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ============ HELPERS ============

const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

const laborShareColor = (pct: number) => {
  if (pct > 70) return "text-red-600";
  if (pct >= 50) return "text-amber-600";
  return "text-green-600";
};

// ============ PAGE COMPONENT ============

export const ProjectLaborCostReport: React.FC = () => {
  const { t } = useTranslation();

  const STATUS_OPTIONS = useMemo(
    () =>
      Object.values(ProjectStatus).map((s) => ({
        value: s,
        label: t(`reports.projects.status.${s}`, { defaultValue: s }),
      })),
    [t],
  );

  const SORT_OPTIONS = useMemo(
    () => [
      { value: "totalLaborCost", label: t("reports.projects.sort.laborCost") },
      { value: "employeeCount", label: t("reports.projects.sort.employeeCount") },
      { value: "laborPercentage", label: t("reports.projects.sort.laborPercentage") },
    ],
    [t],
  );

  const ORDER_OPTIONS = useMemo(
    () => [
      { value: "desc", label: t("common.descending") },
      { value: "asc", label: t("common.ascending") },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- API filters ----
  const apiFilters = useMemo<ProjectLaborCostFilters>(
    () => ({
      ...(localFilters.projectStatus && {
        projectStatus: localFilters.projectStatus as ProjectStatus,
      }),
      ...(localFilters.sortBy && {
        sortBy: localFilters.sortBy as ProjectLaborCostFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useProjectLaborCost(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "projectStatus",
        label: t("reports.projects.filters.status"),
        placeholder: t("common.all"),
        options: STATUS_OPTIONS,
      },
      {
        key: "sortBy",
        label: t("reports.projects.filters.sortBy"),
        placeholder: t("common.default"),
        options: SORT_OPTIONS,
      },
      {
        key: "sortOrder",
        label: t("reports.projects.filters.sortOrder"),
        placeholder: t("common.default"),
        options: ORDER_OPTIONS,
      },
    ],
    [t, STATUS_OPTIONS, SORT_OPTIONS, ORDER_OPTIONS],
  );

  // ---- Client-side search filter ----
  const filteredData = useMemo(() => {
    let items = data?.projects || [];
    if (localFilters.search) {
      const q = localFilters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.projectCode.toLowerCase().includes(q) ||
          p.projectName.toLowerCase().includes(q),
      );
    }
    return items;
  }, [data, localFilters.search]);

  // ---- Pagination ----
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleFilterChange = useCallback((f: LocalFilters) => {
    setLocalFilters(f);
    setPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;
  const summary = data?.summary;

  // ---- Columns ----
  const columns: ColumnConfig<ProjectLaborCostItem>[] = useMemo(
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
          <div>
            <p className="font-medium text-sm">{p.projectName}</p>
            {p.siteName && (
              <p className="text-xs text-muted-foreground">{p.siteName}</p>
            )}
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (p) => p.projectName,
      },
      {
        key: "assignedEmployeeCount",
        label: t("reports.projects.table.employees"),
        render: (p) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
            {p.assignedEmployeeCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.assignedEmployeeCount - b.assignedEmployeeCount,
        exportValue: (p) => p.assignedEmployeeCount,
        align: "center" as const,
      },
      {
        key: "salaryCost",
        label: t("reports.projects.table.salaryCost"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(p.salaryCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.salaryCost - b.salaryCost,
        exportValue: (p) => p.salaryCost,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "allowanceCost",
        label: t("reports.projects.table.allowanceCost"),
        render: (p) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(p.allowanceCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.allowanceCost - b.allowanceCost,
        exportValue: (p) => p.allowanceCost,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "totalLaborCost",
        label: t("reports.projects.table.totalLaborCost"),
        render: (p) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(p.totalLaborCost, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalLaborCost - b.totalLaborCost,
        exportValue: (p) => p.totalLaborCost,
        align: "end" as const,
      },
      {
        key: "laborCostShare",
        label: t("reports.projects.table.laborShare"),
        render: (p) => (
          <span className={`text-sm font-medium ${laborShareColor(p.laborCostShare)}`}>
            {p.laborCostShare.toFixed(1)}%
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.laborCostShare - b.laborCostShare,
        exportValue: (p) => `${p.laborCostShare.toFixed(1)}%`,
        align: "center" as const,
      },
      {
        key: "laborBudgetPercentage",
        label: t("reports.projects.table.laborBudgetPct"),
        render: (p) => (
          <Badge
            className={getStatusBadgeClass(
              p.laborBudgetPercentage > 100
                ? "danger"
                : p.laborBudgetPercentage >= 60
                  ? "warning"
                  : "success",
            )}
          >
            {p.laborBudgetPercentage.toFixed(1)}%
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.laborBudgetPercentage - b.laborBudgetPercentage,
        exportValue: (p) => `${p.laborBudgetPercentage.toFixed(1)}%`,
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t, currency],
  );

  return (
    <ReportPageLayout
      title={t("reports.projects.laborCost.title")}
      description={t("reports.projects.laborCost.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <ReportMetricCard
              label={t("reports.projects.kpi.totalProjects")}
              value={data.projectCount}
              icon={Layers}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalEmployees")}
              value={summary.totalAssignedEmployees}
              icon={Users}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalSalaryCost")}
              value={summary.totalSalaryCost}
              currency={currency}
              icon={Briefcase}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalAllowanceCost")}
              value={summary.totalAllowanceCost}
              currency={currency}
              icon={DollarSign}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalLaborCost")}
              value={summary.totalLaborCost}
              currency={currency}
              icon={DollarSign}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.totalProjectCost")}
              value={summary.totalProjectCost}
              currency={currency}
              icon={TrendingUp}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.overallLaborShare")}
              value={summary.overallLaborShare}
              isPercentage
              icon={PieChart}
              variant={summary.overallLaborShare > 70 ? "danger" : "warning"}
            />
            <ReportMetricCard
              label={t("reports.projects.kpi.avgLaborCost")}
              value={summary.avgLaborCostPerProject}
              currency={currency}
              icon={DollarSign}
              variant="purple"
            />
          </div>
        )
      }
      filters={
        <ReportFilters<LocalFilters>
          filters={localFilters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.projects.searchPlaceholder")}
          selectFilters={selectFilters}
        />
      }
    >
      <DataTable<ProjectLaborCostItem>
        data={paginatedData}
        columns={columns}
        keyExtractor={(p) => p.projectId}
        enableClientSorting
        enableExport
        exportFilename="project_labor_cost_report"
        exportTitle={t("reports.projects.laborCost.title")}
        enableCompactMode
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: filteredData.length,
          pageSize,
        }}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        emptyMessage={t("reports.projects.table.empty")}
      />
    </ReportPageLayout>
  );
};

export default ProjectLaborCostReport;


