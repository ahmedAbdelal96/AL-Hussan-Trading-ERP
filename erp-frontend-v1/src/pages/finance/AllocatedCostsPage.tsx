/**
 * Allocated Costs Management Page
 *
 * Manages costs that are distributed across multiple projects.
 *
 * Features:
 * - View all allocated costs
 * - Edit allocation distribution
 * - Convert single-project cost to allocated
 * - Convert allocated cost back to single-project
 * - Detailed allocation breakdown
 * - Filter by project, date range, status
 *
 * @page AllocatedCostsPage
 * @version 1.0
 */

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { getCurrentLocale, CURRENCY } from "@/config/system.constants";
import { showToast } from "@/lib/toast";
import { Link } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowLeftRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useProjectCosts, useDeleteProjectCost } from "@/hooks/useFinance";
import type {
  ProjectCostFiltersDto,
  ProjectCostEntity,
  PaymentStatus,
} from "@/types/finance.types";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { CostFilters } from "@/features/finance/components/CostFilters";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";

export const AllocatedCostsPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  // State management
  const [filters, setFilters] = useState<ProjectCostFiltersDto>({
    page: 1,
    limit: 20,
    isAllocated: true, // Only show allocated costs
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Data fetching
  const { data, isLoading } = useProjectCosts(filters);
  const deleteMutation = useDeleteProjectCost();

  // Memoized costs array
  const costs = useMemo(() => {
    return data?.data || [];
  }, [data]);

  const canWrite = useMemo(
    () => hasPermission(PERMISSIONS.FINANCE_WRITE),
    [hasPermission],
  );
  const canDelete = useMemo(
    () => hasPermission(PERMISSIONS.FINANCE_DELETE),
    [hasPermission],
  );

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: ProjectCostFiltersDto) => {
    setFilters(() => ({ ...newFilters, isAllocated: true }));
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      isAllocated: true,
    });
  };

  /**
   * Get status badge with appropriate styling
   */
  const getStatusBadge = useCallback(
    (status: PaymentStatus) => {
      const configs = {
        PENDING: {
          label: t("finance.costs.paymentStatus.PENDING"),
        },
        APPROVED: {
          label: t("finance.costs.paymentStatus.APPROVED"),
        },
        PAID: {
          label: t("finance.costs.paymentStatus.PAID"),
        },
        REJECTED: {
          label: t("finance.costs.paymentStatus.REJECTED"),
        },
        PARTIALLY_PAID: {
          label: t("finance.costs.paymentStatus.PARTIALLY_PAID"),
        },
        OVERDUE: {
          label: t("finance.costs.paymentStatus.OVERDUE"),
        },
      };
      const config = configs[status] || configs.PENDING;
      return (
        <Badge className={getStatusBadgeClass(getStatusTone(status))}>
          {config.label}
        </Badge>
      );
    },
    [t],
  );

  /**
   * Format currency
   */
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(getCurrentLocale(), {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getCurrentLocale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * DataTable columns configuration
   */
  const columns: ColumnConfig<ProjectCostEntity>[] = useMemo(
    () => [
      {
        key: "transactionDate",
        label: t("finance.costs.table.transactionDate"),
        render: (cost) => (
          <span className="font-medium">
            {formatDate(cost.transactionDate)}
          </span>
        ),
        sortable: true,
      },
      {
        key: "description",
        label: t("finance.costs.table.description"),
        render: (cost) => (
          <div>
            <div className="max-w-xs truncate font-medium">
              {cost.description}
            </div>
            {cost.invoiceNumber && (
              <div className="text-xs text-muted-foreground">
                {cost.invoiceNumber}
              </div>
            )}
            {/* Allocation indicator */}
            <div className="flex items-center gap-1 mt-1">
              <ArrowLeftRight className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                {cost.allocations?.length || 0}{" "}
                {t("finance.allocations.projects")}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "category",
        label: t("finance.costs.table.costType"),
        render: (cost) => {
          const categoryName = cost.category?.name;
          return categoryName ? (
            <Badge className={getStatusBadgeClass("neutral")}>
              {categoryName}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        key: "amount",
        label: t("finance.costs.table.amount"),
        render: (cost) => (
          <div className="text-right">
            <div className="font-semibold">
              {formatAmount(cost.amount, cost.currency)}
            </div>
            {/* Show allocation preview */}
            {cost.allocations && cost.allocations.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {cost.allocations.slice(0, 2).map((alloc) => (
                  <div key={alloc.id}>
                    {alloc.project?.name || alloc.project?.projectCode}:{" "}
                    {formatAmount(alloc.allocatedAmount, cost.currency)}
                  </div>
                ))}
                {cost.allocations.length > 2 && (
                  <div className="text-blue-600 font-medium">
                    +{cost.allocations.length - 2} {t("common.more")}
                  </div>
                )}
              </div>
            )}
          </div>
        ),
        align: "end",
        sortable: true,
      },
      {
        key: "paymentStatus",
        label: t("finance.costs.table.status"),
        render: (cost) => getStatusBadge(cost.paymentStatus),
      },
    ],
    [t, getStatusBadge],
  );

  /**
   * DataTable actions configuration
   */
  const actions: ActionButton<ProjectCostEntity>[] = useMemo(() => {
    const base: ActionButton<ProjectCostEntity>[] = [
      {
        label: t("finance.costs.actions.view"),
        icon: <Eye className="h-4 w-4" />,
        onClick: (cost) => {
          window.location.href = `/finance/costs/${cost.id}`;
        },
        variant: "ghost",
      },
    ];

    if (canWrite) {
      base.push({
        label: t("finance.allocations.editDistribution"),
        icon: <Edit className="h-4 w-4" />,
        onClick: (cost) => {
          window.location.href = `/finance/costs/${cost.id}/edit`;
        },
        variant: "ghost",
        show: (cost) => cost.paymentStatus === "PENDING",
      });
    }

    if (canDelete) {
      base.push({
        label: t("finance.costs.actions.delete"),
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (cost) => setDeleteId(cost.id),
        variant: "ghost",
        className: "text-destructive hover:text-destructive",
        show: (cost) =>
          cost.paymentStatus === "PENDING" || cost.paymentStatus === "REJECTED",
      });
    }

    return base;
  }, [t, canWrite, canDelete]);

  /**
   * Pagination info
   */
  const paginationInfo = useMemo(
    () =>
      data
        ? {
            currentPage: data.page,
            totalPages: data.totalPages,
            pageSize: data.limit,
            totalItems: data.total,
          }
        : undefined,
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("finance.allocations.title")}
        description={t("finance.allocations.description")}
        icon={<ArrowLeftRight className="h-7 w-7 text-primary" />}
        actions={
          canWrite ? (
            <Button asChild className="gap-2">
              <Link to="/finance/costs/create">
                <Plus className="h-4 w-4" />
                {t("finance.costs.actions.create")}
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">
            {t("finance.allocations.totalAllocated")}
          </div>
          <div className="text-2xl font-bold mt-1">{costs.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {t("finance.allocations.costs")}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">
            {t("finance.allocations.totalProjects")}
          </div>
          <div className="text-2xl font-bold mt-1">
            {costs.reduce(
              (sum, cost) => sum + (cost.allocations?.length || 0),
              0,
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {t("finance.allocations.allocations")}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">
            {t("finance.allocations.totalAmount")}
          </div>
          <div className="text-2xl font-bold mt-1">
            {formatAmount(
              costs.reduce((sum, cost) => sum + cost.amount, 0),
              CURRENCY.DEFAULT,
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {t("finance.allocations.distributed")}
          </div>
        </div>
      </div>

      {/* Filters */}
      <CostFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Data Table */}
      <DataTable
        data={costs}
        columns={columns}
        actions={actions}
        pagination={paginationInfo}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={(limit) =>
          setFilters((prev) => ({ ...prev, limit, page: 1 }))
        }
        pageSizeOptions={[10, 20, 50, 100]}
        isLoading={isLoading}
        emptyMessage={t("finance.allocations.empty")}
        keyExtractor={(cost) => cost.id}
        enableCompactMode
        enableExport
        exportFilename="allocated_costs"
        exportTitle={t("finance.allocations.title")}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("finance.costs.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("finance.costs.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("finance.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                const targetCost = costs.find((cost) => cost.id === deleteId);
                try {
                  await deleteMutation.mutateAsync({
                    id: deleteId,
                    rowVersion: targetCost?.rowVersion,
                  });
                  showToast.success(t("finance.costs.delete.success"));
                } catch {
                  showToast.error(t("finance.costs.delete.error"));
                } finally {
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              {t("finance.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default AllocatedCostsPage;
