/**
 * Projects List Page
 *
 * Main landing page for the Projects module.
 * Displays project statistics, filters, and paginated table.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects, useProjectsStatistics } from "@/hooks/useProjects";
import { ProjectStats } from "@/features/projects/components/ProjectStats";
import { ProjectsFilters } from "@/features/projects/components/ProjectsFilters";
import { ProjectsTable } from "@/features/projects/components/ProjectsTable";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS } from "@/config/permissions.constants";
import type { ProjectFiltersDto } from "@/types/projects.types";

export const ProjectsListPage = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<ProjectFiltersDto>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading, error } = useProjects(filters);
  const statsParams = useMemo(
    () => ({
      status: filters.status,
      siteId: filters.siteId,
      managerId: filters.managerId,
      startDate: filters.startDateFrom,
      endDate: filters.startDateTo,
    }),
    [
      filters.status,
      filters.siteId,
      filters.managerId,
      filters.startDateFrom,
      filters.startDateTo,
    ],
  );
  const { data: projectsStatistics, isLoading: isStatisticsLoading } =
    useProjectsStatistics(statsParams);

  const handleFiltersChange = (newFilters: ProjectFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.status !== prev.status;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page || prev.page || 1),
      };
    });
  };

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("projects.list.title")}
        description={t("projects.list.description")}
        actions={
          <PermissionGate permissions={[PERMISSIONS.PROJECT_WRITE]}>
            <Button asChild>
              <Link to="/projects/create">
                <Plus className="h-4 w-4 mr-2" />
                {t("projects.actions.create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />

      <ProjectStats
        statistics={projectsStatistics}
        isLoading={isLoading || isStatisticsLoading}
      />

      <ProjectsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <ProjectsTable
        data={data?.data || []}
        meta={data?.meta}
        isLoading={isLoading}
        error={error}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </PageShell>
  );
};
