/**
 * Maintenance Statistics Cards Component
 *
 * Displays real-time statistics for maintenance requests from API.
 * Uses statistics data from backend for accurate counts.
 *
 * Shows 4 key metrics:
 * - Total Requests
 * - Pending Requests
 * - In Progress Requests
 * - Completed Requests
 *
 * @component MaintenanceStats
 */

import { useTranslation } from "@/i18n/useTranslation";
import { KpiStrip } from "@/components/common/KpiStrip";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceStatsProps {
  totalRequests?: number;
  pendingRequests?: number;
  inProgressRequests?: number;
  completedRequests?: number;
  isLoading?: boolean;
}

export const MaintenanceStats = ({
  totalRequests = 0,
  pendingRequests = 0,
  inProgressRequests = 0,
  completedRequests = 0,
  isLoading,
}: MaintenanceStatsProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-md" />;
  }

  return (
    <KpiStrip
      items={[
        {
          label: t("maintenance.stats.total"),
          value: totalRequests,
          accent: "var(--primary-light)",
        },
        {
          label: t("maintenance.stats.pending"),
          value: pendingRequests,
          accent: "var(--warning)",
          deltaDirection: pendingRequests > 0 ? "down" : "neutral",
        },
        {
          label: t("maintenance.stats.inProgress"),
          value: inProgressRequests,
          accent: "var(--info)",
        },
        {
          label: t("maintenance.stats.completed"),
          value: completedRequests,
          accent: "var(--success)",
          deltaDirection: completedRequests > 0 ? "up" : "neutral",
        },
      ]}
    />
  );
};
