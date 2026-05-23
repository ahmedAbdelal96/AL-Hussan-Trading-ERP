/**
 * ============================================================================
 * USERS SECURITY DASHBOARD REPORT
 * ============================================================================
 *
 * Consolidates: Overview + LoginActivity + FailedLogins + ActiveSessions + LockedAccounts
 *
 * Layout:
 *   1. Filters bar  (date range)
 *   3. Charts       (DonutChart: role dist | AreaChart: login trend)
 *   4. Tabbed tables (Login Activity / Failed Logins / Sessions / Locked)
 *
 * @page UsersSecurityDashboardReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Users,
  UserCheck,
  ShieldAlert,
  Lock,
  Activity,
  AlertTriangle,
  Monitor,
  TrendingUp,
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
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

import DonutChart from "@/components/charts-apex/DonutChart";
import AreaChart from "@/components/charts-apex/AreaChart";

import {
  useUsersOverview,
  useLoginActivity,
  useFailedLoginAttempts,
  useActiveSessions,
  useLockedAccounts,
} from "@/hooks/reports/useUsersReport";

import type {
  RoleDistributionItem,
  UserLoginDetail,
  UserFailedLogin,
  SuspiciousIp,
  UserActiveSession,
  LockedAccountDetail,
} from "@/types/reports/users.types";

import { useTranslation } from "@/i18n/useTranslation";

const getLockTone = (lockStatus: string) => {
  switch (lockStatus) {
    case "none":
      return "success" as const;
    case "at_risk":
      return "warning" as const;
    case "temporarily_locked":
      return "accent" as const;
    case "permanently_locked":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

const getRiskTone = (riskLevel: string) => {
  switch (riskLevel) {
    case "low":
      return "success" as const;
    case "medium":
      return "warning" as const;
    case "high":
      return "accent" as const;
    case "critical":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

const ROLE_CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ef4444",
  "#6b7280",
];

interface SecurityFilters {
  startDate?: string;
  endDate?: string;
}

type SecurityTableKey =
  | "loginActive"
  | "loginInactive"
  | "roleDistribution"
  | "failedAtRisk"
  | "failedIps"
  | "sessions"
  | "locked";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const UsersSecurityDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<SecurityFilters>({});
  const [tablePages, setTablePages] = useState<Record<SecurityTableKey, number>>({
    loginActive: 1,
    loginInactive: 1,
    roleDistribution: 1,
    failedAtRisk: 1,
    failedIps: 1,
    sessions: 1,
    locked: 1,
  });
  const [tablePageSizes, setTablePageSizes] = useState<
    Record<SecurityTableKey, number>
  >({
    loginActive: DEFAULT_PAGE_SIZE,
    loginInactive: DEFAULT_PAGE_SIZE,
    roleDistribution: DEFAULT_PAGE_SIZE,
    failedAtRisk: DEFAULT_PAGE_SIZE,
    failedIps: DEFAULT_PAGE_SIZE,
    sessions: DEFAULT_PAGE_SIZE,
    locked: DEFAULT_PAGE_SIZE,
  });

  const LOCK_MAP = useMemo(
    () => ({
      none: t("reports.users.lockStatus.none"),
      at_risk: t("reports.users.lockStatus.atRisk"),
      temporarily_locked: t("reports.users.lockStatus.tempLocked"),
      permanently_locked: t("reports.users.lockStatus.permLocked"),
    }),
    [t],
  );

  const RISK_MAP = useMemo(
    () => ({
      low: t("reports.users.risk.low"),
      medium: t("reports.users.risk.medium"),
      high: t("reports.users.risk.high"),
      critical: t("reports.users.risk.critical"),
    }),
    [t],
  );

  const apiFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters],
  );

  const overview = useUsersOverview({
    ...apiFilters,
    includeRoleDistribution: true,
    includeLockedAccounts: true,
  });
  const loginActivity = useLoginActivity({
    ...apiFilters,
    includeTrend: true,
    includePeakHours: true,
  });
  const failedLogins = useFailedLoginAttempts({
    ...apiFilters,
    includeAtRiskUsers: true,
    includeIpAnalysis: true,
    includeRecentlyLocked: true,
  });
  const sessions = useActiveSessions({
    ...apiFilters,
    includeDeviceAnalysis: true,
  });
  const locked = useLockedAccounts({
    ...apiFilters,
    includeUnlockHistory: true,
    includeTrends: true,
  });

  const isLoading =
    overview.isLoading ||
    loginActivity.isLoading ||
    failedLogins.isLoading ||
    sessions.isLoading ||
    locked.isLoading;
  const error =
    overview.error ||
    loginActivity.error ||
    failedLogins.error ||
    sessions.error ||
    locked.error;
  const hasData = !!(
    overview.data ||
    loginActivity.data ||
    failedLogins.data ||
    sessions.data ||
    locked.data
  );

  const handleRefresh = useCallback(() => {
    overview.refetch();
    loginActivity.refetch();
    failedLogins.refetch();
    sessions.refetch();
    locked.refetch();
  }, [overview, loginActivity, failedLogins, sessions, locked]);

  const kpi = overview.data?.kpis;
  const lockStats = overview.data?.lockStatistics;

  const roleColumns: ColumnConfig<RoleDistributionItem>[] = useMemo(
    () => [
      {
        key: "roleName",
        label: t("reports.users.roles.name"),
        sortable: true,
        sortFn: (a, b) => a.roleName.localeCompare(b.roleName),
        exportValue: (row) => row.roleName,
        align: "start" as const,
      },
      {
        key: "usersCount",
        label: t("reports.users.roles.count"),
        sortable: true,
        sortFn: (a, b) => a.usersCount - b.usersCount,
        render: (row) => row.usersCount.toLocaleString(),
        exportValue: (row) => row.usersCount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.users.roles.share"),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        render: (row) => `${row.percentage.toFixed(1)}%`,
        exportValue: (row) => row.percentage,
        align: "end" as const,
      },
    ],
    [t],
  );

  const loginColumns: ColumnConfig<UserLoginDetail>[] = useMemo(
    () => [
      {
        key: "fullName",
        label: t("reports.users.login.name"),
        sortable: true,
        sortFn: (a, b) => a.fullName.localeCompare(b.fullName),
        exportValue: (row) => row.fullName,
        align: "start" as const,
      },
      {
        key: "email",
        label: t("reports.users.login.email"),
        sortable: true,
        sortFn: (a, b) => a.email.localeCompare(b.email),
        exportValue: (row) => row.email,
        align: "start" as const,
      },
      {
        key: "loginCount",
        label: t("reports.users.login.count"),
        sortable: true,
        sortFn: (a, b) => a.loginCount - b.loginCount,
        render: (row) => row.loginCount.toLocaleString(),
        exportValue: (row) => row.loginCount,
        align: "end" as const,
      },
      {
        key: "failedAttempts",
        label: t("reports.users.login.failed"),
        sortable: true,
        sortFn: (a, b) => a.failedAttempts - b.failedAttempts,
        render: (row) =>
          row.failedAttempts > 0 ? (
            <span className="text-red-500 font-medium">
              {row.failedAttempts}
            </span>
          ) : (
            <span>0</span>
          ),
        exportValue: (row) => row.failedAttempts,
        align: "end" as const,
      },
      {
        key: "lastLoginAt",
        label: t("reports.users.login.lastLogin"),
        sortable: true,
        sortFn: (a, b) =>
          (a.lastLoginAt || "").localeCompare(b.lastLoginAt || ""),
        render: (row) =>
          row.lastLoginAt
            ? new Date(row.lastLoginAt).toLocaleDateString()
            : t("common.notAvailable"),
        exportValue: (row) =>
          row.lastLoginAt || t("common.notAvailable"),
        align: "center" as const,
      },
      {
        key: "isActive",
        label: t("reports.users.login.status"),
        sortable: true,
        sortFn: (a, b) => Number(b.isActive) - Number(a.isActive),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              getStatusTone(row.isActive ? "ACTIVE" : "INACTIVE"),
            )}
          >
            {row.isActive
              ? t("reports.users.active")
              : t("reports.users.inactive")}
          </Badge>
        ),
        exportValue: (row) =>
          row.isActive
            ? t("reports.users.active")
            : t("reports.users.inactive"),
        align: "center" as const,
      },
    ],
    [t],
  );

  const failedLoginColumns: ColumnConfig<UserFailedLogin>[] = useMemo(
    () => [
      {
        key: "fullName",
        label: t("reports.users.failedLogins.name"),
        sortable: true,
        sortFn: (a, b) => a.fullName.localeCompare(b.fullName),
        exportValue: (row) => row.fullName,
        align: "start" as const,
      },
      {
        key: "email",
        label: t("reports.users.failedLogins.email"),
        sortable: true,
        sortFn: (a, b) => a.email.localeCompare(b.email),
        exportValue: (row) => row.email,
        align: "start" as const,
      },
      {
        key: "currentFailedAttempts",
        label: t("reports.users.failedLogins.attempts"),
        sortable: true,
        sortFn: (a, b) => a.currentFailedAttempts - b.currentFailedAttempts,
        render: (row) => (
          <span className="text-red-500 font-bold">
            {row.currentFailedAttempts}
          </span>
        ),
        exportValue: (row) => row.currentFailedAttempts,
        align: "end" as const,
      },
      {
        key: "lockStatus",
        label: t("reports.users.failedLogins.lockStatus"),
        sortable: true,
        sortFn: (a, b) => a.lockStatus.localeCompare(b.lockStatus),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getLockTone(row.lockStatus))}>
            {LOCK_MAP[row.lockStatus as keyof typeof LOCK_MAP] ||
              row.lockStatus}
          </Badge>
        ),
        exportValue: (row) =>
          LOCK_MAP[row.lockStatus as keyof typeof LOCK_MAP] || row.lockStatus,
        align: "center" as const,
      },
      {
        key: "lastFailedLoginAt",
        label: t("reports.users.failedLogins.lastFailed"),
        sortable: true,
        sortFn: (a, b) =>
          (a.lastFailedLoginAt || "").localeCompare(b.lastFailedLoginAt || ""),
        render: (row) =>
          row.lastFailedLoginAt
            ? new Date(row.lastFailedLoginAt).toLocaleDateString()
            : t("common.notAvailable"),
        exportValue: (row) =>
          row.lastFailedLoginAt || t("common.notAvailable"),
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t, LOCK_MAP],
  );

  const ipColumns: ColumnConfig<SuspiciousIp>[] = useMemo(
    () => [
      {
        key: "ipAddress",
        label: t("reports.users.failedLogins.ip"),
        sortable: true,
        sortFn: (a, b) => a.ipAddress.localeCompare(b.ipAddress),
        exportValue: (row) => row.ipAddress,
        align: "start" as const,
      },
      {
        key: "failedAttempts",
        label: t("reports.users.failedLogins.attempts"),
        sortable: true,
        sortFn: (a, b) => a.failedAttempts - b.failedAttempts,
        render: (row) => (
          <span className="text-red-500 font-bold">{row.failedAttempts}</span>
        ),
        exportValue: (row) => row.failedAttempts,
        align: "end" as const,
      },
      {
        key: "uniqueUsersTargeted",
        label: t("reports.users.failedLogins.targetedUsers"),
        sortable: true,
        sortFn: (a, b) => a.uniqueUsersTargeted - b.uniqueUsersTargeted,
        render: (row) => row.uniqueUsersTargeted.toLocaleString(),
        exportValue: (row) => row.uniqueUsersTargeted,
        align: "end" as const,
      },
      {
        key: "riskLevel",
        label: t("reports.users.failedLogins.risk"),
        sortable: true,
        sortFn: (a, b) => a.riskLevel.localeCompare(b.riskLevel),
        render: (row) => (
          <Badge className={getStatusBadgeClass(getRiskTone(row.riskLevel))}>
            {RISK_MAP[row.riskLevel as keyof typeof RISK_MAP] || row.riskLevel}
          </Badge>
        ),
        exportValue: (row) =>
          RISK_MAP[row.riskLevel as keyof typeof RISK_MAP] || row.riskLevel,
        align: "center" as const,
      },
    ],
    [t, RISK_MAP],
  );

  const sessionColumns: ColumnConfig<UserActiveSession>[] = useMemo(
    () => [
      {
        key: "fullName",
        label: t("reports.users.sessions.name"),
        sortable: true,
        sortFn: (a, b) => a.fullName.localeCompare(b.fullName),
        exportValue: (row) => row.fullName,
        align: "start" as const,
      },
      {
        key: "email",
        label: t("reports.users.sessions.email"),
        sortable: true,
        sortFn: (a, b) => a.email.localeCompare(b.email),
        exportValue: (row) => row.email,
        align: "start" as const,
      },
      {
        key: "activeSessionsCount",
        label: t("reports.users.sessions.count"),
        sortable: true,
        sortFn: (a, b) => a.activeSessionsCount - b.activeSessionsCount,
        render: (row) => row.activeSessionsCount.toLocaleString(),
        exportValue: (row) => row.activeSessionsCount,
        align: "end" as const,
      },
      {
        key: "lastActivity",
        label: t("reports.users.sessions.lastActivity"),
        sortable: true,
        sortFn: (a, b) =>
          (a.lastActivity || "").localeCompare(b.lastActivity || ""),
        render: (row) =>
          row.lastActivity
            ? new Date(row.lastActivity).toLocaleDateString()
            : t("common.notAvailable"),
        exportValue: (row) =>
          row.lastActivity || t("common.notAvailable"),
        align: "center" as const,
      },
      {
        key: "isActive",
        label: t("reports.users.sessions.status"),
        sortable: true,
        sortFn: (a, b) => Number(b.isActive) - Number(a.isActive),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              getStatusTone(row.isActive ? "ACTIVE" : "INACTIVE"),
            )}
          >
            {row.isActive
              ? t("reports.users.active")
              : t("reports.users.inactive")}
          </Badge>
        ),
        exportValue: (row) =>
          row.isActive
            ? t("reports.users.active")
            : t("reports.users.inactive"),
        align: "center" as const,
      },
    ],
    [t],
  );

  const lockedColumns: ColumnConfig<LockedAccountDetail>[] = useMemo(
    () => [
      {
        key: "fullName",
        label: t("reports.users.locked.name"),
        sortable: true,
        sortFn: (a, b) => a.fullName.localeCompare(b.fullName),
        exportValue: (row) => row.fullName,
        align: "start" as const,
      },
      {
        key: "email",
        label: t("reports.users.locked.email"),
        sortable: true,
        sortFn: (a, b) => a.email.localeCompare(b.email),
        exportValue: (row) => row.email,
        align: "start" as const,
      },
      {
        key: "lockType",
        label: t("reports.users.locked.type"),
        sortable: true,
        sortFn: (a, b) => a.lockType.localeCompare(b.lockType),
        render: (row) => (
          <Badge
            className={getStatusBadgeClass(
              getStatusTone(row.lockType === "permanent" ? "LOCKED" : "PENDING"),
            )}
          >
            {row.lockType === "permanent"
              ? t("reports.users.locked.permanent")
              : t("reports.users.locked.temporary")}
          </Badge>
        ),
        exportValue: (row) => row.lockType,
        align: "center" as const,
      },
      {
        key: "failedAttempts",
        label: t("reports.users.locked.attempts"),
        sortable: true,
        sortFn: (a, b) => a.failedAttempts - b.failedAttempts,
        render: (row) => row.failedAttempts.toLocaleString(),
        exportValue: (row) => row.failedAttempts,
        align: "end" as const,
      },
      {
        key: "hoursLockedFor",
        label: t("reports.users.locked.duration"),
        sortable: true,
        sortFn: (a, b) => a.hoursLockedFor - b.hoursLockedFor,
        render: (row) => `${row.hoursLockedFor.toFixed(1)}h`,
        exportValue: (row) => row.hoursLockedFor,
        align: "end" as const,
      },
      {
        key: "lockedUntil",
        label: t("reports.users.locked.until"),
        sortable: true,
        sortFn: (a, b) =>
          (a.lockedUntil || "").localeCompare(b.lockedUntil || ""),
        render: (row) =>
          row.lockedUntil
            ? new Date(row.lockedUntil).toLocaleDateString()
            : t("common.notAvailable"),
        exportValue: (row) => row.lockedUntil || t("common.notAvailable"),
        align: "center" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  const roleChartData = useMemo(() => {
    const bk = overview.data?.roleDistribution || [];
    return {
      labels: bk.map((r) => r.roleName),
      series: bk.map((r) => r.usersCount),
      colors: bk.map((_, i) => ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length]),
    };
  }, [overview.data]);

  const loginTrendData = useMemo(() => {
    const trend = loginActivity.data?.trend || [];
    return {
      categories: trend.map((p) => p.period),
      series: [
        {
          name: t("reports.users.login.successful"),
          data: trend.map((p) => p.successfulLogins),
        },
        {
          name: t("reports.users.login.failed"),
          data: trend.map((p) => p.failedLogins),
        },
      ],
    };
  }, [loginActivity.data, t]);

  const paginateTable = useCallback(
    <T,>(items: T[] | undefined, key: SecurityTableKey) => {
      const list = items || [];
      const pageSize = tablePageSizes[key] || DEFAULT_PAGE_SIZE;
      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const currentPage = Math.min(Math.max(tablePages[key] || 1, 1), totalPages);
      const start = (currentPage - 1) * pageSize;

      return {
        rows: list.slice(start, start + pageSize),
        pagination: {
          currentPage,
          pageSize,
          totalItems,
          totalPages,
        },
      };
    },
    [tablePageSizes, tablePages],
  );

  const pagedActiveUsers = useMemo(
    () => paginateTable(loginActivity.data?.mostActiveUsers, "loginActive"),
    [loginActivity.data?.mostActiveUsers, paginateTable],
  );
  const pagedInactiveUsers = useMemo(
    () => paginateTable(loginActivity.data?.inactiveUsers, "loginInactive"),
    [loginActivity.data?.inactiveUsers, paginateTable],
  );
  const pagedRoleDistribution = useMemo(
    () => paginateTable(overview.data?.roleDistribution, "roleDistribution"),
    [overview.data?.roleDistribution, paginateTable],
  );
  const pagedAtRiskUsers = useMemo(
    () => paginateTable(failedLogins.data?.atRiskUsers, "failedAtRisk"),
    [failedLogins.data?.atRiskUsers, paginateTable],
  );
  const pagedSuspiciousIps = useMemo(
    () => paginateTable(failedLogins.data?.suspiciousIps, "failedIps"),
    [failedLogins.data?.suspiciousIps, paginateTable],
  );
  const pagedSessions = useMemo(
    () => paginateTable(sessions.data?.usersWithSessions, "sessions"),
    [sessions.data?.usersWithSessions, paginateTable],
  );
  const pagedLocked = useMemo(
    () => paginateTable(locked.data?.lockedAccounts, "locked"),
    [locked.data?.lockedAccounts, paginateTable],
  );

  return (
    <ReportPageLayout
      title={t("reports.users.overview.title")}
      description={t("reports.users.overview.description")}
      borderColor="info"
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      filters={
        <ReportFilters<SecurityFilters>
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            setTablePages({
              loginActive: 1,
              loginInactive: 1,
              roleDistribution: 1,
              failedAtRisk: 1,
              failedIps: 1,
              sessions: 1,
              locked: 1,
            });
            setTablePageSizes({
              loginActive: DEFAULT_PAGE_SIZE,
              loginInactive: DEFAULT_PAGE_SIZE,
              roleDistribution: DEFAULT_PAGE_SIZE,
              failedAtRisk: DEFAULT_PAGE_SIZE,
              failedIps: DEFAULT_PAGE_SIZE,
              sessions: DEFAULT_PAGE_SIZE,
              locked: DEFAULT_PAGE_SIZE,
            });
          }}
          dateFilters={[
            { key: "startDate", label: t("reports.common.startDate") },
            { key: "endDate", label: t("reports.common.endDate") },
          ]}
          showReset
        />
      }
      kpiCards={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportMetricCard
            label={t("reports.users.overview.totalUsers")}
            value={kpi?.totalUsers ?? 0}
            icon={Users}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.users.overview.activeUsers")}
            value={kpi?.activeUsers ?? 0}
            icon={UserCheck}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.users.sessions.activeSessions")}
            value={sessions.data?.metrics?.totalActiveSessions ?? 0}
            icon={Monitor}
            variant="info"
          />
          <ReportMetricCard
            label={t("reports.users.overview.growthRate")}
            value={`${(kpi?.growthRate ?? 0).toFixed(1)}%`}
            icon={TrendingUp}
            variant="purple"
          />
          <ReportMetricCard
            label={t("reports.users.login.totalAttempts")}
            value={loginActivity.data?.kpis?.totalAttempts ?? 0}
            icon={Activity}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.users.failedLogins.atRisk")}
            value={failedLogins.data?.metrics?.atRiskUsersCount ?? 0}
            icon={AlertTriangle}
            variant="warning"
          />
          <ReportMetricCard
            label={t("reports.users.locked.total")}
            value={lockStats?.totalLocked ?? 0}
            icon={Lock}
            variant="danger"
          />
          <ReportMetricCard
            label={t("reports.users.locked.lockRate")}
            value={`${(lockStats?.lockRate ?? 0).toFixed(1)}%`}
            icon={ShieldAlert}
            variant="danger"
          />
        </div>
      }
      charts={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChartCard title={t("reports.users.overview.roleChart")}>
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

          <ReportChartCard title={t("reports.users.login.trendChart")}>
            {loginTrendData.categories.length > 0 ? (
              <AreaChart
                categories={loginTrendData.categories}
                series={loginTrendData.series}
                height={300}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>
        </div>
      }
    >
      <Tabs defaultValue="loginActivity" className="w-full">
        <TabsList>
          <TabsTrigger value="loginActivity">
            <Activity className="h-4 w-4 me-1" />
            {t("reports.users.login.tab")}
          </TabsTrigger>
          <TabsTrigger value="failedLogins">
            <ShieldAlert className="h-4 w-4 me-1" />
            {t("reports.users.failedLogins.tab")}
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="h-4 w-4 me-1" />
            {t("reports.users.sessions.tab")}
          </TabsTrigger>
          <TabsTrigger value="locked">
            <Lock className="h-4 w-4 me-1" />
            {t("reports.users.locked.tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loginActivity" className="space-y-4 mt-4">
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                {t("reports.users.login.mostActive")}
              </TabsTrigger>
              <TabsTrigger value="inactive">
                {t("reports.users.login.inactive")}
              </TabsTrigger>
              <TabsTrigger value="roles">
                {t("reports.users.roles.distribution")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <DataTable<UserLoginDetail>
                data={pagedActiveUsers.rows}
                columns={loginColumns}
                keyExtractor={(item) => item.userId}
                pagination={pagedActiveUsers.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, loginActive: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({ ...prev, loginActive: nextPageSize }));
                  setTablePages((prev) => ({ ...prev, loginActive: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={loginActivity.isLoading}
                enableExport
                exportFilename="most-active-users"
              />
            </TabsContent>

            <TabsContent value="inactive">
              <DataTable<UserLoginDetail>
                data={pagedInactiveUsers.rows}
                columns={loginColumns}
                keyExtractor={(item) => item.userId}
                pagination={pagedInactiveUsers.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, loginInactive: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    loginInactive: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, loginInactive: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={loginActivity.isLoading}
                enableExport
                exportFilename="inactive-users"
              />
            </TabsContent>

            <TabsContent value="roles">
              <DataTable<RoleDistributionItem>
                data={pagedRoleDistribution.rows}
                columns={roleColumns}
                keyExtractor={(item) => item.roleId}
                pagination={pagedRoleDistribution.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({
                    ...prev,
                    roleDistribution: nextPage,
                  }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({
                    ...prev,
                    roleDistribution: nextPageSize,
                  }));
                  setTablePages((prev) => ({ ...prev, roleDistribution: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={overview.isLoading}
                enableExport
                exportFilename="role-distribution"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="failedLogins" className="space-y-4 mt-4">
          <Tabs defaultValue="atRisk">
            <TabsList>
              <TabsTrigger value="atRisk">
                {t("reports.users.failedLogins.atRiskTab")}
              </TabsTrigger>
              <TabsTrigger value="suspiciousIps">
                {t("reports.users.failedLogins.ipsTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="atRisk">
              <DataTable<UserFailedLogin>
                data={pagedAtRiskUsers.rows}
                columns={failedLoginColumns}
                keyExtractor={(item) => item.userId}
                pagination={pagedAtRiskUsers.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, failedAtRisk: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({ ...prev, failedAtRisk: nextPageSize }));
                  setTablePages((prev) => ({ ...prev, failedAtRisk: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={failedLogins.isLoading}
                enableExport
                exportFilename="at-risk-users"
              />
            </TabsContent>

            <TabsContent value="suspiciousIps">
              <DataTable<SuspiciousIp>
                data={pagedSuspiciousIps.rows}
                columns={ipColumns}
                keyExtractor={(item) => item.ipAddress}
                pagination={pagedSuspiciousIps.pagination}
                onPageChange={(nextPage) =>
                  setTablePages((prev) => ({ ...prev, failedIps: nextPage }))
                }
                onPageSizeChange={(nextPageSize) => {
                  setTablePageSizes((prev) => ({ ...prev, failedIps: nextPageSize }));
                  setTablePages((prev) => ({ ...prev, failedIps: 1 }));
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                isLoading={failedLogins.isLoading}
                enableExport
                exportFilename="suspicious-ips"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <DataTable<UserActiveSession>
            data={pagedSessions.rows}
            columns={sessionColumns}
            keyExtractor={(item) => item.userId}
            pagination={pagedSessions.pagination}
            onPageChange={(nextPage) =>
              setTablePages((prev) => ({ ...prev, sessions: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTablePageSizes((prev) => ({ ...prev, sessions: nextPageSize }));
              setTablePages((prev) => ({ ...prev, sessions: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={sessions.isLoading}
            enableExport
            exportFilename="active-sessions"
          />
        </TabsContent>

        <TabsContent value="locked" className="mt-4">
          <DataTable<LockedAccountDetail>
            data={pagedLocked.rows}
            columns={lockedColumns}
            keyExtractor={(item) => item.userId}
            pagination={pagedLocked.pagination}
            onPageChange={(nextPage) =>
              setTablePages((prev) => ({ ...prev, locked: nextPage }))
            }
            onPageSizeChange={(nextPageSize) => {
              setTablePageSizes((prev) => ({ ...prev, locked: nextPageSize }));
              setTablePages((prev) => ({ ...prev, locked: 1 }));
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isLoading={locked.isLoading}
            enableExport
            exportFilename="locked-accounts"
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default UsersSecurityDashboardReport;

