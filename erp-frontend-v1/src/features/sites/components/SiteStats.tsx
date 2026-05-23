/**
 * Site Stats Component
 *
 * Dashboard-style statistics cards showing:
 * - Total sites count
 * - Active sites count
 * - Under preparation count
 * - Closed sites count
 *
 * Fetches statistics directly from API to show total counts across all sites.
 *
 * @module SiteStats
 */

import { useTranslation } from "@/i18n/useTranslation";
import { KpiStrip } from "@/components/common/KpiStrip";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSitesStats } from "@/hooks/useSites";

export const SiteStats = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useGetSitesStats();

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-md" />;
  }

  if (!stats) return null;

  return (
    <KpiStrip
      items={[
        {
          label: t("sites.stats.total"),
          value: stats.totalSites,
          accent: "var(--primary-light)",
        },
        {
          label: t("sites.stats.active"),
          value: stats.activeSites,
          accent: "var(--success)",
        },
        {
          label: t("sites.stats.underPreparation"),
          value: stats.underPreparation,
          accent: "var(--warning)",
        },
        {
          label: t("sites.stats.closed"),
          value: stats.closedSites,
          accent: "var(--text-tertiary)",
        },
      ]}
    />
  );
};
