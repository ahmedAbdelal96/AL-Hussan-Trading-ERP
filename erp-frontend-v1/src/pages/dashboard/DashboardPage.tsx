/**
 * Dashboard Page - Main Dashboard
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguage } from "@/store/languageStore";
import { Link } from "react-router-dom";
import { CURRENCY } from "@/config/system.constants";
import { dashboardApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiStrip } from "@/components/common/KpiStrip";
import { Button } from "@/components/ui/button";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import {
  Package,
  DollarSign,
  FolderKanban,
  Users,
  Wrench,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

const formatCurrency = (value: number, isRTL: boolean) =>
  value.toLocaleString(isRTL ? "ar-SA" : "en-US", {
    style: "currency",
    currency: CURRENCY.DEFAULT,
    maximumFractionDigits: 0,
  });

const DashboardPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-statistics"],
    queryFn: () => dashboardApi.getStatistics(),
    refetchInterval: 60000,
  });

  const handleForceRefresh = async () => {
    const fresh = await dashboardApi.getStatistics(true);
    queryClient.setQueryData(["dashboard-statistics"], fresh);
    await refetch();
  };

  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex items-center justify-center min-h-[24rem]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell size="wide" density="compact">
        <div className="bg-[var(--error-bg)] border border-[var(--invalid-border)] rounded-[var(--radius-lg)] p-4">
          <p className="text-[var(--error)]">{t("dashboard.error")}</p>
        </div>
      </PageShell>
    );
  }

  const stats = data!;

  const hasAnyModule =
    stats.assets ||
    stats.projects ||
    stats.employees ||
    stats.maintenance ||
    stats.finance;

  const hasAlerts =
    stats.alerts.pendingMaintenance > 0 ||
    stats.alerts.expiredWarranties > 0 ||
    stats.alerts.onHoldProjects > 0 ||
    stats.alerts.inactiveEmployees > 0;

  const sectionTitleClass =
    "text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]";
  const statBoxClass =
    "rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] px-4 py-3 shadow-[var(--shadow-xs)]";
  const itemLabelClass = "text-xs text-[var(--text-tertiary)] mb-1";

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.welcome")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ltr:mr-2 rtl:ml-2 ${isFetching ? "animate-spin" : ""}`}
            />
            {t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
        }
      />

      {/* Operational KPI Strip */}
      {hasAnyModule && (
        <KpiStrip
          items={[
            ...(stats.employees
              ? [
                  {
                    label: t("dashboard.modules.employees"),
                    value: stats.employees.totalEmployees.toLocaleString(),
                    accent: "var(--primary-light)",
                  },
                ]
              : []),
            ...(stats.projects
              ? [
                  {
                    label: t("dashboard.modules.projects"),
                    value: stats.projects.activeProjects.toLocaleString(),
                    accent: "var(--success)",
                  },
                ]
              : []),
            ...(stats.assets
              ? [
                  {
                    label: t("dashboard.modules.assets"),
                    value: stats.assets.totalAssets.toLocaleString(),
                    accent: "var(--info)",
                  },
                ]
              : []),
            ...(stats.maintenance
              ? [
                  {
                    label: t("dashboard.alerts.pendingMaintenance"),
                    value: stats.maintenance.pendingRequests.toLocaleString(),
                    accent: "var(--warning)",
                    deltaDirection:
                      stats.maintenance.pendingRequests > 0
                        ? ("down" as const)
                        : ("neutral" as const),
                  },
                ]
              : []),
            ...(stats.finance
              ? [
                  {
                    label: t("dashboard.modules.finance"),
                    value: formatCurrency(stats.finance.totalCosts, isRTL),
                    accent: "var(--primary-light)",
                  },
                ]
              : []),
          ]}
        />
      )}

      {/* No modules - welcome message */}
      {!hasAnyModule && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutDashboard className="mb-4 h-16 w-16 text-[var(--icon-tertiary)]" />
            <h2 className="text-xl font-semibold text-[var(--text-secondary)]">
              {t("dashboard.welcome")}
            </h2>
            <p className="text-[var(--text-tertiary)] mt-2 text-center max-w-md">
              {t("dashboard.noModulesMessage")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Operational 2-column layout */}
      {hasAnyModule && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Main column (2/3): module summaries */}
          <div className="lg:col-span-2 space-y-5">
            {/* Assets section */}
            {stats.assets && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <h3 className={sectionTitleClass}>
                      {t("dashboard.modules.assets")}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.assets.total")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums">
                        {stats.assets.totalAssets.toLocaleString()}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.assets.totalValue")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums">
                        {formatCurrency(stats.assets.totalValue, isRTL)}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.assets.available")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--success)]">
                        {stats.assets.availableAssets}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.assets.utilizationRate")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--info)]">
                        {stats.assets.utilizationRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects section */}
            {stats.projects && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
                    <FolderKanban className="h-4 w-4 text-primary shrink-0" />
                    <h3 className={sectionTitleClass}>
                      {t("dashboard.modules.projects")}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.projects.total")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums">
                        {stats.projects.totalProjects}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.projects.active")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--info)]">
                        {stats.projects.activeProjects}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.projects.completed")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--success)]">
                        {stats.projects.completedProjects}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.projects.budget")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums">
                        {formatCurrency(stats.projects.totalBudget, isRTL)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employees + Maintenance side-by-side */}
            {(stats.employees || stats.maintenance) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {stats.employees && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
                        <Users className="h-4 w-4 text-primary shrink-0" />
                        <h3 className={sectionTitleClass}>
                          {t("dashboard.modules.employees")}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.employees.total")}
                          </span>
                          <span className="text-base font-semibold tabular-nums">
                            {stats.employees.totalEmployees}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.employees.active")}
                          </span>
                          <Badge
                            className={getStatusBadgeClass(
                              getStatusTone("ACTIVE"),
                            )}
                          >
                            {stats.employees.activeEmployees}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.employees.onLeave")}
                          </span>
                          <Badge
                            className={getStatusBadgeClass(
                              getStatusTone("ON_LEAVE"),
                            )}
                          >
                            {stats.employees.onLeaveEmployees}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.employees.inactive")}
                          </span>
                          <Badge
                            className={getStatusBadgeClass(
                              getStatusTone("INACTIVE"),
                            )}
                          >
                            {stats.employees.inactiveEmployees}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {stats.maintenance && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
                        <Wrench className="h-4 w-4 text-primary shrink-0" />
                        <h3 className={sectionTitleClass}>
                          {t("dashboard.modules.maintenance")}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.maintenance.total")}
                          </span>
                          <span className="text-base font-semibold tabular-nums">
                            {stats.maintenance.totalRequests}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.maintenance.pending")}
                          </span>
                          <Badge
                            className={getStatusBadgeClass(
                              getStatusTone("PENDING"),
                            )}
                          >
                            {stats.maintenance.pendingRequests}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.maintenance.inProgress")}
                          </span>
                          <Badge
                            className={getStatusBadgeClass(
                              getStatusTone("IN_PROGRESS"),
                            )}
                          >
                            {stats.maintenance.inProgressRequests}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {t("dashboard.maintenance.completionRate")}
                          </span>
                          <span className="text-base font-semibold text-[var(--success)]">
                            {stats.maintenance.completionRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Finance section */}
            {stats.finance && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
                    <DollarSign className="h-4 w-4 text-primary shrink-0" />
                    <h3 className={sectionTitleClass}>
                      {t("dashboard.modules.finance")}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.finance.activeCosts", {
                          defaultValue: isRTL
                            ? "إجمالي التكاليف الفعّالة"
                            : "Active Costs",
                        })}
                      </p>
                      <p className="text-xl font-semibold tabular-nums">
                        {formatCurrency(stats.finance.totalCosts, isRTL)}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.finance.paid")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--success)]">
                        {formatCurrency(stats.finance.paidAmount, isRTL)}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.finance.pending")}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--warning)]">
                        {formatCurrency(stats.finance.pendingAmount, isRTL)}
                      </p>
                    </div>
                    <div className={statBoxClass}>
                      <p className={itemLabelClass}>
                        {t("dashboard.finance.rejectedArchive", {
                          defaultValue: isRTL
                            ? "مرفوضة (أرشيف)"
                            : "Rejected (Archive)",
                        })}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--error)]">
                        {formatCurrency(stats.finance.rejectedAmount, isRTL)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                    {t("dashboard.finance.noteRejectedExcluded", {
                      defaultValue: isRTL
                        ? "التكاليف المرفوضة لا تدخل ضمن إجمالي التكاليف الفعّالة."
                        : "Rejected costs are excluded from active total costs.",
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (1/3): Work Queue */}
          <div className="space-y-4 lg:sticky lg:top-20">
            <Card className="border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {hasAlerts ? (
                    <AlertTriangle className="h-4 w-4 text-[var(--warning)] shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" />
                  )}
                  {t("dashboard.workQueue", {
                    defaultValue: isRTL ? "قائمة الإجراءات" : "Work Queue",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {hasAlerts ? (
                  <div className="flex flex-col gap-2">
                    {stats.alerts.pendingMaintenance > 0 && (
                      <Link
                        to="/maintenance"
                        className="erp-alert-strip erp-alert-strip--warning hover:opacity-80 transition-opacity"
                      >
                        <Wrench className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>{stats.alerts.pendingMaintenance}</strong>{" "}
                          {t("dashboard.alerts.pendingMaintenance")}
                        </span>
                      </Link>
                    )}
                    {stats.alerts.expiredWarranties > 0 && (
                      <Link
                        to="/assets"
                        className="erp-alert-strip erp-alert-strip--error hover:opacity-80 transition-opacity"
                      >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>{stats.alerts.expiredWarranties}</strong>{" "}
                          {t("dashboard.alerts.expiredWarranties")}
                        </span>
                      </Link>
                    )}
                    {stats.alerts.onHoldProjects > 0 && (
                      <Link
                        to="/projects"
                        className="erp-alert-strip erp-alert-strip--warning hover:opacity-80 transition-opacity"
                      >
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>{stats.alerts.onHoldProjects}</strong>{" "}
                          {t("dashboard.alerts.onHoldProjects")}
                        </span>
                      </Link>
                    )}
                    {stats.alerts.inactiveEmployees > 0 && (
                      <Link
                        to="/employees"
                        className="erp-alert-strip erp-alert-strip--info hover:opacity-80 transition-opacity"
                      >
                        <Users className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>{stats.alerts.inactiveEmployees}</strong>{" "}
                          {t("dashboard.alerts.inactiveEmployees")}
                        </span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-3 text-[var(--success)]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-sm">
                      {t("dashboard.allClear", {
                        defaultValue: isRTL
                          ? "لا توجد إجراءات معلّقة"
                          : "All operational items clear",
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default DashboardPage;
