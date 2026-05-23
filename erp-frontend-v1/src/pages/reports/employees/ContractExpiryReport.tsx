/**
 * ============================================================================
 * CONTRACT EXPIRY REPORT
 * ============================================================================
 *
 * Report 9: Employees with contracts expiring soon.
 *
 * @page ContractExpiryReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  FileText,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  CalendarX,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
} from "@/components/reports/shared";
import { ReportSummaryStrip } from "@/components/common/ReportSummaryStrip";
import type { SelectFilterConfig } from "@/components/reports/shared";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  getStatusBadgeClass,
  type StatusTone,
} from "@/components/common/statusBadgeStyles";

import { useContractExpiry } from "@/hooks/reports/useEmployeesReport";

import type {
  ContractExpiryFilters,
  ContractExpiryItem,
} from "@/types/reports/employees.types";

import { useTranslation } from "@/i18n/useTranslation";

// ============ FILTER TYPES ============

interface LocalFilters {
  search?: string;
  urgency?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ============ HELPERS ============

const urgencyTone = (urgency: ContractExpiryItem["urgency"]): StatusTone => {
  if (urgency === "EXPIRED" || urgency === "CRITICAL") return "danger";
  if (urgency === "HIGH" || urgency === "MEDIUM") return "warning";
  if (urgency === "LOW") return "info";
  return "neutral";
};

const urgencyOrder: Record<ContractExpiryItem["urgency"], number> = {
  EXPIRED: 0,
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  NO_EXPIRY: 5,
};

// ============ PAGE COMPONENT ============

export const ContractExpiryReport: React.FC = () => {
  const { t } = useTranslation();

  const URGENCY_OPTIONS = useMemo(
    () => [
      {
        value: "EXPIRED",
        label: t("reports.employees.urgency.expired"),
      },
      {
        value: "CRITICAL",
        label: t("reports.employees.urgency.critical"),
      },
      {
        value: "HIGH",
        label: t("reports.employees.urgency.high"),
      },
      {
        value: "MEDIUM",
        label: t("reports.employees.urgency.medium"),
      },
      {
        value: "LOW",
        label: t("reports.employees.urgency.low"),
      },
    ],
    [t],
  );

  const SORT_OPTIONS = useMemo(
    () => [
      {
        value: "expiryDate",
        label: t("reports.employees.sort.expiryDate"),
      },
      {
        value: "employeeName",
        label: t("reports.employees.sort.name"),
      },
      {
        value: "urgency",
        label: t("reports.employees.sort.urgency"),
      },
    ],
    [t],
  );

  const ORDER_OPTIONS = useMemo(
    () => [
      {
        value: "asc",
        label: t("common.ascending"),
      },
      {
        value: "desc",
        label: t("common.descending"),
      },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- API filters ----
  const apiFilters = useMemo<ContractExpiryFilters>(
    () => ({
      ...(localFilters.urgency && {
        urgency: localFilters.urgency as ContractExpiryFilters["urgency"],
      }),
      ...(localFilters.sortBy && {
        sortBy: localFilters.sortBy as ContractExpiryFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useContractExpiry(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "urgency",
        label: t("reports.employees.filters.urgency"),
        placeholder: t("common.all"),
        options: URGENCY_OPTIONS,
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
    [t, URGENCY_OPTIONS, SORT_OPTIONS, ORDER_OPTIONS],
  );

  // ---- Client-side search ----
  const filteredData = useMemo(() => {
    let items = data?.contracts || [];
    if (localFilters.search) {
      const q = localFilters.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.employeeName.toLowerCase().includes(q) ||
          c.employeeNumber.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q),
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
  const columns: ColumnConfig<ContractExpiryItem>[] = useMemo(
    () => [
      {
        key: "employeeNumber",
        label: t("reports.employees.table.empNumber"),
        render: (c) => (
          <span className="font-mono text-xs font-medium">
            {c.employeeNumber}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeNumber.localeCompare(b.employeeNumber),
        exportValue: (c) => c.employeeNumber,
      },
      {
        key: "employeeName",
        label: t("reports.employees.table.employee"),
        render: (c) => (
          <div>
            <p className="font-medium text-sm">{c.employeeName}</p>
            <p className="text-xs text-muted-foreground">
              {c.department} - {c.position}
            </p>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeName.localeCompare(b.employeeName),
        exportValue: (c) => c.employeeName,
      },
      {
        key: "urgency",
        label: t("reports.employees.table.urgency"),
        render: (c) => (
          <Badge className={getStatusBadgeClass(urgencyTone(c.urgency))}>
            {c.urgency === "EXPIRED"
              ? t("reports.employees.urgency.expired")
              : c.urgency === "CRITICAL"
                ? t("reports.employees.urgency.critical")
                : c.urgency === "HIGH"
                  ? t("reports.employees.urgency.high")
                  : c.urgency === "MEDIUM"
                    ? t("reports.employees.urgency.medium")
                    : t("reports.employees.urgency.low")}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency],
        exportValue: (c) => c.urgency,
        align: "center" as const,
      },
      {
        key: "daysUntilExpiry",
        label: t("reports.employees.table.daysLeft"),
        render: (c) => (
          <span
            className={`text-sm font-semibold ${
              c.daysUntilExpiry === null
                ? "text-muted-foreground"
                : c.daysUntilExpiry < 0
                  ? "text-red-600"
                  : c.daysUntilExpiry <= 7
                    ? "text-red-600"
                    : c.daysUntilExpiry <= 30
                      ? "text-orange-600"
                      : "text-yellow-600"
            }`}
          >
            {c.daysUntilExpiry === null
              ? "-"
              : c.daysUntilExpiry < 0
                ? `${Math.abs(c.daysUntilExpiry)} ${t("common.days")} ${t("common.previous")}`
                : `${c.daysUntilExpiry} ${t("common.days")}`}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          (a.daysUntilExpiry ?? 9999) - (b.daysUntilExpiry ?? 9999),
        exportValue: (c) =>
          c.daysUntilExpiry !== null ? String(c.daysUntilExpiry) : "",
        align: "center" as const,
      },
      {
        key: "contractEndDate",
        label: t("reports.employees.table.expiryDate"),
        render: (c) =>
          c.contractEndDate ? (
            <span className="text-xs text-muted-foreground">
              {new Date(c.contractEndDate).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
        exportValue: (c) => c.contractEndDate ?? "",
        align: "center" as const,
      },
      {
        key: "contractType",
        label: t("reports.employees.table.contractType"),
        render: (c) => (
          <span className="text-xs text-muted-foreground">
            {c.contractType}
          </span>
        ),
        exportValue: (c) => c.contractType,
        align: "center" as const,
        hideMobile: true,
      },
      {
        key: "isRenewable",
        label: t("reports.employees.table.renewable"),
        render: (c) => (
          <Badge
            className={getStatusBadgeClass(
              c.isRenewable ? "success" : "neutral",
            )}
          >
            {c.isRenewable
              ? t("common.yes")
              : t("common.no")}
          </Badge>
        ),
        exportValue: (c) => (c.isRenewable ? "Yes" : "No"),
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  return (
    <ReportPageLayout
      title={t("reports.employees.contractExpiry.title")}
      description={t("reports.employees.contractExpiry.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      summaryStrip={
        filteredData.length > 0 && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.employees.kpi.totalContracts"),
                value: filteredData.length,
              },
              {
                label: t("reports.employees.kpi.expired"),
                value: filteredData.filter((c) => c.urgency === "EXPIRED")
                  .length,
                valueClassName:
                  filteredData.filter((c) => c.urgency === "EXPIRED").length > 0
                    ? "text-red-600"
                    : undefined,
              },
              {
                label: t("reports.employees.kpi.critical"),
                value: filteredData.filter((c) => c.urgency === "CRITICAL")
                  .length,
                valueClassName:
                  filteredData.filter((c) => c.urgency === "CRITICAL").length >
                  0
                    ? "text-red-600"
                    : undefined,
              },
              {
                label: t("reports.employees.kpi.high"),
                value: filteredData.filter((c) => c.urgency === "HIGH").length,
                valueClassName:
                  filteredData.filter((c) => c.urgency === "HIGH").length > 0
                    ? "text-amber-600"
                    : undefined,
              },
            ]}
          />
        )
      }
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.employees.kpi.totalContracts")}
              value={summary.totalContracts}
              icon={FileText}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.expired")}
              value={summary.expiredCount}
              icon={CalendarX}
              variant={summary.expiredCount > 0 ? "danger" : "success"}
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.critical")}
              value={summary.criticalCount}
              icon={AlertCircle}
              variant={summary.criticalCount > 0 ? "danger" : "success"}
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.high")}
              value={summary.highCount}
              icon={AlertTriangle}
              variant={summary.highCount > 0 ? "warning" : "success"}
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.medium")}
              value={summary.mediumCount}
              icon={Clock}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.employees.kpi.low")}
              value={summary.lowCount}
              icon={CheckCircle2}
              variant="success"
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
      <DataTable<ContractExpiryItem>
        data={paginatedData}
        columns={columns}
        keyExtractor={(c) => c.employeeId}
        enableClientSorting
        enableExport
        exportFilename="contract_expiry_report"
        exportTitle={t("reports.employees.contractExpiry.title")}
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

export default ContractExpiryReport;


