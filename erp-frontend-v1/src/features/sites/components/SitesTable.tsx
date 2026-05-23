/**
 * Sites Table Component v3.1
 *
 * Enterprise-grade sites table with:
 * - DataTable v3.1 integration
 * - Sorting & Selection
 * - Bulk Actions
 * - Compact Mode
 * - Export to Excel/PDF
 * - Loading and error states
 * - Pagination controls
 * - Responsive design
 *
 * @module SitesTable
 * @version 3.1.0
 */

import { useTranslation } from "@/i18n/useTranslation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { SiteActions } from "./SiteActions";
import { SiteStatusBadge } from "./SiteStatusBadge";
import { getSiteFullLocation } from "@/types/sites.types";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import type { SiteEntity, SiteFiltersDto } from "@/types/sites.types";

interface SitesTableProps {
  /** Array of sites to display */
  data: SiteEntity[];
  /** Pagination metadata */
  meta?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Current filters */
  filters: SiteFiltersDto;
  /** Filter change handler */
  onFiltersChange: (filters: SiteFiltersDto) => void;
}

/**
 * Sites Table Component
 *
 * Main table component for displaying sites with full CRUD operations
 */
export const SitesTable = ({
  data,
  meta,
  isLoading,
  error,
  filters,
  onFiltersChange,
}: SitesTableProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.SITE_WRITE);

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  /**
   * Handle page size change
   */
  const handlePageSizeChange = (newPageSize: number) => {
    onFiltersChange({
      ...filters,
      pageSize: newPageSize,
      page: 1, // Reset to first page
    });
  };

  // Column Configuration for DataTable
  const columns: ColumnConfig<SiteEntity>[] = [
    {
      key: "code",
      label: t("sites.table.code"),
      sortable: true,
      render: (site) => (
        <span className="font-mono text-sm font-medium">{site.code}</span>
      ),
      exportValue: (site) => site.code,
    },
    {
      key: "name",
      label: t("sites.table.name"),
      sortable: true,
      render: (site) => (
        <div className="flex flex-col">
          <Link
            to={`/sites/${site.id}`}
            className="font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {site.name}
          </Link>
        </div>
      ),
      exportValue: (site) => site.name,
    },
    {
      key: "status",
      label: t("sites.table.status"),
      sortable: true,
      render: (site) => <SiteStatusBadge status={site.status} />,
      exportValue: (site) => site.status,
    },
    {
      key: "location",
      label: t("sites.table.location"),
      render: (site) => (
        <span className="text-sm truncate block max-w-[200px]">
          {getSiteFullLocation(site)}
        </span>
      ),
      exportValue: (site) => getSiteFullLocation(site),
      hideMobile: true, // Hide on mobile
    },
    {
      key: "city",
      label: t("sites.table.city"),
      sortable: true,
      render: (site) => site.city,
      exportValue: (site) => site.city,
      hideMobile: true, // Hide on mobile
    },
    /* {
      key: "area",
      label: t("sites.table.area"),
      align: "center",
      render: (site) =>
        site.area ? (
          <span className="text-sm">{formatSiteArea(site.area)}</span>
        ) : (
          <span className="text-[var(--text-tertiary)]">-</span>
        ),
      exportValue: (site) => (site.area ? formatSiteArea(site.area) : "-"),
      hideMobile: true, // Hide on mobile
    }, */
    {
      key: "actions",
      label: t("common.actionsLabel", { defaultValue: "الإجراءات" }),
      align: "center",
      render: (site) => <SiteActions site={site} />,
      excludeFromExport: true,
    },
  ];

  // Show loading skeleton
  if (isLoading) {
    return (
      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t("sites.error.loadFailed")}</AlertDescription>
      </Alert>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-[var(--bg-surface-secondary)] p-6">
              <Building2 className="h-12 w-12 text-[var(--text-tertiary)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("sites.empty.title")}
              </h3>
              <p className="text-[var(--text-tertiary)] max-w-md">
                {filters.search || filters.status || filters.city
                  ? t("sites.empty.noResultsDescription")
                  : t("sites.empty.description")}
              </p>
            </div>
            {canCreate && (
              <Button asChild>
                <Link to="/sites/create">{t("sites.actions.add")}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render DataTable with all features
  return (
    <DataTable<SiteEntity>
      data={data}
      columns={columns}
      keyExtractor={(site) => site.id}
      enableClientSorting={true}
      enableSelection={false}
      enableCompactMode={true}
      enableHoverActions={false}
      enableExport={true}
      exportFilename="sites_list"
      exportTitle={t("sites.title")}
      pagination={{
        currentPage: meta?.page || 1,
        pageSize: meta?.pageSize || 10,
        totalItems: meta?.totalItems || 0,
        totalPages: meta?.totalPages || 1,
      }}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );
};
