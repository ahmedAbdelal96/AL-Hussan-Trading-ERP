/**
 * Sites List Page
 *
 * Main page for viewing and managing sites.
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSites } from "@/hooks/useSites";
import { SitesTable } from "@/features/sites/components/SitesTable";
import { SitesFilters } from "@/features/sites/components/SitesFilters";
import { SiteStats } from "@/features/sites/components/SiteStats";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS } from "@/config/permissions.constants";
import type { SiteFiltersDto } from "@/types/sites.types";

export const SitesListPage = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<SiteFiltersDto>({
    page: 1,
    pageSize: 10,
  });

  const { data, isLoading, error } = useSites(filters);

  const handleFiltersChange = (newFilters: SiteFiltersDto) => {
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
        title={t("sites.list.title")}
        description={t("sites.list.description")}
        actions={
          <>
            <PermissionGate permissions={[PERMISSIONS.SITE_DELETE]}>
              <Button variant="outline" asChild>
                <Link to="/sites/deleted">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("sites.actions.viewDeleted", {
                    defaultValue: "Deleted Sites",
                  })}
                </Link>
              </Button>
            </PermissionGate>

            <PermissionGate permissions={[PERMISSIONS.SITE_WRITE]}>
              <Button asChild>
                <Link to="/sites/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("sites.actions.add")}
                </Link>
              </Button>
            </PermissionGate>
          </>
        }
      />

      <SiteStats />

      <SitesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <SitesTable
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
