/**
 * ============================================================================
 * FINANCE PENDING & OVERDUE REPORT
 * ============================================================================
 *
 * Consolidates: PendingApprovals + OverduePayments in a single tabbed page.
 *
 * Design decisions:
 *   - Server-side pagination: both endpoints return { data[], meta{} }
 *   - Each tab has its own independent page/filter state
 *   - KPI summary cards above each tab's table
 *   - Urgency badge for daysWaiting / daysOverdue thresholds
 *
 * Lessons applied from Projects Pilot:
 *   ✅ All translated maps inside useMemo
 *   ✅ Numbers → align:"end" | Badges → align:"center" | Text → align:"start"
 *   ✅ exportValue on every JSX column
 *   ✅ Server-side pagination (data can be large — no upper bound)
 *
 * @page FinancePendingOverdueReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  FileText,
  TrendingDown,
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
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

// Data hooks
import { useFinanceReport } from "@/hooks/reports/useFinanceReport";

// Types
import type {
  PendingCostDetail,
  OverduePaymentDetail,
  PendingApprovalsResponse,
  OverduePaymentsResponse,
} from "@/types/reports/finance.types";

// i18n
import { useTranslation } from "@/i18n/useTranslation";

// ============ CONSTANTS ============

/** Days thresholds for urgency badges */
const PENDING_URGENCY = { LOW: 7, MEDIUM: 14, HIGH: 21 } as const;
const OVERDUE_URGENCY = { LOW: 7, MEDIUM: 30, HIGH: 60 } as const;

const pendingUrgencyClass = (days: number): string => {
  if (days >= PENDING_URGENCY.HIGH) return getStatusBadgeClass(getStatusTone("CRITICAL"), "tabular-nums");
  if (days >= PENDING_URGENCY.MEDIUM) return getStatusBadgeClass(getStatusTone("HIGH"), "tabular-nums");
  if (days >= PENDING_URGENCY.LOW) return getStatusBadgeClass(getStatusTone("PENDING"), "tabular-nums");
  return getStatusBadgeClass(getStatusTone("ACTIVE"), "tabular-nums");
};

const overdueUrgencyClass = (days: number): string => {
  if (days >= OVERDUE_URGENCY.HIGH) return getStatusBadgeClass(getStatusTone("OVERDUE"), "tabular-nums");
  if (days >= OVERDUE_URGENCY.MEDIUM) return getStatusBadgeClass(getStatusTone("HIGH"), "tabular-nums");
  return getStatusBadgeClass(getStatusTone("PENDING"), "tabular-nums");
};

// ============ FILTER TYPES ============

interface PendingFilters {
  costType?: string;
  search?: string;
}

interface OverdueFilters {
  costType?: string;
  search?: string;
}

// ============ COST TYPE OPTIONS (static enum values) ============

const COST_TYPE_VALUES = [
  "MAINTENANCE",
  "PURCHASE",
  "SALARY",
  "ALLOWANCE",
  "FUEL",
  "MATERIAL",
  "EQUIPMENT_RENTAL",
  "SUBCONTRACTOR",
  "UTILITY",
  "TRANSPORTATION",
  "INSURANCE",
  "TAX",
  "OTHER",
] as const;

// ============ COMPONENT ============

export const FinancePendingOverdueReport: React.FC = () => {
  const { t } = useTranslation();

  // ---- Per-tab pagination state (independent) ----
  const [pendingPage, setPendingPage] = useState(1);
  const [overdуePage, setOverduePage] = useState(1);
  const PAGE_SIZE = 15;

  // ---- Per-tab filter state ----
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>({});
  const [overdueFilters, setOverdueFilters] = useState<OverdueFilters>({});

  // ---- Translated cost type map (reactive) ----
  const COST_TYPE_OPTIONS = useMemo(
    () =>
      COST_TYPE_VALUES.map((v) => ({
        value: v,
        label: t(`finance.costTypes.${v}`, { defaultValue: v }),
      })),
    [t],
  );

  // ---- Filter configs ----
  const costTypeSelectFilter: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "costType",
        label: t("reports.finance.filters.costType"),
        placeholder: t("reports.finance.filters.allTypes"),
        options: COST_TYPE_OPTIONS,
        width: "w-[180px]",
      },
    ],
    [t, COST_TYPE_OPTIONS],
  );

  // ---- API params ----
  const pendingApiFilters = useMemo(
    () => ({
      costType: pendingFilters.costType,
    }),
    [pendingFilters.costType],
  );

  const overdueApiFilters = useMemo(
    () => ({
      costType: overdueFilters.costType,
    }),
    [overdueFilters.costType],
  );

  // ---- Data fetching (server-side pagination) ----
  const pendingQuery = useFinanceReport<"pending-approvals">({
    endpoint: "pending-approvals",
    filters: pendingApiFilters,
    pagination: { page: pendingPage, limit: PAGE_SIZE },
  });

  const overdueQuery = useFinanceReport<"overdue-payments">({
    endpoint: "overdue-payments",
    filters: overdueApiFilters,
    pagination: { page: overdуePage, limit: PAGE_SIZE },
  });

  const handleRefresh = useCallback(() => {
    pendingQuery.refetch();
    overdueQuery.refetch();
  }, [pendingQuery, overdueQuery]);

  // ---- Filter change handlers (reset page on filter change) ----
  const handlePendingFilterChange = useCallback((f: PendingFilters) => {
    setPendingFilters(f);
    setPendingPage(1);
  }, []);

  const handleOverdueFilterChange = useCallback((f: OverdueFilters) => {
    setOverdueFilters(f);
    setOverduePage(1);
  }, []);

  // ---- Client-side search on current page data ----
  const pendingData = useMemo(() => {
    const items = (pendingQuery.data as PendingApprovalsResponse)?.data ?? [];
    if (!pendingFilters.search) return items;
    const q = pendingFilters.search.toLowerCase();
    return items.filter(
      (i) =>
        i.projectName.toLowerCase().includes(q) ||
        (i.invoiceNumber ?? "").toLowerCase().includes(q),
    );
  }, [pendingQuery.data, pendingFilters.search]);

  const overdueData = useMemo(() => {
    const items = (overdueQuery.data as OverduePaymentsResponse)?.data ?? [];
    if (!overdueFilters.search) return items;
    const q = overdueFilters.search.toLowerCase();
    return items.filter(
      (i) =>
        i.projectName.toLowerCase().includes(q) ||
        (i.invoiceNumber ?? "").toLowerCase().includes(q),
    );
  }, [overdueQuery.data, overdueFilters.search]);

  // ---- Pending table columns ----
  const pendingColumns: ColumnConfig<PendingCostDetail>[] = useMemo(
    () => [
      {
        key: "projectName",
        label: t("reports.finance.table.projectName"),
        render: (i) => (
          <span className="font-medium text-sm">{i.projectName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (i) => i.projectName,
        align: "start" as const,
      },
      {
        key: "costTypeName",
        label: t("reports.finance.costType"),
        render: (i) => (
          <Badge
            className={getStatusBadgeClass(
              "neutral",
              "text-xs font-medium whitespace-nowrap",
            )}
          >
            {i.costTypeName}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.costTypeName.localeCompare(b.costTypeName),
        exportValue: (i) => i.costTypeName,
        align: "center" as const,
      },
      {
        key: "amount",
        label: t("reports.finance.amount"),
        render: (i) => {
          const currency = CURRENCY.DEFAULT;
          return (
            <span className="font-mono text-sm font-semibold" dir="ltr">
              {currency} {i.amount.toLocaleString("en-US")}
            </span>
          );
        },
        sortable: true,
        sortFn: (a, b) => a.amount - b.amount,
        exportValue: (i) => i.amount,
        align: "end" as const,
      },
      {
        key: "daysWaiting",
        label: t("reports.finance.daysWaiting"),
        render: (i) => (
          <Badge className={pendingUrgencyClass(i.daysWaiting)}>
            {i.daysWaiting}d
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.daysWaiting - b.daysWaiting,
        exportValue: (i) => i.daysWaiting,
        align: "center" as const,
      },
      {
        key: "transactionDate",
        label: t("reports.finance.table.transactionDate"),
        render: (i) => (
          <span className="text-sm text-muted-foreground">
            {new Date(i.transactionDate).toLocaleDateString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          new Date(a.transactionDate).getTime() -
          new Date(b.transactionDate).getTime(),
        exportValue: (i) => new Date(i.transactionDate).toLocaleDateString(),
        align: "center" as const,
        hidden: true,
      },
      {
        key: "invoiceNumber",
        label: t("reports.finance.invoice"),
        render: (i) => (
          <span className="text-xs font-mono text-muted-foreground">
            {i.invoiceNumber ?? "—"}
          </span>
        ),
        sortable: false,
        exportValue: (i) => i.invoiceNumber ?? "",
        align: "center" as const,
        hidden: true,
      },
      {
        key: "createdBy",
        label: t("reports.finance.table.createdBy"),
        render: (i) => <span className="text-sm">{i.createdBy}</span>,
        sortable: true,
        sortFn: (a, b) => a.createdBy.localeCompare(b.createdBy, "ar"),
        exportValue: (i) => i.createdBy,
        align: "start" as const,
        hidden: true,
      },
    ],
    [t, pendingQuery.data],
  );

  // ---- Overdue table columns ----
  const overdueColumns: ColumnConfig<OverduePaymentDetail>[] = useMemo(
    () => [
      {
        key: "projectName",
        label: t("reports.finance.table.projectName"),
        render: (i) => (
          <span className="font-medium text-sm">{i.projectName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectName.localeCompare(b.projectName, "ar"),
        exportValue: (i) => i.projectName,
        align: "start" as const,
      },
      {
        key: "costTypeName",
        label: t("reports.finance.costType"),
        render: (i) => (
          <Badge
            className={getStatusBadgeClass(
              "neutral",
              "text-xs font-medium whitespace-nowrap",
            )}
          >
            {i.costTypeName}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.costTypeName.localeCompare(b.costTypeName),
        exportValue: (i) => i.costTypeName,
        align: "center" as const,
      },
      {
        key: "amount",
        label: t("reports.finance.amount"),
        render: (i) => {
          const currency = CURRENCY.DEFAULT;
          return (
            <span
              className="font-mono text-sm font-semibold text-destructive"
              dir="ltr"
            >
              {currency} {i.amount.toLocaleString("en-US")}
            </span>
          );
        },
        sortable: true,
        sortFn: (a, b) => a.amount - b.amount,
        exportValue: (i) => i.amount,
        align: "end" as const,
      },
      {
        key: "daysOverdue",
        label: t("reports.finance.daysOverdue"),
        render: (i) => (
          <Badge className={overdueUrgencyClass(i.daysOverdue)}>
            {i.daysOverdue}d
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.daysOverdue - b.daysOverdue,
        exportValue: (i) => i.daysOverdue,
        align: "center" as const,
      },
      {
        key: "transactionDate",
        label: t("reports.finance.table.transactionDate"),
        render: (i) => (
          <span className="text-sm text-muted-foreground">
            {new Date(i.transactionDate).toLocaleDateString()}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          new Date(a.transactionDate).getTime() -
          new Date(b.transactionDate).getTime(),
        exportValue: (i) => new Date(i.transactionDate).toLocaleDateString(),
        align: "center" as const,
        hidden: true,
      },
      {
        key: "invoiceNumber",
        label: t("reports.finance.invoice"),
        render: (i) => (
          <span className="text-xs font-mono text-muted-foreground">
            {i.invoiceNumber ?? "—"}
          </span>
        ),
        sortable: false,
        exportValue: (i) => i.invoiceNumber ?? "",
        align: "center" as const,
        hidden: true,
      },
      {
        key: "description",
        label: t("reports.finance.description"),
        render: (i) => (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {i.description ?? "—"}
          </span>
        ),
        sortable: false,
        exportValue: (i) => i.description ?? "",
        align: "start" as const,
        hidden: true,
      },
    ],
    [t, overdueQuery.data],
  );

  // ---- Server response helpers ----
  const pendingResp = pendingQuery.data as PendingApprovalsResponse | undefined;
  const overdueResp = overdueQuery.data as OverduePaymentsResponse | undefined;
  const pendingMeta = pendingResp?.meta;
  const overdueMeta = overdueResp?.meta;
  const pendingSumm = pendingResp?.summary;
  const overdueSumm = overdueResp?.summary;
  const currency = CURRENCY.DEFAULT;

  const isLoading = pendingQuery.isLoading && overdueQuery.isLoading;
  const error = pendingQuery.error || overdueQuery.error || null;

  // ============ RENDER ============

  return (
    <ReportPageLayout
      title={t("reports.finance.pendingOverdue.title")}
      description={t("reports.finance.pendingOverdue.description")}
      borderColor="warning"
      isLoading={isLoading}
      error={error as Error | null}
      hasData={!!(pendingResp || overdueResp)}
      onRefresh={handleRefresh}
      generatedAt={pendingResp?.generatedAt ?? overdueResp?.generatedAt}
    >
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("reports.finance.tabs.pending")}
            {pendingSumm && (
              <Badge
                className={getStatusBadgeClass(
                  getStatusTone("PENDING"),
                  "ms-1 px-2 py-0.5 text-xs font-semibold",
                )}
              >
                {pendingSumm.count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t("reports.finance.tabs.overdue")}
            {overdueSumm && (
              <Badge
                className={getStatusBadgeClass(
                  getStatusTone("OVERDUE"),
                  "ms-1 px-2 py-0.5 text-xs font-semibold",
                )}
              >
                {overdueSumm.count}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== TAB 1: PENDING APPROVALS ===== */}
        <TabsContent value="pending" className="space-y-4 mt-0">
          {/* KPI cards for pending tab */}
          {pendingSumm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ReportMetricCard
                label={t("reports.finance.totalPending")}
                value={pendingSumm.totalPending}
                currency={currency}
                icon={DollarSign}
                variant="warning"
              />
              <ReportMetricCard
                label={t("reports.finance.kpi.pendingCount")}
                value={pendingSumm.count}
                icon={FileText}
                variant="warning"
              />
              <ReportMetricCard
                label={t("reports.finance.kpi.oldestDays")}
                value={pendingSumm.oldestDays}
                icon={Calendar}
                variant={
                  pendingSumm.oldestDays >= PENDING_URGENCY.HIGH
                    ? "danger"
                    : "warning"
                }
              />
              <ReportMetricCard
                label={t("reports.finance.avgWaiting")}
                value={Math.round(pendingSumm.avgDaysWaiting)}
                icon={Clock}
                variant="info"
              />
            </div>
          )}

          {/* Filters for pending tab */}
          <ReportFilters
            filters={pendingFilters}
            onFilterChange={handlePendingFilterChange}
            searchKey="search"
            searchPlaceholder={t("reports.finance.searchPlaceholder")}
            selectFilters={costTypeSelectFilter}
          />

          {/* Pending table */}
          <DataTable<PendingCostDetail>
            data={pendingData}
            columns={pendingColumns}
            keyExtractor={(i) => i.id}
            enableClientSorting
            enableExport
            exportFilename="finance_pending_approvals"
            exportTitle={t("reports.finance.pendingApprovals.title")}
            enableCompactMode
            pagination={
              pendingMeta
                ? {
                    currentPage: pendingMeta.currentPage,
                    totalPages: pendingMeta.totalPages,
                    totalItems: pendingMeta.totalItems,
                    pageSize: pendingMeta.itemsPerPage,
                  }
                : undefined
            }
            onPageChange={setPendingPage}
            emptyMessage={t("reports.finance.table.empty")}
            isLoading={pendingQuery.isFetching && !pendingQuery.data}
          />
        </TabsContent>

        {/* ===== TAB 2: OVERDUE PAYMENTS ===== */}
        <TabsContent value="overdue" className="space-y-4 mt-0">
          {/* KPI cards for overdue tab */}
          {overdueSumm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ReportMetricCard
                label={t("reports.finance.totalOverdue")}
                value={overdueSumm.totalOverdue}
                currency={currency}
                icon={TrendingDown}
                variant="danger"
              />
              <ReportMetricCard
                label={t("reports.finance.kpi.overdueCount")}
                value={overdueSumm.count}
                icon={AlertTriangle}
                variant="danger"
              />
              <ReportMetricCard
                label={t("reports.finance.kpi.maxDaysOverdue")}
                value={overdueSumm.maxDaysOverdue}
                icon={Calendar}
                variant="danger"
              />
              <ReportMetricCard
                label={t("reports.finance.avgOverdue")}
                value={Math.round(overdueSumm.avgDaysOverdue)}
                icon={Clock}
                variant="warning"
              />
            </div>
          )}

          {/* Filters for overdue tab */}
          <ReportFilters
            filters={overdueFilters}
            onFilterChange={handleOverdueFilterChange}
            searchKey="search"
            searchPlaceholder={t("reports.finance.searchPlaceholder")}
            selectFilters={costTypeSelectFilter}
          />

          {/* Overdue table */}
          <DataTable<OverduePaymentDetail>
            data={overdueData}
            columns={overdueColumns}
            keyExtractor={(i) => i.id}
            enableClientSorting
            enableExport
            exportFilename="finance_overdue_payments"
            exportTitle={t("reports.finance.overduePayments.title")}
            enableCompactMode
            pagination={
              overdueMeta
                ? {
                    currentPage: overdueMeta.currentPage,
                    totalPages: overdueMeta.totalPages,
                    totalItems: overdueMeta.totalItems,
                    pageSize: overdueMeta.itemsPerPage,
                  }
                : undefined
            }
            onPageChange={setOverduePage}
            emptyMessage={t("reports.finance.table.empty")}
            isLoading={overdueQuery.isFetching && !overdueQuery.data}
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default FinancePendingOverdueReport;


