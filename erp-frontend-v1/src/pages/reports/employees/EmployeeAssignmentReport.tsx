/**
 * ============================================================================
 * EMPLOYEE ASSIGNMENT REPORT
 * ============================================================================
 *
 * Report 8: Per-employee project deployment with allocation percentages.
 *
 * @page EmployeeAssignmentReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  UserX,
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
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

import { useEmployeeAssignment } from "@/hooks/reports/useEmployeesReport";

import type {
  EmployeeAssignmentFilters,
  EmployeeAssignmentItem,
} from "@/types/reports/employees.types";

import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface LocalFilters {
  search?: string;
  allocationStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ============ HELPERS ============

// ============ PAGE COMPONENT ============

export const EmployeeAssignmentReport: React.FC = () => {
  const { t } = useTranslation();

  const ALLOCATION_OPTIONS = useMemo(
    () => [
      {
        value: "OVERHEAD",
        label: t("reports.employees.allocation.overhead"),
      },
      {
        value: "OVER_ALLOCATED",
        label: t("reports.employees.allocation.overAllocated"),
      },
      {
        value: "FULLY_ALLOCATED",
        label: t("reports.employees.allocation.fullyAllocated"),
      },
      {
        value: "UNDER_ALLOCATED",
        label: t("reports.employees.allocation.underAllocated"),
      },
    ],
    [t],
  );

  const SORT_OPTIONS = useMemo(
    () => [
      {
        value: "employeeName",
        label: t("reports.employees.sort.name"),
      },
      {
        value: "allocationPct",
        label: t("reports.employees.sort.allocationPct"),
      },
      {
        value: "projectCount",
        label: t("reports.employees.sort.projectCount"),
      },
    ],
    [t],
  );

  const ORDER_OPTIONS = useMemo(
    () => [
      {
        value: "desc",
        label: t("common.descending"),
      },
      {
        value: "asc",
        label: t("common.ascending"),
      },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- API filters ----
  const apiFilters = useMemo<EmployeeAssignmentFilters>(
    () => ({
      ...(localFilters.allocationStatus && {
        allocationStatus:
          localFilters.allocationStatus as EmployeeAssignmentFilters["allocationStatus"],
      }),
      ...(localFilters.sortBy && {
        sortBy:
          localFilters.sortBy as EmployeeAssignmentFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } =
    useEmployeeAssignment(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "allocationStatus",
        label: t("reports.employees.filters.allocationStatus"),
        placeholder: t("common.all"),
        options: ALLOCATION_OPTIONS,
      },
      {
        key: "sortBy",
        label: t("reports.employees.filters.sortBy"),
        placeholder: t("common.default"),
        options: SORT_OPTIONS,
      },
      {
        key: "sortOrder",
        label: t("reports.employees.filters.sortOrder"),
        placeholder: t("common.default"),
        options: ORDER_OPTIONS,
      },
    ],
    [t, ALLOCATION_OPTIONS, SORT_OPTIONS, ORDER_OPTIONS],
  );

  // ---- Client-side search ----
  const filteredData = useMemo(() => {
    let items = data?.employees || [];
    if (localFilters.search) {
      const q = localFilters.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.employeeName.toLowerCase().includes(q) ||
          e.employeeNumber.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q),
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

  const summary = data?.summary;

  // ---- Columns ----
  const columns: ColumnConfig<EmployeeAssignmentItem>[] = useMemo(
    () => [
      {
        key: "employeeNumber",
        label: t("reports.employees.table.empNumber"),
        render: (e) => (
          <span className="font-mono text-xs font-medium">
            {e.employeeNumber}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeNumber.localeCompare(b.employeeNumber),
        exportValue: (e) => e.employeeNumber,
      },
      {
        key: "employeeName",
        label: t("reports.employees.table.employee"),
        render: (e) => (
          <div>
            <p className="font-medium text-sm">{e.employeeName}</p>
            <p className="text-xs text-muted-foreground">
              {e.department} - {e.position}
            </p>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeName.localeCompare(b.employeeName),
        exportValue: (e) => e.employeeName,
      },
      {
        key: "allocationStatus",
        label: t("reports.employees.table.allocationStatus"),
        render: (e) => (
          <Badge className={getStatusBadgeClass(getStatusTone(e.allocationStatus))}>
            {e.allocationStatus === "OVERHEAD"
              ? t("reports.employees.allocation.overhead")
              : e.allocationStatus === "OVER_ALLOCATED"
                ? t("reports.employees.allocation.overAllocated")
                : e.allocationStatus === "FULLY_ALLOCATED"
                  ? t("reports.employees.allocation.fullyAllocated")
                  : t("reports.employees.allocation.underAllocated")}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) =>
          a.allocationStatus.localeCompare(b.allocationStatus),
        exportValue: (e) => e.allocationStatus,
        align: "center" as const,
      },
      {
        key: "totalAllocationPercentage",
        label: t("reports.employees.table.allocationPct"),
        render: (e) => (
          <span
            className={`text-sm font-semibold ${
              e.totalAllocationPercentage > 100
                ? "text-red-600"
                : e.totalAllocationPercentage >= 80
                  ? "text-green-600"
                  : "text-yellow-600"
            }`}
          >
            {e.totalAllocationPercentage}%
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          a.totalAllocationPercentage - b.totalAllocationPercentage,
        exportValue: (e) => `${e.totalAllocationPercentage}%`,
        align: "center" as const,
      },
      {
        key: "activeProjectCount",
        label: t("reports.employees.table.projects"),
        render: (e) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
            {e.activeProjectCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.activeProjectCount - b.activeProjectCount,
        exportValue: (e) => e.activeProjectCount,
        align: "center" as const,
      },
      {
        key: "employmentType",
        label: t("reports.employees.table.type"),
        render: (e) => (
          <span className="text-xs text-muted-foreground">
            {e.employmentType === "PERMANENT"
              ? t("reports.employees.byEmploymentType.permanent")
              : e.employmentType === "CONTRACT"
                ? t("reports.employees.byEmploymentType.contract")
                : e.employmentType === "FREELANCE"
                  ? t("reports.employees.byEmploymentType.freelance")
                  : e.employmentType === "PART_TIME"
                    ? t("reports.employees.byEmploymentType.partTime")
                    : e.employmentType}
          </span>
        ),
        exportValue: (e) => e.employmentType,
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  return (
    <ReportPageLayout
      title={t("reports.employees.assignment.title")}
      description={t("reports.employees.assignment.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.employees.kpi.totalEmployees")}
              value={summary.totalEmployees}
              icon={Users}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.overAllocated")}
              value={summary.overAllocatedCount}
              icon={AlertTriangle}
              variant={summary.overAllocatedCount > 0 ? "danger" : "success"}
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.fullyAllocated")}
              value={summary.fullyAllocatedCount}
              icon={CheckCircle2}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.underAllocated")}
              value={summary.underAllocatedCount}
              icon={TrendingUp}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.overhead")}
              value={summary.overheadCount}
              icon={UserX}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.avgAllocation")}
              value={`${summary.avgAllocationPercentage}%`}
              icon={Briefcase}
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
          searchPlaceholder={t("reports.employees.searchEmployee")}
          selectFilters={selectFilters}
        />
      }
    >
      <DataTable<EmployeeAssignmentItem>
        data={paginatedData}
        columns={columns}
        keyExtractor={(e) => e.employeeId}
        enableClientSorting
        enableExport
        exportFilename="employee_assignment_report"
        exportTitle={t("reports.employees.assignment.title")}
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
        emptyMessage={t("reports.employees.table.empty")}
      />
    </ReportPageLayout>
  );
};

export default EmployeeAssignmentReport;



