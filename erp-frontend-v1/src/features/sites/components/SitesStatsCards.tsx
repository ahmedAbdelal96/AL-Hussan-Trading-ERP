import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Construction,
  DoorClosed,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import type { SitesStats } from "@/types/sites.types";

interface SitesStatsCardsProps {
  stats: SitesStats;
}

export const SitesStatsCards = ({ stats }: SitesStatsCardsProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {/* Total Sites */}
      <StatsCard
        title={t("sites.stats.total", { defaultValue: "إجمالي المواقع" })}
        value={stats.totalSites}
        icon={MapPin}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100 dark:bg-blue-900/20"
      />

      {/* Active Sites */}
      <StatsCard
        title={t("sites.stats.active", { defaultValue: "المواقع النشطة" })}
        value={stats.activeSites}
        icon={CheckCircle2}
        iconColor="text-green-600"
        iconBgColor="bg-green-100 dark:bg-green-900/20"
      />

      {/* Inactive Sites */}
      <StatsCard
        title={t("sites.stats.inactive", {
          defaultValue: "المواقع غير النشطة",
        })}
        value={stats.inactiveSites}
        icon={XCircle}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100 dark:bg-orange-900/20"
      />

      {/* Under Preparation */}
      <StatsCard
        title={t("sites.stats.underPreparation", {
          defaultValue: "قيد التحضير",
        })}
        value={stats.underPreparation}
        icon={Construction}
        iconColor="text-yellow-600"
        iconBgColor="bg-yellow-100 dark:bg-yellow-900/20"
      />

      {/* Closed Sites */}
      <StatsCard
        title={t("sites.stats.closed", { defaultValue: "المواقع المغلقة" })}
        value={stats.closedSites}
        icon={DoorClosed}
        iconColor="text-red-600"
        iconBgColor="bg-red-100 dark:bg-red-900/20"
      />
    </div>
  );
};
