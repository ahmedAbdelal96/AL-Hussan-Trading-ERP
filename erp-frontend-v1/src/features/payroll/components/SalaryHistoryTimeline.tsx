/**
 * ============================================================================
 * SALARY HISTORY TABLE COMPONENT
 * ============================================================================
 *
 * Displays salary change history in a paginated data table
 *
 * Features:
 * - Server-side pagination for large datasets
 * - Sortable columns (date, amount, percentage)
 * - Visual indicators for raises (green) vs. reductions (red)
 * - Shows before/after salary amounts with change percentage
 * - Displays who made the change and when
 * - Shows reason for each change if provided
 * - Loading and error states
 * - Empty state when no history available
 * - Responsive design with mobile optimization
 * - Export to Excel/PDF support
 *
 * Data Displayed:
 * - Date and time of change
 * - Who made the change (user name)
 * - Type of change (raise/reduction)
 * - Before and after salary amounts
 * - Change amount and percentage
 * - Reason for change
 * - Source of change (MANUAL, EMPLOYEE_UPDATE, BULK_UPDATE, MIGRATION)
 *
 * Performance:
 * - Server-side pagination (20 items per page by default)
 * - Lazy loads data only when employee ID provided
 * - Caches with 30-second stale time
 *
 * @component
 * @example
 * ```tsx
 * <SalaryHistoryTimeline employeeId={employeeId} />
 * ```
 */

import { useState } from "react";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useSalaryHistory } from "@/hooks/useEmployees";
import type { SalaryHistoryEntity } from "@/types/employees.types";
import { formatDate, formatNumber } from "@/lib/utils";
import { CURRENCY } from "@/config/system.constants";

interface SalaryHistoryTimelineProps {
  employeeId?: string;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Expandable reason cell component
 */
function ReasonCell({ reason }: { reason?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  if (!reason) {
    return <span className="text-[var(--icon-tertiary)] text-sm">—</span>;
  }

  const isLong = reason.length > 50;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
      >
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <span>{t("payroll.salary.reason", { defaultValue: "السبب" })}</span>
      </button>
      {expanded && (
        <p className="rounded border bg-[var(--surface-secondary)] p-2 text-sm text-[var(--text-secondary)]">
          {reason}
        </p>
      )}
      {!expanded && isLong && (
        <p className="text-xs text-[var(--text-tertiary)]">{reason.substring(0, 50)}...</p>
      )}
    </div>
  );
}

/**
 * Salary History Timeline Component
 *
 * Displays salary change history in a paginated table with sorting and filtering
 *
 * Features:
 * - Server-side pagination (20 items per page by default)
 * - Sortable columns
 * - Visual indicators for raises/reductions
 * - Expandable reason cells
 * - Export support (Excel/PDF)
 * - Loading, error, and empty states
 * - Mobile responsive
 */
export const SalaryHistoryTimeline = ({
  employeeId,
  pageSize: initialPageSize = 20,
  enabled = true,
}: SalaryHistoryTimelineProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const {
    data: historyData,
    isLoading,
    error,
  } = useSalaryHistory(employeeId, page, pageSize, { enabled });

  // Define table columns
  const columns: ColumnConfig<SalaryHistoryEntity>[] = [
    {
      key: "changedAt",
      label: t("payroll.salary.date", { defaultValue: "التاريخ" }),
      sortable: true,
      render: (entry) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-sm">{formatDate(entry.changedAt)}</span>
        </div>
      ),
      exportValue: (entry) => formatDate(entry.changedAt),
    },
    {
      key: "type",
      label: t("payroll.salary.type", { defaultValue: "النوع" }),
      align: "center",
      render: (entry) => {
        const isRaise =
          entry.isRaise ?? entry.baseSalaryAfter > entry.baseSalaryBefore;
        return (
          <div className="flex items-center justify-center">
            {isRaise ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t("payroll.salary.increase", { defaultValue: "زيادة" })}
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {t("payroll.salary.decrease", { defaultValue: "تخفيض" })}
              </Badge>
            )}
          </div>
        );
      },
      exportValue: (entry) =>
        (entry.isRaise ?? entry.baseSalaryAfter > entry.baseSalaryBefore)
          ? t("payroll.salary.increase", { defaultValue: "زيادة" })
          : t("payroll.salary.decrease", { defaultValue: "تخفيض" }),
    },
    {
      key: "baseSalaryBefore",
      label: `${t("payroll.salary.from", { defaultValue: "من" })} (${CURRENCY.DEFAULT})`,
      align: "end",
      sortable: true,
      render: (entry) => (
        <span className="font-semibold text-[var(--text-primary)]">
          {formatNumber(entry.baseSalaryBefore)}
        </span>
      ),
      exportValue: (entry) => entry.baseSalaryBefore,
    },
    {
      key: "baseSalaryAfter",
      label: `${t("payroll.salary.to", { defaultValue: "إلى" })} (${CURRENCY.DEFAULT})`,
      align: "end",
      sortable: true,
      render: (entry) => (
        <span className="font-semibold text-[var(--text-primary)]">
          {formatNumber(entry.baseSalaryAfter)}
        </span>
      ),
      exportValue: (entry) => entry.baseSalaryAfter,
    },
    {
      key: "change",
      label: `${t("payroll.salary.change", { defaultValue: "التغيير" })} (${CURRENCY.DEFAULT})`,
      align: "end",
      sortable: true,
      render: (entry) => {
        const isRaise =
          entry.isRaise ?? entry.baseSalaryAfter > entry.baseSalaryBefore;
        return (
          <div
            className={`text-sm font-semibold ${isRaise ? "text-green-700" : "text-red-700"}`}
          >
            <div>
              {isRaise ? "+" : ""}
              {formatNumber(entry.changeAmount ?? 0)}
            </div>
            <div className="text-xs">
              ({isRaise ? "+" : ""}
              {(entry.changePercentage ?? 0).toFixed(2)}%)
            </div>
          </div>
        );
      },
      exportValue: (entry) => entry.changeAmount ?? 0,
    },
    {
      key: "changedBy",
      label: t("payroll.salary.changedBy", { defaultValue: "بواسطة" }),
      hideMobile: true,
      render: (entry) =>
        entry.changedByUser ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-sm">
              {entry.changedByUser.firstName} {entry.changedByUser.lastName}
            </span>
          </div>
        ) : (
          <span className="text-[var(--icon-tertiary)] text-sm">—</span>
        ),
      exportValue: (entry) =>
        entry.changedByUser
          ? `${entry.changedByUser.firstName} ${entry.changedByUser.lastName}`
          : "",
    },
    {
      key: "source",
      label: t("payroll.salary.sourceLabel", { defaultValue: "المصدر" }),
      hideMobile: true,
      render: (entry) => (
        <Badge variant="outline" className="text-xs">
          {t(`payroll.salary.source.${entry.source}`, {
            defaultValue: entry.source,
          })}
        </Badge>
      ),
      exportValue: (entry) =>
        t(`payroll.salary.source.${entry.source}`, {
          defaultValue: entry.source,
        }),
    },
    {
      key: "reason",
      label: t("payroll.salary.reason", { defaultValue: "السبب" }),
      hideMobile: true,
      render: (entry) => <ReasonCell reason={entry.reason ?? undefined} />,
      exportValue: (entry) => entry.reason ?? "",
    },
  ];

  if (!employeeId) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)]">
        <p className="text-sm">
          {t("common.noSelection", { defaultValue: "لم يتم تحديد موظف" })}
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={historyData?.data ?? []}
      keyExtractor={(entry) => entry.id}
      isLoading={isLoading}
      error={error ? new Error(error.message) : null}
      emptyMessage={t("payroll.salary.noHistory", {
        defaultValue: "لا يوجد سجل تغييرات في الراتب",
      })}
      // Pagination
      pagination={{
        currentPage: page,
        totalPages: historyData?.meta?.totalPages ?? 1,
        pageSize: pageSize,
        totalItems: historyData?.meta?.totalItems ?? 0,
      }}
      onPageChange={setPage}
      onPageSizeChange={(newSize) => {
        setPageSize(newSize);
        setPage(1); // Reset to first page when changing page size
      }}
      // Export configuration
      exportFilename={t("payroll.salary.historyExportFileName", {
        defaultValue: "تاريخ_الراتب",
      })}
      // Table styling
      className="mt-4"
    />
  );
};


