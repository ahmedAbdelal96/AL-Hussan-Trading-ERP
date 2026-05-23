/**
 * Audit Logs Page — Professional Activity Tracking
 *
 * Main orchestrator that composes:
 * - AuditMetricsCards  — 4 dashboard KPI cards
 * - AuditFilters       — Collapsible filter panel
 * - DataTable          — Paginated audit log table with export
 * - AuditDetailDialog  — Full details dialog (shadcn Dialog)
 *
 * Fixes over previous implementation:
 * - Removed console.log debug statement
 * - Status filter changed to single-select (matches backend API)
 * - getStatusBadge now uses i18n (was hardcoded Arabic)
 * - Custom div overlay replaced with Radix Dialog
 * - Added 4 new AuditAction enum values (RBAC)
 * - Added dashboard metrics cards
 * - Split 1500-line monolith into focused sub-components
 *
 * @version 2.0
 */

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Clock, Shield, Edit, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { useAuditLogs } from "@/hooks/useAudit";
import { useUsers } from "@/hooks/useUsers";
import { useLanguage } from "@/store/languageStore";
import { AuditAction, type AuditLogDto } from "@/types/audit.types";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

import {
  getActionIcon,
  getStatusBadge,
  getAuditTranslations,
} from "./audit/audit-helpers";
import AuditMetricsCards from "./audit/AuditMetricsCards";
import AuditFilters, { type AuditFiltersState } from "./audit/AuditFilters";
import AuditDetailDialog from "./audit/AuditDetailDialog";


export default function AuditLogsPage() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const t = useMemo(() => getAuditTranslations(isRTL), [isRTL]);

  // ── Filter state ──
  const [filters, setFilters] = useState<AuditFiltersState>({
    selectedActions: [],
    dateRange: {},
  });

  // ── Pagination ──
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  // ── Detail dialog ──
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // ── Data fetching ──
  const { data: auditLogsResponse, isLoading: auditLogsLoading } = useAuditLogs(
    {
      page: auditPage,
      limit: auditPageSize,
      userId: filters.selectedUserId,
      actions:
        filters.selectedActions.length > 0
          ? filters.selectedActions
          : undefined,
      status: filters.selectedStatus,
      resourceType: filters.selectedResourceType,
      startDate: filters.dateRange.startDate?.toISOString(),
      endDate: filters.dateRange.endDate?.toISOString(),
    },
  );

  const { data: allUsersResponse } = useUsers({});
  const allUsers = (allUsersResponse?.data || []) as Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;

  // ── Table columns ──
  const auditColumns: ColumnConfig<AuditLogDto>[] = useMemo(
    () => [
      {
        key: "createdAt",
        label: isRTL ? "التاريخ والوقت" : "Timestamp",
        render: (log) => (
          <span className="text-sm whitespace-normal">
            {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
          </span>
        ),
        exportValue: (log) =>
          format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        sortable: true,
        width: "150px",
      },
      {
        key: "userName",
        label: isRTL ? "المستخدم" : "User",
        render: (log) => (
          <div className="whitespace-normal min-w-[150px] max-w-[220px]">
            <div className="font-medium break-words">
              {log.userFullName || log.userEmail || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground break-all">
              {log.userEmail || ""}
            </div>
            <div className="text-xs text-muted-foreground">
              {log.ipAddress || "N/A"}
            </div>
          </div>
        ),
        exportValue: (log) => {
          const name = log.userFullName || log.userEmail || "";
          const email = log.userEmail || "";
          const ip = log.ipAddress || "";
          return [name, email, ip].filter(Boolean).join(" | ");
        },
        sortable: true,
        width: "220px",
      },
      {
        key: "action",
        label: isRTL ? "الإجراء" : "Action",
        render: (log) => (
          <div className="flex items-center gap-2 whitespace-normal">
            {getActionIcon(log.action)}
            <div className="flex flex-col">
              <span className="font-medium">
                {t.actions[log.action] || log.action}
              </span>
              {log.action === AuditAction.UPDATE &&
                log.changedFields &&
                log.changedFields.length > 0 && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Edit className="h-3 w-3" />
                    {log.changedFields.length} {isRTL ? "تغيير" : "change(s)"}
                  </span>
                )}
            </div>
          </div>
        ),
        exportValue: (log) => {
          const actionText = t.actions[log.action] || log.action;
          if (log.action === AuditAction.UPDATE && log.changedFields?.length) {
            return `${actionText} (${log.changedFields.length} changes)`;
          }
          return actionText;
        },
        sortable: true,
        width: "150px",
      },
      {
        key: "resourceType",
        label: isRTL ? "نوع المورد" : "Resource Type",
        render: (log) => (
          <div className="whitespace-normal">
            <Badge className={getStatusBadgeClass("neutral", "font-mono text-xs")}>
              {log.resourceType}
            </Badge>
            {log.resourceName && (
              <p className="text-xs text-muted-foreground mt-1 break-words">
                {log.resourceName}
              </p>
            )}
          </div>
        ),
        exportValue: (log) =>
          log.resourceName
            ? `${log.resourceType} - ${log.resourceName}`
            : log.resourceType,
        sortable: true,
        width: "150px",
      },
      {
        key: "status",
        label: isRTL ? "الحالة" : "Status",
        render: (log) => getStatusBadge(log.status, isRTL),
        exportValue: (log) => t.statuses[log.status] || log.status,
        align: "center",
        sortable: true,
        width: "110px",
      },
      {
        key: "actions",
        label: isRTL ? "إجراءات" : "Actions",
        render: (log) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedLog(log);
              setIsDetailsOpen(true);
            }}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {isRTL ? "عرض" : "View"}
          </Button>
        ),
        align: "center",
        width: "100px",
      },
    ],
    [isRTL, t],
  );

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        icon={<Clock className="h-5 w-5" />}
        actions={<Shield className="h-8 w-8 text-purple-500" />}
      />

      {/* Metrics Cards */}
      <AuditMetricsCards
        metrics={auditLogsResponse?.metrics}
        isLoading={auditLogsLoading}
        t={t}
      />

      {/* Filters */}
      <AuditFilters
        filters={filters}
        onFiltersChange={setFilters}
        onPageReset={() => setAuditPage(1)}
        users={allUsers}
        isRTL={isRTL}
        t={t}
      />

      {/* Records Count Summary */}
      {auditLogsResponse && (
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            {t.showing}{" "}
            <span className="font-medium text-foreground">
              {(auditPage - 1) * auditPageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-medium text-foreground">
              {Math.min(
                auditPage * auditPageSize,
                auditLogsResponse.pagination?.totalItems || 0,
              )}
            </span>{" "}
            {t.of}{" "}
            <span className="font-medium text-foreground">
              {auditLogsResponse.pagination?.totalItems || 0}
            </span>{" "}
            {t.records}
          </span>
        </div>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={auditLogsResponse?.logs || []}
            columns={auditColumns}
            isLoading={auditLogsLoading}
            emptyMessage={t.noLogs}
            pagination={{
              currentPage: auditPage,
              pageSize: auditPageSize,
              totalItems: auditLogsResponse?.pagination?.totalItems || 0,
              totalPages: auditLogsResponse?.pagination?.totalPages || 0,
            }}
            onPageChange={(page) => setAuditPage(page)}
            onPageSizeChange={(size) => {
              setAuditPageSize(size);
              setAuditPage(1);
            }}
            keyExtractor={(log) => log.id}
            enableExport
            exportFilename={`audit_logs_${
              filters.dateRange.startDate
                ? format(filters.dateRange.startDate, "yyyy-MM-dd")
                : "all"
            }_to_${
              filters.dateRange.endDate
                ? format(filters.dateRange.endDate, "yyyy-MM-dd")
                : "now"
            }`}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <AuditDetailDialog
        log={selectedLog}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        isRTL={isRTL}
        t={t}
      />
    </PageShell>
  );
}
