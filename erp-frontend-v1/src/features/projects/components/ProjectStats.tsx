/**
 * Project Statistics Cards Component
 *
 * Displays real-time statistics for projects.
 * Calculates stats from projects array dynamically.
 *
 * Shows 8 key metrics:
 * - Total Projects
 * - Draft Projects
 * - Planning Projects
 * - Active Projects
 * - On Hold Projects
 * - Completed Projects
 * - Cancelled Projects
 * - Archived Projects
 *
 * @component ProjectStats
 */

import { useTranslation } from "@/i18n/useTranslation";
import { KpiStrip } from "@/components/common/KpiStrip";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectsStatistics } from "@/types/projects-statistics";

interface ProjectStatsProps {
  statistics?: ProjectsStatistics;
  isLoading?: boolean;
}

export const ProjectStats = ({ statistics, isLoading }: ProjectStatsProps) => {
  const { t } = useTranslation();

  const stats = {
    total: statistics?.totalProjects ?? 0,
    active: statistics?.activeProjects ?? 0,
    completed: statistics?.completedProjects ?? 0,
    onHold: statistics?.onHoldProjects ?? 0,
    draft: statistics?.draftProjects ?? 0,
  };

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-md" />;
  }

  return (
    <KpiStrip
      items={[
        {
          label: t("projects.stats.total"),
          value: stats.total,
          accent: "var(--primary-light)",
        },
        {
          label: t("projects.stats.active"),
          value: stats.active,
          accent: "var(--success)",
          deltaDirection: stats.active > 0 ? "up" : "neutral",
        },
        {
          label: t("projects.stats.completed"),
          value: stats.completed,
          accent: "var(--info)",
        },
        {
          label: t("projects.stats.onHold"),
          value: stats.onHold,
          accent: "var(--warning)",
          deltaDirection: stats.onHold > 0 ? "down" : "neutral",
        },
        {
          label: t("projects.stats.draft", { defaultValue: "Draft" }),
          value: stats.draft,
          accent: "var(--text-tertiary)",
        },
      ]}
    />
  );
};
