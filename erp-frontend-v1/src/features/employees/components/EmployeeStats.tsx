/**
 * Employee Stats Cards Component
 * Displays real-time statistics about ALL employees using API
 * Not affected by pagination - shows total counts across all employees
 */

import { KpiStrip } from "@/components/common/KpiStrip";
import { useTranslation } from "@/i18n/useTranslation";
import { useEmployeesStatistics } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";

export const EmployeeStats = () => {
  const { t } = useTranslation();
  const { data: statistics, isLoading, error } = useEmployeesStatistics();

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-md" />;
  }

  if (error || !statistics) return null;

  return (
    <KpiStrip
      items={[
        {
          label: t("employees.stats.total"),
          value: statistics.totalEmployees,
          accent: "var(--primary-light)",
        },
        {
          label: t("employees.stats.active"),
          value: statistics.activeEmployees,
          accent: "var(--success)",
        },
        {
          label: t("employees.stats.onLeave"),
          value: statistics.onLeaveEmployees,
          accent: "var(--warning)",
        },
        {
          label: t("employees.stats.inactive"),
          value: statistics.inactiveEmployees,
          accent: "var(--text-tertiary)",
        },
      ]}
    />
  );
};
