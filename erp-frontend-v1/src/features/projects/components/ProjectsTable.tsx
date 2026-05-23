/**
 * Projects Table Component - Enhanced with DataTable v3.1
 *
 * Production-ready table for displaying projects with:
 * - Full theme integration (light/dark mode)
 * - Complete i18n support (Arabic/English)
 * - RTL support with proper alignment
 * - Loading, error, and empty states
 * - Advanced pagination with page size selector
 * - Export to Excel/PDF
 * - 9 columns: Code, Name, Client, Status, Progress, Start Date, Budget, Manager, Actions
 * - Responsive design (mobile friendly)
 * - Accessibility optimized
 *
 * Uses the enterprise-grade DataTable component for consistent UX across the system.
 *
 * @component ProjectsTable
 * @version 3.1
 */

import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { ProgressBar } from "./ProgressBar";
import { formatProjectDate } from "@/types/projects.types";
import type { ProjectEntity, ProjectFiltersDto } from "@/types/projects.types";
import { ProjectActions } from "./ProjectActions";

interface ProjectsTableProps {
  data: ProjectEntity[];
  meta?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  isLoading: boolean;
  error: unknown;
  filters: ProjectFiltersDto;
  onFiltersChange: (filters: ProjectFiltersDto) => void;
}

/**
 * ProjectsTable Component
 * Main table for displaying projects list with full ERP features
 */
export const ProjectsTable = ({
  data,
  meta,
  isLoading,
  error,
  filters,
  onFiltersChange,
}: ProjectsTableProps) => {
  const { t } = useTranslation();

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  /**
   * Handle page size change (reset to page 1)
   */
  const handlePageSizeChange = (newPageSize: number) => {
    onFiltersChange({
      ...filters,
      limit: newPageSize,
      page: 1,
    });
  };

  /**
   * Column Configuration
   * Defines structure, labels, rendering, and alignment for each column
   */
  const columns: ColumnConfig<ProjectEntity>[] = [
    // Project Code - Monospace for better readability
    {
      key: "projectCode",
      label: t("projects.table.projectCode"),
      render: (project) => (
        <span className="font-mono text-sm">{project.projectCode}</span>
      ),
      align: "start",
      exportValue: (project) => project.projectCode,
    },

    // Name - Bilingual with English primary and Arabic secondary
    {
      key: "name",
      label: t("projects.table.name"),
      render: (project) => (
        <div className="flex flex-col">
          <Link
            to={`/projects/${project.id}`}
            className="font-medium text-[var(--primary-main)] hover:underline"
          >
            {project.name}
          </Link>
        </div>
      ),
      align: "start",
      exportValue: (project) => project.name,
    },

    // Client - Name and phone with fallback
    {
      key: "client",
      label: t("projects.table.client"),
      render: (project) =>
        project.clientName ? (
          <div className="flex flex-col">
            <span className="text-sm">{project.clientName}</span>
            {project.clientPhone && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {project.clientPhone}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[var(--text-tertiary)]">-</span>
        ),
      align: "start",
      hideMobile: true, // Hide on small screens
      exportValue: (project) => project.clientName || "-",
    },

    // Status - Badge component with theme colors
    {
      key: "status",
      label: t("projects.table.status"),
      render: (project) => <ProjectStatusBadge status={project.status} />,
      align: "center",
      exportValue: (project) => project.status,
    },

    // Progress - Visual progress bar
    {
      key: "progress",
      label: t("projects.table.progress"),
      render: (project) => (
        <div className="w-32">
          <ProgressBar
            percentage={project.completionPercentage ?? 0}
            height="sm"
          />
        </div>
      ),
      align: "start",
      hideMobile: true, // Hide on small screens
      exportValue: (project) => `${project.completionPercentage}%`,
    },

    // Start Date - Formatted date (planned or actual)
    {
      key: "startDate",
      label: t("projects.table.startDate"),
      render: (project) =>
        formatProjectDate(project.plannedStartDate || project.actualStartDate),
      align: "start",
      hideMobile: true, // Hide on small screens
      exportValue: (project) =>
        formatProjectDate(project.plannedStartDate || project.actualStartDate),
    },

    // Budget - Formatted with currency
    /*    {
      key: "budget",
      label: t("projects.table.budget"),
      render: (project) => formatBudget(project.budget, project.currency),
      align: "end",
      hideMobile: true, // Hide on small screens
      // Handle null/undefined budget values for export
      exportValue: (project) => project.budget ?? 0,
    }, */

    // Manager - Short ID display (until we have full user data)
    /*   {
      key: "manager",
      label: t("projects.table.manager"),
      render: (project) =>
        project.managerId ? (
          <span className="text-sm">
            {project.managerId.substring(0, 8)}...
          </span>
        ) : (
          <span className="text-[var(--text-tertiary)]">-</span>
        ),
      align: "start",
      hideMobile: true, // Hide on small screens
      exportValue: (project) => project.managerId || "-",
    }, */

    // Actions - ProjectActions dropdown
    {
      key: "actions",
      label: t("projects.table.actions"),
      render: (project) => <ProjectActions project={project} />,
      align: "end",
      className: "w-16",
      excludeFromExport: true,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      pagination={
        meta
          ? {
              currentPage: meta.page,
              pageSize: meta.pageSize,
              totalItems: meta.totalItems,
              totalPages: meta.totalPages,
            }
          : undefined
      }
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      pageSizeOptions={[5, 10, 20, 50, 100]}
      isLoading={isLoading}
      error={error as Error}
      emptyMessage={t("projects.empty.noProjects")}
      keyExtractor={(project) => project.id}
      enableCompactMode={true}
      defaultCompact={false}
      // Export Features v3.1
      enableHoverActions={false}
      enableExport={true}
      exportFilename="projects_list"
      exportTitle={t("projects.title", { defaultValue: "Projects" })}
    />
  );
};


