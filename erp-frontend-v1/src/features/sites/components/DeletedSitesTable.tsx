/**
 * Deleted Sites Table Component - Enhanced with DataTable v3.1
 *
 * Production-ready table for displaying deleted sites with restore capability:
 * - Full theme integration (light/dark mode)
 * - Complete i18n support (Arabic/English)
 * - RTL support with proper alignment
 * - Loading, error, and empty states
 * - Advanced pagination with page size selector
 * - Restore action for each site
 * - Deletion metadata display
 * - Responsive design (mobile friendly)
 * - Accessibility optimized
 *
 * @component DeletedSitesTable
 * @version 1.0
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { useQuery } from "@tanstack/react-query";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { RotateCcw, Building2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useRestoreSite } from "@/hooks/useSites";
import { sitesApi } from "@/services/api/sites.api";
import { SiteStatusBadge } from "./SiteStatusBadge";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS } from "@/config/permissions.constants";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SiteEntity, SiteFiltersDto } from "@/types/sites.types";

interface DeletedSitesTableProps {
  filters: SiteFiltersDto;
  onFiltersChange: (filters: SiteFiltersDto) => void;
}

/**
 * DeletedSitesTable Component
 * Table for displaying deleted sites with restore functionality
 */
export const DeletedSitesTable = ({
  filters,
  onFiltersChange,
}: DeletedSitesTableProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const restoreSiteMutation = useRestoreSite();

  // Fetch deleted sites
  const { data, isLoading, error } = useQuery({
    queryKey: ["sites", "deleted", filters],
    queryFn: () => sitesApi.getAllDeleted(filters),
  });

  const sites = data?.data || [];
  const meta = data?.meta;

  // State for restore confirmation dialog
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [siteToRestore, setSiteToRestore] = useState<SiteEntity | null>(null);

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
      pageSize: newPageSize,
      page: 1,
    });
  };

  /**
   * Handle restore action
   */
  const handleRestoreClick = (site: SiteEntity) => {
    setSiteToRestore(site);
    setRestoreDialogOpen(true);
  };

  /**
   * Confirm restore
   */
  const handleConfirmRestore = async () => {
    if (!siteToRestore) return;

    try {
      await restoreSiteMutation.mutateAsync(siteToRestore.id);
      setRestoreDialogOpen(false);
      setSiteToRestore(null);
    } catch (error) {
      console.error("Failed to restore site:", error);
    }
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
          <span className="font-medium text-foreground">{site.name}</span>
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
      key: "city",
      label: t("sites.table.city"),
      sortable: true,
      render: (site) => site.city,
      exportValue: (site) => site.city,
      hideMobile: true,
    },
    {
      key: "deletedAt",
      label: t("sites.table.deletedAt"),
      sortable: true,
      render: (site) =>
        site.deletedAt ? (
          <span className="text-sm text-muted-foreground">
            {format(new Date(site.deletedAt), "PPP", {
              locale: language === "ar" ? ar : undefined,
            })}
          </span>
        ) : (
          "-"
        ),
      exportValue: (site) =>
        site.deletedAt
          ? format(new Date(site.deletedAt), "yyyy-MM-dd HH:mm")
          : "-",
      hideMobile: true,
    },
    {
      key: "actions",
      label: t("common.actionsLabel"),
      align: "center",
      render: (site) => (
        <PermissionGate permissions={[PERMISSIONS.SITE_DELETE]}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestoreClick(site)}
            disabled={restoreSiteMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t("sites.actions.restore")}
          </Button>
        </PermissionGate>
      ),
      excludeFromExport: true,
    },
  ];

  // Show loading skeleton
  if (isLoading) {
    return (
      <Card>
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
  if (!sites || sites.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-muted p-6">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                {t("sites.deleted.empty.title")}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {t("sites.deleted.empty.description")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render DataTable with all features
  return (
    <>
      <DataTable<SiteEntity>
        data={sites}
        columns={columns}
        keyExtractor={(site) => site.id}
        enableClientSorting={true}
        enableSelection={false}
        enableCompactMode={true}
        enableExport={true}
        exportFilename="deleted_sites"
        exportTitle={t("sites.deleted.title")}
        pagination={{
          currentPage: meta?.page || 1,
          pageSize: meta?.pageSize || 10,
          totalItems: meta?.totalItems || 0,
          totalPages: meta?.totalPages || 1,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("sites.restore.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("sites.restore.confirmMessage", {
                name: siteToRestore?.name || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={restoreSiteMutation.isPending}
            >
              {restoreSiteMutation.isPending
                ? t("common.loading")
                : t("sites.actions.restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
