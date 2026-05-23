/**
 * Maintenance List Page Component
 *
 * Production-ready page for displaying maintenance requests with:
 * - Full theme integration (light/dark mode)
 * - Complete i18n support (Arabic/English)
 * - RTL support
 * - Advanced filtering and search
 * - Pagination
 * - Statistics cards
 * - Loading, error, and empty states
 * - Responsive design
 *
 * @component MaintenanceListPage
 * @version 1.0
 */

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { LayoutGrid, LayoutList, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { MaintenanceStatusBadge } from "@/features/maintenance/components/MaintenanceStatusBadge";
import { MaintenanceTypeBadge } from "@/features/maintenance/components/MaintenanceTypeBadge";
import { MaintenancePriorityBadge } from "@/features/maintenance/components/MaintenancePriorityBadge";
import { MaintenanceActions } from "@/features/maintenance/components/MaintenanceActions";
import { MaintenanceStats } from "@/features/maintenance/components/MaintenanceStats";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS } from "@/config/permissions.constants";
import {
  useMaintenanceList,
  useMaintenanceStatistics,
} from "@/hooks/useMaintenance";
import type {
  MaintenanceRequestEntity,
  MaintenanceFiltersDto,
} from "@/types/maintenance.types";
import { PaymentStatus } from "@/types/finance.types";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import { format } from "date-fns";

export const MaintenanceListPage = () => {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [filters, setFilters] = useState<MaintenanceFiltersDto>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error, refetch } = useMaintenanceList(filters);
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useMaintenanceStatistics();
  console.log("Maintenance List Data:", data);
  const PRIORITY_CONFIG = useMemo(
    () => [
      {
        key: "CRITICAL",
        label: t("maintenance.priority.CRITICAL", { defaultValue: "Critical" }),
        headerClass: "bg-[var(--error-bg)] border-[var(--border-subtle)]",
        dotClass: "bg-[var(--error)]",
      },
      {
        key: "HIGH",
        label: t("maintenance.priority.HIGH", { defaultValue: "High" }),
        headerClass: "bg-[var(--warning-bg)] border-[var(--border-subtle)]",
        dotClass: "bg-[var(--warning)]",
      },
      {
        key: "MEDIUM",
        label: t("maintenance.priority.MEDIUM", { defaultValue: "Medium" }),
        headerClass: "bg-[var(--warning-bg)]/70 border-[var(--border-subtle)]",
        dotClass: "bg-[var(--warning)]",
      },
      {
        key: "LOW",
        label: t("maintenance.priority.LOW", { defaultValue: "Low" }),
        headerClass:
          "bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)]",
        dotClass: "bg-[var(--text-tertiary)]",
      },
    ],
    [t],
  );

  const boardItems = useMemo(() => {
    const items = data?.data ?? [];
    return PRIORITY_CONFIG.map((p) => ({
      ...p,
      items: items.filter((m) => m.priority === p.key),
    }));
  }, [data?.data, PRIORITY_CONFIG]);

  const getFinanceBadgeConfig = (
    maintenance: MaintenanceRequestEntity,
  ): { label: string; className: string } | null => {
    const status = maintenance.financeCost?.paymentStatus as
      | PaymentStatus
      | undefined;

    if (!status) return null;

    if (status === PaymentStatus.REJECTED) {
      return {
        label: t("maintenance.financeBadge.rejected"),
        className: getStatusBadgeClass(getStatusTone(PaymentStatus.REJECTED)),
      };
    }

    if (status === PaymentStatus.PENDING) {
      return {
        label: t("maintenance.financeBadge.pending"),
        className: getStatusBadgeClass(getStatusTone(PaymentStatus.PENDING)),
      };
    }

    return {
      label: t("maintenance.financeBadge.approved"),
      className: getStatusBadgeClass(getStatusTone(PaymentStatus.APPROVED)),
    };
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  /**
   * Handle page size change
   */
  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  };

  /**
   * Column Configuration
   */
  const columns: ColumnConfig<MaintenanceRequestEntity>[] = [
    {
      key: "maintenanceNumber",
      label: t("maintenance.table.columns.maintenanceNumber"),
      render: (maintenance) => (
        <Link
          to={`/maintenance/${maintenance.id}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {maintenance.maintenanceNumber}
        </Link>
      ),
      align: "start",
      exportValue: (m) => m.maintenanceNumber,
    },
    {
      key: "asset",
      label: t("maintenance.table.columns.asset"),
      render: (maintenance) => (
        <div className="flex flex-col">
          <span className="font-medium text-[var(--text-primary)]">
            {maintenance.asset?.name || maintenance.assetId}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {maintenance.asset?.assetNumber || "-"}
          </span>
        </div>
      ),
      exportValue: (m) => m.asset?.name || "-",
    },
    {
      key: "title",
      label: t("maintenance.form.fields.title"),
      render: (maintenance) => (
        <span className="text-sm">{maintenance.title}</span>
      ),
      exportValue: (m) => m.title,
    },
    {
      key: "maintenanceType",
      label: t("maintenance.table.columns.type"),
      render: (maintenance) => (
        <MaintenanceTypeBadge type={maintenance.maintenanceType} />
      ),
      exportValue: (m) => t(`maintenance.type.${m.maintenanceType}`),
    },
    {
      key: "priority",
      label: t("maintenance.table.columns.priority"),
      render: (maintenance) => (
        <MaintenancePriorityBadge priority={maintenance.priority} showIcon />
      ),
      exportValue: (m) => t(`maintenance.priority.${m.priority}`),
    },
    {
      key: "status",
      label: t("maintenance.table.columns.status"),
      render: (maintenance) => (
        <MaintenanceStatusBadge status={maintenance.status} />
      ),
      exportValue: (m) => t(`maintenance.status.${m.status}`),
    },
    {
      key: "financeStatus",
      label: t("maintenance.table.columns.financeStatus"),
      render: (maintenance) => {
        const badge = getFinanceBadgeConfig(maintenance);
        return badge ? (
          <Badge className={badge.className}>{badge.label}</Badge>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)]">-</span>
        );
      },
      exportValue: (m) => getFinanceBadgeConfig(m)?.label || "-",
    },
    /*     {
      key: "scheduledDate",
      label: t("maintenance.table.columns.scheduledDate"),
      render: (maintenance) => (
        <span className="text-sm">{formatDate(maintenance.scheduledDate)}</span>
      ),
      exportValue: (m) => formatDate(m.scheduledDate),
    }, */
    /*   {
      key: "estimatedCost",
      label: t("maintenance.table.columns.estimatedCost"),
      render: (maintenance) => (
        <span className="text-sm font-medium">
          {formatCurrency(maintenance.estimatedCost)}
        </span>
      ),
      align: "end",
      exportValue: (m) => m.estimatedCost?.toString() || "0",
    }, */
    /*     {
      key: "assignedTo",
      label: t("maintenance.table.columns.assignedTo"),
      render: (maintenance) => (
        <span className="text-sm">
          {maintenance.assignedUser
            ? `${maintenance.assignedUser.firstName} ${maintenance.assignedUser.lastName}`
            : "-"}
        </span>
      ),
      exportValue: (m) =>
        m.assignedUser
          ? `${m.assignedUser.firstName} ${m.assignedUser.lastName}`
          : "-",
    }, */
    {
      key: "actions",
      label: t("maintenance.table.columns.actions"),
      render: (maintenance) => <MaintenanceActions maintenance={maintenance} />,
      align: "center",
      exportValue: () => "",
    },
  ];

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("maintenance.list.title")}
        description={t("maintenance.list.description")}
        actions={
          <>
            <div className="flex rounded-[var(--radius-md)] border border-[var(--border-subtle)] overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-[var(--primary-main)] text-[var(--text-on-brand)]"
                    : "bg-[var(--bg-surface-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                {t("common.table", { defaultValue: "Table" })}
              </button>
              <button
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "board"
                    ? "bg-[var(--primary-main)] text-[var(--text-on-brand)]"
                    : "bg-[var(--bg-surface-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {t("maintenance.urgencyBoard", { defaultValue: "Board" })}
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                refetchStats();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("maintenance.actions.refresh")}
            </Button>
            <PermissionGate permissions={[PERMISSIONS.MAINTENANCE_WRITE]}>
              <Button asChild>
                <Link to="/maintenance/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("maintenance.actions.create")}
                </Link>
              </Button>
            </PermissionGate>
          </>
        }
      />

      {/* Statistics Cards */}
      <MaintenanceStats
        totalRequests={statsData?.totalRequests}
        pendingRequests={statsData?.pendingRequests}
        inProgressRequests={statsData?.inProgressRequests}
        completedRequests={statsData?.completedRequests}
        isLoading={statsLoading}
      />

      {/* Table or Urgency Board */}
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          pagination={
            data
              ? {
                  currentPage: data.page,
                  pageSize: data.limit,
                  totalItems: data.total,
                  totalPages: Math.ceil(data.total / data.limit),
                }
              : undefined
          }
          isLoading={isLoading}
          error={error}
          emptyMessage={t("maintenance.list.empty")}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          exportFilename={`maintenance-requests-${format(
            new Date(),
            "yyyy-MM-dd",
          )}`}
        />
      ) : (
        /* Urgency Board â€” groups loaded items by priority */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {boardItems.map((lane) => (
            <div
              key={lane.key}
              className={`rounded-md border ${lane.headerClass} overflow-hidden`}
            >
              <div
                className={`flex items-center gap-2 px-3 py-2 border-b ${lane.headerClass}`}
              >
                <span
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${lane.dotClass}`}
                />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {lane.label}
                </span>
                <span className="ms-auto text-xs font-bold text-[var(--text-tertiary)]">
                  {lane.items.length}
                </span>
              </div>
              <div className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface-primary)]">
                {isLoading ? (
                  <div className="px-3 py-4 text-xs text-[var(--text-tertiary)] text-center">
                    {t("common.loading", { defaultValue: "Loading..." })}
                  </div>
                ) : lane.items.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-[var(--text-tertiary)] text-center">
                    {t("maintenance.list.empty", { defaultValue: "No items" })}
                  </div>
                ) : (
                  lane.items.map((m) => (
                    <Link
                      key={m.id}
                      to={`/maintenance/${m.id}`}
                      className="block px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-[var(--text-tertiary)]">
                            {m.maintenanceNumber}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {m.title}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)] truncate">
                            {m.asset?.name}
                          </p>
                        </div>
                        <MaintenanceStatusBadge status={m.status} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default MaintenanceListPage;
