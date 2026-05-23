/**
 * ============================================================================
 * USERS RBAC REPORT
 * ============================================================================
 *
 * Consolidates: RolesPermissions + AuditLogs + PermissionGrantHistory
 *

 * @page UsersRBACReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Shield,
  Key,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DonutChart from "@/components/charts-apex/DonutChart";
import BarChart from "@/components/charts-apex/BarChart";

import {
  useUserRolesPermissions,
  useAuditLogs,
  usePermissionGrantHistory,
} from "@/hooks/reports/useUsersReport";

import type {
  RoleDistribution,
  UserRoleDetail,
  UserCustomPermissionDetail,
  AuditLogDetail,
  ActionDistribution,
  GrantHistoryDetail,
  MostGranted,
  AdminGrantingActivity,
} from "@/types/reports/users.types";

import { useTranslation } from "@/i18n/useTranslation";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";


const ACTION_COLORS: Record<string, string> = {
  CREATE: "#10b981",
  UPDATE: "#3b82f6",
  DELETE: "#ef4444",
  VIEW: "#6b7280",
  EXPORT: "#8b5cf6",
  IMPORT: "#06b6d4",
  LOGIN: "#10b981",
  LOGOUT: "#64748b",
  APPROVE: "#22c55e",
  REJECT: "#f97316",
  RESTORE: "#14b8a6",
};

const ROLE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ef4444",
  "#6b7280",
];

const getActionTone = (action: string) => {
  switch (action.toUpperCase()) {
    case "CREATE":
    case "APPROVE":
    case "GRANT":
      return "success";
    case "UPDATE":
    case "VIEW":
    case "EXPORT":
    case "IMPORT":
      return "info";
    case "DELETE":
    case "REVOKE":
    case "REJECT":
      return "danger";
    case "LOGIN":
    case "LOGOUT":
    case "RESTORE":
      return "neutral";
    default:
      return "neutral";
  }
};


interface RBACFilters {
  startDate?: string;
  endDate?: string;
}

type RbacTableKey =
  | "roleDist"
  | "userRoles"
  | "customPerms"
  | "audit"
  | "grantsHistory"
  | "mostGranted"
  | "adminActivity";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const UsersRBACReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<RBACFilters>({});
  const [tablePages, setTablePages] = useState<Record<RbacTableKey, number>>({
    roleDist: 1,
    userRoles: 1,
    customPerms: 1,
    audit: 1,
    grantsHistory: 1,
    mostGranted: 1,
    adminActivity: 1,
  });
  const [tablePageSizes, setTablePageSizes] = useState<
    Record<RbacTableKey, number>
  >({
    roleDist: DEFAULT_PAGE_SIZE,
    userRoles: DEFAULT_PAGE_SIZE,
    customPerms: DEFAULT_PAGE_SIZE,
    audit: DEFAULT_PAGE_SIZE,
    grantsHistory: DEFAULT_PAGE_SIZE,
    mostGranted: DEFAULT_PAGE_SIZE,
    adminActivity: DEFAULT_PAGE_SIZE,
  });

 
  const apiFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters],
  );

  const rbac = useUserRolesPermissions({
    ...apiFilters,
    includeCustomPermissions: true,
    includeTemporary: true,
    includeRoleDistribution: true,
  });

  const audit = useAuditLogs({
    ...apiFilters,
    page: tablePages.audit,
    limit: tablePageSizes.audit,
    includeActionDistribution: true,
    includeResourceDistribution: true,
    includeUserActivity: true,
  });

  const grants = usePermissionGrantHistory({
    ...apiFilters,
    page: tablePages.grantsHistory,
    limit: tablePageSizes.grantsHistory,
    includeMostGranted: true,
    includeAdminActivity: true,
  });

  const isLoading = rbac.isLoading || audit.isLoading || grants.isLoading;
  const error = rbac.error || audit.error || grants.error;
  const hasData = !!(rbac.data || audit.data || grants.data);

  const handleRefresh = useCallback(() => {
    rbac.refetch();
    audit.refetch();
    grants.refetch();
  }, [rbac, audit, grants]);

  const paginateTable = useCallback(
    <T,>(rows: T[] | undefined, key: RbacTableKey) => {
      const safeRows = rows || [];
      const pageSize = tablePageSizes[key];
      const currentPage = tablePages[key];
      const start = (currentPage - 1) * pageSize;
      const pagedRows = safeRows.slice(start, start + pageSize);
      return {
        rows: pagedRows,
        pagination: {
          currentPage,
          pageSize,
          totalItems: safeRows.length,
          totalPages: Math.max(1, Math.ceil(safeRows.length / pageSize)),
        },
      };
    },
    [tablePageSizes, tablePages],
  );

  const pagedRoleDist = useMemo(
    () => paginateTable(rbac.data?.roleDistribution, "roleDist"),
    [paginateTable, rbac.data?.roleDistribution],
  );
  const pagedUserRoles = useMemo(
    () => paginateTable(rbac.data?.userRoles, "userRoles"),
    [paginateTable, rbac.data?.userRoles],
  );
  const pagedCustomPerms = useMemo(
    () => paginateTable(rbac.data?.customPermissions, "customPerms"),
    [paginateTable, rbac.data?.customPermissions],
  );
  const pagedGrantHistory = useMemo(
    () => paginateTable(grants.data?.history, "grantsHistory"),
    [grants.data?.history, paginateTable],
  );
  const pagedMostGranted = useMemo(
    () => paginateTable(grants.data?.mostGranted, "mostGranted"),
    [grants.data?.mostGranted, paginateTable],
  );
  const pagedAdminActivity = useMemo(
    () => paginateTable(grants.data?.adminActivity, "adminActivity"),
    [grants.data?.adminActivity, paginateTable],
  );


  const roleDistColumns: ColumnConfig<RoleDistribution>[] = useMemo(
    () => [
      {
        key: "roleName",
        label: t("reports.users.rbac.roleName"),
        sortable: true,
        sortFn: (a, b) => a.roleName.localeCompare(b.roleName),
        exportValue: (row) => row.roleName,
        align: "start" as const,
      },
      {
        key: "usersCount",
        label: t("reports.users.rbac.usersCount"),
        sortable: true,
        sortFn: (a, b) => a.usersCount - b.usersCount,
        render: (row) => row.usersCount.toLocaleString(),
        exportValue: (row) => row.usersCount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.users.rbac.share"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
      {
        key: "isSystemRole",
        label: t("reports.users.rbac.system"),
        sortable: true,
        sortFn: (a, b) => Number(b.isSystemRole) - Number(a.isSystemRole),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              row.isSystemRole ? "info" : "neutral",
            )}
          >
            {row.isSystemRole
              ? t("reports.users.rbac.systemRole")
              : t("reports.users.rbac.customRole")}
          </Badge>
        ),
        exportValue: (row) =>
          row.isSystemRole
            ? t("reports.users.rbac.systemRole")
            : t("reports.users.rbac.customRole"),
        align: "center" as const,
      },
    ],
    [t],
  );

  const userRoleColumns: ColumnConfig<UserRoleDetail>[] = useMemo(
    () => [
      {
        key: "roleName",
        label: t("reports.users.rbac.roleName"),
        sortable: true,
        sortFn: (a, b) => a.roleName.localeCompare(b.roleName),
        exportValue: (row) => row.roleName,
        align: "start" as const,
      },
      {
        key: "roleSlug",
        label: t("reports.users.rbac.slug"),
        sortable: true,
        sortFn: (a, b) => a.roleSlug.localeCompare(b.roleSlug),
        exportValue: (row) => row.roleSlug,
        align: "start" as const,
      },
      {
        key: "isTemporary",
        label: t("reports.users.rbac.temporary"),
        sortable: true,
        sortFn: (a, b) => Number(b.isTemporary) - Number(a.isTemporary),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              row.isTemporary ? "warning" : "success",
            )}
          >
            {row.isTemporary
              ? t("reports.users.rbac.temp")
              : t("reports.users.rbac.perm")}
          </Badge>
        ),
        exportValue: (row) => (row.isTemporary ? "Temp" : "Perm"),
        align: "center" as const,
      },
      {
        key: "grantedAt",
        label: t("reports.users.rbac.grantedAt"),
        sortable: true,
        sortFn: (a, b) => a.grantedAt.localeCompare(b.grantedAt),
        render: (row) => new Date(row.grantedAt).toLocaleDateString(),
        exportValue: (row) => row.grantedAt,
        align: "center" as const,
      },
      {
        key: "grantedByEmail",
        label: t("reports.users.rbac.grantedBy"),
        sortable: true,
        sortFn: (a, b) => a.grantedByEmail.localeCompare(b.grantedByEmail),
        exportValue: (row) => row.grantedByEmail,
        align: "start" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  const permColumns: ColumnConfig<UserCustomPermissionDetail>[] = useMemo(
    () => [
      {
        key: "permissionName",
        label: t("reports.users.rbac.permName"),
        sortable: true,
        sortFn: (a, b) => a.permissionName.localeCompare(b.permissionName),
        exportValue: (row) => row.permissionName,
        align: "start" as const,
      },
      {
        key: "resource",
        label: t("reports.users.rbac.resource"),
        sortable: true,
        sortFn: (a, b) => a.resource.localeCompare(b.resource),
        exportValue: (row) => row.resource,
        align: "start" as const,
      },
      {
        key: "action",
        label: t("reports.users.rbac.action"),
        sortable: true,
        sortFn: (a, b) => a.action.localeCompare(b.action),
        exportValue: (row) => row.action,
        align: "start" as const,
      },
      {
        key: "permissionType",
        label: t("reports.users.rbac.type"),
        sortable: true,
        sortFn: (a, b) => a.permissionType.localeCompare(b.permissionType),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              row.permissionType === "GRANT" ? "success" : "danger",
            )}
          >
            {row.permissionType}
          </Badge>
        ),
        exportValue: (row) => row.permissionType,
        align: "center" as const,
      },
      {
        key: "grantedByEmail",
        label: t("reports.users.rbac.grantedBy"),
        sortable: true,
        sortFn: (a, b) => a.grantedByEmail.localeCompare(b.grantedByEmail),
        exportValue: (row) => row.grantedByEmail,
        align: "start" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  const auditColumns: ColumnConfig<AuditLogDetail>[] = useMemo(
    () => [
      {
        key: "action",
        label: t("reports.users.audit.action"),
        sortable: true,
        sortFn: (a, b) => a.action.localeCompare(b.action),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getActionTone(row.action))}>
            {row.action}
          </Badge>
        ),
        exportValue: (row) => row.action,
        align: "center" as const,
      },
      {
        key: "resourceType",
        label: t("reports.users.audit.resource"),
        sortable: true,
        sortFn: (a, b) =>
          (a.resourceType || "").localeCompare(b.resourceType || ""),
        render: (row) =>
          row.resourceType || t("common.notAvailable"),
        exportValue: (row) =>
          row.resourceType || t("common.notAvailable"),
        align: "start" as const,
      },
      {
        key: "status",
        label: t("reports.users.audit.status"),
        sortable: true,
        sortFn: (a, b) => a.status.localeCompare(b.status),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getStatusTone(row.status))}>
            {row.status}
          </Badge>
        ),
        exportValue: (row) => row.status,
        align: "center" as const,
      },
      {
        key: "userEmail",
        label: t("reports.users.audit.user"),
        sortable: true,
        sortFn: (a, b) => (a.userEmail || "").localeCompare(b.userEmail || ""),
        render: (row) =>
          row.userEmail || t("common.notAvailable"),
        exportValue: (row) =>
          row.userEmail || t("common.notAvailable"),
        align: "start" as const,
      },
      {
        key: "createdAt",
        label: t("reports.users.audit.date"),
        sortable: true,
        sortFn: (a, b) => a.createdAt.localeCompare(b.createdAt),
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
        exportValue: (row) => row.createdAt,
        align: "center" as const,
      },
      {
        key: "ipAddress",
        label: t("reports.users.audit.ip"),
        sortable: true,
        sortFn: (a, b) => (a.ipAddress || "").localeCompare(b.ipAddress || ""),
        render: (row) =>
          row.ipAddress || t("common.notAvailable"),
        exportValue: (row) =>
          row.ipAddress || t("common.notAvailable"),
        align: "start" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  const grantColumns: ColumnConfig<GrantHistoryDetail>[] = useMemo(
    () => [
      {
        key: "action",
        label: t("reports.users.grants.action"),
        sortable: true,
        sortFn: (a, b) => a.action.localeCompare(b.action),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getActionTone(row.action))}>
            {row.action}
          </Badge>
        ),
        exportValue: (row) => row.action,
        align: "center" as const,
      },
      {
        key: "targetType",
        label: t("reports.users.grants.targetType"),
        sortable: true,
        sortFn: (a, b) => a.targetType.localeCompare(b.targetType),
        exportValue: (row) => row.targetType,
        align: "center" as const,
      },
      {
        key: "targetName",
        label: t("reports.users.grants.target"),
        sortable: true,
        sortFn: (a, b) => a.targetName.localeCompare(b.targetName),
        exportValue: (row) => row.targetName,
        align: "start" as const,
      },
      {
        key: "userEmail",
        label: t("reports.users.grants.user"),
        sortable: true,
        sortFn: (a, b) => a.userEmail.localeCompare(b.userEmail),
        exportValue: (row) => row.userEmail,
        align: "start" as const,
      },
      {
        key: "isTemporary",
        label: t("reports.users.grants.temp"),
        sortable: true,
        sortFn: (a, b) => Number(b.isTemporary) - Number(a.isTemporary),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              row.isTemporary ? "warning" : "success",
            )}
          >
            {row.isTemporary
              ? t("reports.users.rbac.temp")
              : t("reports.users.rbac.perm")}
          </Badge>
        ),
        exportValue: (row) => (row.isTemporary ? "Temp" : "Perm"),
        align: "center" as const,
      },
      {
        key: "createdAt",
        label: t("reports.users.grants.date"),
        sortable: true,
        sortFn: (a, b) => a.createdAt.localeCompare(b.createdAt),
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
        exportValue: (row) => row.createdAt,
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  const mostGrantedColumns: ColumnConfig<MostGranted>[] = useMemo(
    () => [
      {
        key: "targetType",
        label: t("reports.users.grants.targetType"),
        sortable: true,
        sortFn: (a, b) => a.targetType.localeCompare(b.targetType),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              row.targetType === "ROLE" ? "info" : "neutral",
            )}
          >
            {row.targetType}
          </Badge>
        ),
        exportValue: (row) => row.targetType,
        align: "center" as const,
      },
      {
        key: "targetName",
        label: t("reports.users.grants.target"),
        sortable: true,
        sortFn: (a, b) => a.targetName.localeCompare(b.targetName),
        exportValue: (row) => row.targetName,
        align: "start" as const,
      },
      {
        key: "grantCount",
        label: t("reports.users.grants.grantCount"),
        sortable: true,
        sortFn: (a, b) => a.grantCount - b.grantCount,
        render: (row) => row.grantCount.toLocaleString(),
        exportValue: (row) => row.grantCount,
        align: "end" as const,
      },
    ],
    [t],
  );

  const adminColumns: ColumnConfig<AdminGrantingActivity>[] = useMemo(
    () => [
      {
        key: "adminFullName",
        label: t("reports.users.grants.adminName"),
        sortable: true,
        sortFn: (a, b) => a.adminFullName.localeCompare(b.adminFullName),
        exportValue: (row) => row.adminFullName,
        align: "start" as const,
      },
      {
        key: "adminEmail",
        label: t("reports.users.grants.adminEmail"),
        sortable: true,
        sortFn: (a, b) => a.adminEmail.localeCompare(b.adminEmail),
        exportValue: (row) => row.adminEmail,
        align: "start" as const,
      },
      {
        key: "totalGrants",
        label: t("reports.users.grants.total"),
        sortable: true,
        sortFn: (a, b) => a.totalGrants - b.totalGrants,
        render: (row) => row.totalGrants.toLocaleString(),
        exportValue: (row) => row.totalGrants,
        align: "end" as const,
      },
      {
        key: "grantCount",
        label: t("reports.users.grants.grants"),
        sortable: true,
        sortFn: (a, b) => a.grantCount - b.grantCount,
        render: (row) => (
          <span className="text-green-600">{row.grantCount}</span>
        ),
        exportValue: (row) => row.grantCount,
        align: "end" as const,
      },
      {
        key: "revokeCount",
        label: t("reports.users.grants.revokes"),
        sortable: true,
        sortFn: (a, b) => a.revokeCount - b.revokeCount,
        render: (row) => (
          <span className="text-red-500">{row.revokeCount}</span>
        ),
        exportValue: (row) => row.revokeCount,
        align: "end" as const,
      },
    ],
    [t],
  );

  const roleChartData = useMemo(() => {
    const bk = rbac.data?.roleDistribution || [];
    return {
      labels: bk.map((r) => r.roleName),
      series: bk.map((r) => r.usersCount),
      colors: bk.map((_, i) => ROLE_COLORS[i % ROLE_COLORS.length]),
    };
  }, [rbac.data]);

  const actionChartData = useMemo(() => {
    const bk = (audit.data?.actionDistribution || []) as ActionDistribution[];
    return {
      categories: bk.map((a) => a.action),
      series: [
        {
          name: t("reports.users.audit.count"),
          data: bk.map((a) => a.count),
        },
      ],
      colors: bk.map((a) => ACTION_COLORS[a.action] || "#6b7280"),
    };
  }, [audit.data, t]);

  const rm = rbac.data?.metrics;
  const am = audit.data?.metrics;
  const gm = grants.data?.metrics;

  return (
    <ReportPageLayout
      title={t("reports.users.rbac.title")}
      description={t("reports.users.rbac.description")}
      borderColor="purple"
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      filters={
        <ReportFilters<RBACFilters>
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            setTablePages({
              roleDist: 1,
              userRoles: 1,
              customPerms: 1,
              audit: 1,
              grantsHistory: 1,
              mostGranted: 1,
              adminActivity: 1,
            });
          }}
          dateFilters={[
            { key: "startDate", label: t("reports.common.startDate") },
            { key: "endDate", label: t("reports.common.endDate") },
          ]}
          showReset
        />
      }
    >
      <Tabs defaultValue="rbac" className="w-full">
        <TabsList>
          <TabsTrigger value="rbac">
            <Shield className="h-4 w-4 me-1" />
            {t("reports.users.rbac.tab")}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 me-1" />
            {t("reports.users.audit.tab")}
          </TabsTrigger>
          <TabsTrigger value="grants">
            <Key className="h-4 w-4 me-1" />
            {t("reports.users.grants.tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rbac" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.users.rbac.totalRoles")}
              value={rm?.totalRoles ?? 0}
              icon={Shield}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.users.rbac.totalPermissions")}
              value={rm?.totalPermissions ?? 0}
              icon={Key}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.users.rbac.customPerms")}
              value={rm?.usersWithCustomPermissions ?? 0}
              icon={Users}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.users.rbac.tempGrants")}
              value={rm?.activeTemporaryGrants ?? 0}
              icon={Clock}
              variant="purple"
            />
          </div>

          {/* Chart */}
          <ReportChartCard title={t("reports.users.rbac.roleChart")}>
            {roleChartData.series.length > 0 ? (
              <DonutChart
                labels={roleChartData.labels}
                series={roleChartData.series}
                colors={roleChartData.colors}
                height={300}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>

          {/* Tables */}
          <Tabs defaultValue="roleDist">
            <TabsList>
              <TabsTrigger value="roleDist">
                {t("reports.users.rbac.roleDistTab")}
              </TabsTrigger>
              <TabsTrigger value="userRoles">
                {t("reports.users.rbac.userRolesTab")}
              </TabsTrigger>
              <TabsTrigger value="customPerms">
                {t("reports.users.rbac.customPermsTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roleDist">
              <DataTable<RoleDistribution>
                data={pagedRoleDist.rows}
                columns={roleDistColumns}
                keyExtractor={(item) => item.roleId}
                pagination={pagedRoleDist.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, roleDist: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    roleDist: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, roleDist: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={rbac.isLoading}
                enableExport
                exportFilename="role-distribution"
              />
            </TabsContent>

            <TabsContent value="userRoles">
              <DataTable<UserRoleDetail>
                data={pagedUserRoles.rows}
                columns={userRoleColumns}
                keyExtractor={(item) => `${item.roleId}-${item.grantedAt}`}
                pagination={pagedUserRoles.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, userRoles: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    userRoles: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, userRoles: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={rbac.isLoading}
                enableExport
                exportFilename="user-roles"
              />
            </TabsContent>

            <TabsContent value="customPerms">
              <DataTable<UserCustomPermissionDetail>
                data={pagedCustomPerms.rows}
                columns={permColumns}
                keyExtractor={(item) => item.permissionId}
                pagination={pagedCustomPerms.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, customPerms: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    customPerms: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, customPerms: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={rbac.isLoading}
                enableExport
                exportFilename="custom-permissions"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.users.audit.totalLogs")}
              value={am?.totalLogs ?? 0}
              icon={FileText}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.users.audit.successful")}
              value={am?.successfulActions ?? 0}
              icon={CheckCircle2}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.users.audit.failed")}
              value={am?.failedActions ?? 0}
              icon={AlertTriangle}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.users.audit.successRate")}
              value={`${(am?.successRate ?? 0).toFixed(1)}%`}
              icon={Activity}
              variant="info"
            />
          </div>

          {/* Chart */}
          <ReportChartCard title={t("reports.users.audit.actionChart")}>
            {actionChartData.categories.length > 0 ? (
              <BarChart
                categories={actionChartData.categories}
                series={actionChartData.series}
                height={300}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>

          {/* Paginated audit logs table */}
          <DataTable<AuditLogDetail>
            data={audit.data?.logs || []}
            columns={auditColumns}
            keyExtractor={(item) => item.id}
            pagination={{
              currentPage: audit.data?.pagination?.page || tablePages.audit,
              pageSize: audit.data?.pagination?.limit || tablePageSizes.audit,
              totalItems: audit.data?.pagination?.totalItems || 0,
              totalPages: audit.data?.pagination?.totalPages || 1,
            }}
            onPageChange={(nextPage) =>
              setTablePages((prev) => ({ ...prev, audit: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTablePageSizes((prev) => ({ ...prev, audit: nextPageSize }));
              setTablePages((prev) => ({ ...prev, audit: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={audit.isLoading}
            enableExport
            exportFilename="audit-logs"
          />
        </TabsContent>

        <TabsContent value="grants" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.users.grants.totalGrants")}
              value={gm?.totalGrants ?? 0}
              icon={Key}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.users.grants.grantActions")}
              value={gm?.grantCount ?? 0}
              icon={CheckCircle2}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.users.grants.revokeActions")}
              value={gm?.revokeCount ?? 0}
              icon={AlertTriangle}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.users.grants.tempActive")}
              value={gm?.temporaryGrantsActive ?? 0}
              icon={Clock}
              variant="warning"
            />
          </div>

          {/* Tables */}
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">
                {t("reports.users.grants.historyTab")}
              </TabsTrigger>
              <TabsTrigger value="mostGranted">
                {t("reports.users.grants.mostGrantedTab")}
              </TabsTrigger>
              <TabsTrigger value="adminActivity">
                {t("reports.users.grants.adminTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <DataTable<GrantHistoryDetail>
                data={pagedGrantHistory.rows}
                columns={grantColumns}
                keyExtractor={(item) => item.id}
                pagination={pagedGrantHistory.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, grantsHistory: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    grantsHistory: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, grantsHistory: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={grants.isLoading}
                enableExport
                exportFilename="grant-history"
              />
            </TabsContent>

            <TabsContent value="mostGranted">
              <DataTable<MostGranted>
                data={pagedMostGranted.rows}
                columns={mostGrantedColumns}
                keyExtractor={(item) => item.targetId}
                pagination={pagedMostGranted.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, mostGranted: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    mostGranted: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, mostGranted: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={grants.isLoading}
                enableExport
                exportFilename="most-granted"
              />
            </TabsContent>

            <TabsContent value="adminActivity">
              <DataTable<AdminGrantingActivity>
                data={pagedAdminActivity.rows}
                columns={adminColumns}
                keyExtractor={(item) => item.adminId}
                pagination={pagedAdminActivity.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, adminActivity: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    adminActivity: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, adminActivity: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={grants.isLoading}
                enableExport
                exportFilename="admin-grant-activity"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default UsersRBACReport;

