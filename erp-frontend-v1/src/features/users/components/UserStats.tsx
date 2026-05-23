import { useTranslation } from "@/i18n/useTranslation";
import { KpiStrip } from "@/components/common/KpiStrip";
import type { UserStatsResponse } from "@/types/users.types";

interface UserStatsProps {
  stats?: UserStatsResponse | null;
}

export const UserStats = ({ stats }: UserStatsProps) => {
  const { t } = useTranslation();

  const resolvedStats = stats ?? {
    total: 0,
    active: 0,
    inactive: 0,
    locked: 0,
  };

  return (
    <KpiStrip
      items={[
        {
          label: t("users.stats.total", { defaultValue: "Total Users" }),
          value: resolvedStats.total,
          accent: "var(--primary-light)",
        },
        {
          label: t("users.stats.active", { defaultValue: "Active" }),
          value: resolvedStats.active,
          accent: "var(--success)",
        },
        {
          label: t("users.stats.inactive", { defaultValue: "Inactive" }),
          value: resolvedStats.inactive,
          accent: "var(--text-tertiary)",
        },
        {
          label: t("users.stats.locked", { defaultValue: "Locked" }),
          value: resolvedStats.locked,
          accent: "var(--error)",
        },
      ]}
    />
  );
};
