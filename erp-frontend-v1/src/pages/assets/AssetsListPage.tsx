/**
 * Assets List Page
 *
 * Main page for viewing and managing all assets
 * Features: Filtering, Sorting, Pagination, Quick Actions
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useAssets, useAssetsStatistics, useDeleteAsset } from "@/hooks/useAssets";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssetsFilters } from "@/components/assets/AssetsFilters";
import { AssetActions } from "@/components/assets/AssetActions";
import { AssetStatusBadge } from "@/components/assets/AssetStatusBadge";
import { AssetTypeBadge } from "@/components/assets/AssetTypeBadge";
import {
  AssetFiltersDto,
  AssetEntity,
  AssetStatus,
} from "@/types/assets.types";
import { Plus, Package } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import { KpiStrip } from "@/components/common/KpiStrip";

import { useState } from "react";

export const AssetsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission(PERMISSIONS.ASSET_WRITE);

  // Filters state
  const [filters, setFilters] = useState<AssetFiltersDto>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch assets
  const { data, isLoading, error } = useAssets(filters);
  const { data: statsData } = useAssetsStatistics();

  const handleStatusClick = (status: AssetFiltersDto["status"]) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? undefined : status,
      page: 1,
    }));
  };
  const handleFiltersChange = (newFilters: AssetFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.assetType !== prev.assetType ||
        newFilters.status !== prev.status ||
        newFilters.category !== prev.category ||
        newFilters.manufacturer !== prev.manufacturer ||
        newFilters.currentLocation !== prev.currentLocation;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : newFilters.page || prev.page || 1,
      };
    });
  };
  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Asset table columns configuration
  const assetColumns: ColumnConfig<AssetEntity>[] = [
    {
      key: "assetNumber",
      label: t("assets.table.assetNumber", { defaultValue: "Asset #" }),
      align: "start",
      sortable: true,
      render: (asset) => (
        <span className="font-medium font-mono">{asset.assetNumber}</span>
      ),
      exportValue: (asset) => asset.assetNumber,
    },
    {
      key: "name",
      label: t("assets.table.name", { defaultValue: "Name" }),
      align: "start",
      sortable: true,
      render: (asset) => (
        <div>
          <p className="font-medium">{asset.name}</p>
        </div>
      ),
      exportValue: (asset) => asset.name,
    },
    {
      key: "assetType",
      label: t("assets.table.type", { defaultValue: "Type" }),
      align: "center",
      sortable: true,
      render: (asset) => <AssetTypeBadge type={asset.assetType} />,
      exportValue: (asset) => asset.assetType,
    },
    {
      key: "status",
      label: t("assets.table.status", { defaultValue: "Status" }),
      align: "center",
      sortable: true,
      render: (asset) => <AssetStatusBadge status={asset.status} />,
      exportValue: (asset) => asset.status,
    },
    {
      key: "currentLocation",
      label: t("assets.table.location", { defaultValue: "Location" }),
      align: "start",
      render: (asset) =>
        asset.currentLocation || (
          <span className="text-[var(--text-tertiary)]">-</span>
        ),
      exportValue: (asset) => asset.currentLocation || "-",
    },
    {
      key: "actions",
      label: t("assets.table.actions", { defaultValue: "Actions" }),
      align: "center",
      render: (asset) => <AssetActions asset={asset} />,
      excludeFromExport: true,
    },
  ];

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("assets.title", { defaultValue: "Assets Management" })}
        description={t("assets.subtitle", {
          defaultValue: "Manage company assets, assignments, and maintenance",
        })}
        icon={<Package className="h-7 w-7 text-primary" />}
        actions={
          canWrite ? (
            <Button onClick={() => navigate("/assets/create")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("assets.actions.create", { defaultValue: "Create Asset" })}
            </Button>
          ) : null
        }
      />

      {/* Fleet Status Strip */}
      {statsData && (
        <KpiStrip
          items={[
            {
              label: t("assets.status.IN_USE", { defaultValue: "In Use" }),
              value: statsData.inUseAssets.toLocaleString("en-US"),
              accent: "var(--info)",
              active: filters.status === AssetStatus.IN_USE,
              onClick: () => handleStatusClick(AssetStatus.IN_USE),
            },
            {
              label: t("assets.status.AVAILABLE", {
                defaultValue: "Available",
              }),
              value: statsData.availableAssets.toLocaleString("en-US"),
              accent: "var(--success)",
              active: filters.status === AssetStatus.AVAILABLE,
              onClick: () => handleStatusClick(AssetStatus.AVAILABLE),
            },
            {
              label: t("assets.status.UNDER_MAINTENANCE", {
                defaultValue: "Under Maintenance",
              }),
              value: statsData.underMaintenanceAssets.toLocaleString("en-US"),
              accent: "var(--warning)",
              active: filters.status === AssetStatus.UNDER_MAINTENANCE,
              onClick: () =>
                handleStatusClick(AssetStatus.UNDER_MAINTENANCE),
            },
            {
              label: t("assets.status.OUT_OF_SERVICE", {
                defaultValue: "Out of Service",
              }),
              value: statsData.outOfServiceAssets.toLocaleString("en-US"),
              accent: "var(--error)",
              active: filters.status === AssetStatus.OUT_OF_SERVICE,
              onClick: () => handleStatusClick(AssetStatus.OUT_OF_SERVICE),
            },
            {
              label: t("assets.status.utilizationRate", {
                defaultValue: "Utilization",
              }),
              value: `${statsData.utilizationRate.toFixed(1)}%`,
              accent: "var(--primary-light)",
            },
          ]}
        />
      )}

      {/* Main Content */}
      <div className="space-y-5">
        {/* Filters Section */}
        <AssetsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        {/* Assets Table */}
        <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {t("assets.nav.list", { defaultValue: "Assets List" })}
              </span>
              {data && (
                <span className="text-sm font-normal text-[var(--text-tertiary)]">
                  {data.total} {t("common.total", { defaultValue: "total" })}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<AssetEntity>
              data={data?.data || []}
              columns={assetColumns}
              keyExtractor={(asset) => asset.id}
              isLoading={isLoading}
              error={error}
              enableClientSorting={false}
              enableExport={true}
              exportFilename="assets_list"
              exportTitle={t("assets.title", { defaultValue: "Assets" })}
              emptyMessage={t("assets.messages.noAssets", {
                defaultValue: "No assets found",
              })}
              pagination={{
                currentPage: data?.page || 1,
                pageSize: data?.limit || 20,
                totalItems: data?.total || 0,
                totalPages: data ? Math.ceil(data.total / data.limit) : 1,
              }}
              onPageChange={handlePageChange}
              onPageSizeChange={(pageSize) =>
                setFilters((prev) => ({ ...prev, limit: pageSize, page: 1 }))
              }
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};
