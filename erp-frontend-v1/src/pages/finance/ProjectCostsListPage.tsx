/**
 * Project Costs List Page - Enhanced Version
 *
 * Professional cost management page with:
 * - Advanced filtering system with debounced search
 * - Comprehensive statistics cards with trends
 * - Excel/PDF/CSV export functionality
 * - Responsive data table with actions
 * - Optimized performance
 *
 * Performance Optimizations:
 * - Memoized data transformations
 * - Component-level code splitting
 * - Efficient re-renders
 *
 * @page ProjectCostsListPage
 * @version 2.0
 */

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { getCurrentLocale, CURRENCY } from "@/config/system.constants";
import { showToast } from "@/lib/toast";
import { Link } from "react-router-dom";
import {
  Plus,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart3,
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
import {
  useProjectCosts,
  useDeleteProjectCost,
  useApproveProjectCost,
  useRejectProjectCost,
  useFinanceStatistics,
} from "@/hooks/useFinance";
import type {
  ProjectCostFiltersDto,
  PaymentStatus,
  ProjectCostEntity,
} from "@/types/finance.types";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { CostFilters } from "@/features/finance/components/CostFilters";
import { CostStatistics } from "@/features/finance/components/CostStatistics";
import { CostExport } from "@/features/finance/components/CostExport";
import { ApprovalDialog } from "@/components/common/ApprovalDialog";
import { RejectionDialog } from "@/components/common/RejectionDialog";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";

export const ProjectCostsListPage = () => {
  const { t } = useTranslation();
  const { hasPermission, can } = usePermissions();

  // State management
  const [filters, setFilters] = useState<ProjectCostFiltersDto>({
    page: 1,
    limit: 20,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Approval/Rejection state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<ProjectCostEntity | null>(
    null,
  );

  // Data fetching
  const { data, isLoading } = useProjectCosts(filters);
  const { data: financeStats } = useFinanceStatistics();
  const deleteMutation = useDeleteProjectCost();
  const approveMutation = useApproveProjectCost();
  const rejectMutation = useRejectProjectCost();

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

  const canExport = useMemo(
    () => hasPermission(PERMISSIONS.FINANCE_EXPORT),
    [hasPermission],
  );

  /**
   * Check if current user can approve costs
   * SUPERADMIN has all permissions automatically
   */
  const canApprove = useMemo(() => {
    return can({
      roles: [
        SYSTEM_ROLES.SUPERADMIN,
        SYSTEM_ROLES.ADMIN,
        SYSTEM_ROLES.FIN_MANAGER,
      ],
      permissions: [PERMISSIONS.FINANCE_APPROVE],
    });
  }, [can]);

  /**
   * Handle filter changes
   * Resets page to 1 when filters change
   */
  const handleFiltersChange = (newFilters: ProjectCostFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.projectId !== prev.projectId ||
        newFilters.costType !== prev.costType ||
        newFilters.categoryId !== prev.categoryId ||
        newFilters.paymentStatus !== prev.paymentStatus ||
        newFilters.isAllocated !== prev.isAllocated ||
        newFilters.referenceType !== prev.referenceType ||
        newFilters.referenceId !== prev.referenceId ||
        newFilters.dateFrom !== prev.dateFrom ||
        newFilters.dateTo !== prev.dateTo ||
        newFilters.minAmount !== prev.minAmount ||
        newFilters.maxAmount !== prev.maxAmount ||
        newFilters.createdBy !== prev.createdBy ||
        newFilters.approvedBy !== prev.approvedBy;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : newFilters.page || prev.page || 1,
      };
    });
  };

  /**
   * Reset all filters to initial state
   */
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  /**
   * Handle cost deletion with confirmation
   */
  const handleDelete = async () => {
    if (!deleteId) return;
    const targetCost = costs.find((cost) => cost.id === deleteId);
    try {
      await deleteMutation.mutateAsync({
        id: deleteId,
        rowVersion: targetCost?.rowVersion,
      });
      setDeleteId(null);
    } catch (_error) {
      // Error handled by hook with toast notification
    }
  };

  /**
   * Open approval dialog for a specific cost
   * Only allowed for pending costs
   */
  const handleOpenApprovalDialog = useCallback(
    (cost: ProjectCostEntity) => {
      // Safety check - only pending costs can be approved
      if (cost.paymentStatus !== "PENDING") {
        showToast.error(
          t("finance.costs.approval.onlyPendingError") ||
            "Only pending costs can be approved",
        );
        return;
      }
      setSelectedCost(cost);
      setApprovalDialogOpen(true);
    },
    [t],
  );

  /**
   * Open rejection dialog for a specific cost
   * Only allowed for pending costs
   */
  const handleOpenRejectionDialog = useCallback(
    (cost: ProjectCostEntity) => {
      // Safety check - only pending costs can be rejected
      if (cost.paymentStatus !== "PENDING") {
        showToast.error(
          t("finance.costs.rejection.onlyPendingError") ||
            "Only pending costs can be rejected",
        );
        return;
      }
      setSelectedCost(cost);
      setRejectionDialogOpen(true);
    },
    [t],
  );

  /**
   * Handle cost approval
   * Calls backend API and updates cache
   */
  const handleApprove = async (cost: ProjectCostEntity, notes?: string) => {
    try {
      await approveMutation.mutateAsync({
        id: cost.id,
        data: {
          ...(notes ? { notes } : {}),
          rowVersion: cost.rowVersion,
        },
      });
      setApprovalDialogOpen(false);
      setSelectedCost(null);
    } catch (_error) {
      // Error handled by hook with toast notification
    }
  };

  /**
   * Handle cost rejection
   * Calls backend API with rejection reason
   */
  const handleReject = async (cost: ProjectCostEntity, reason: string) => {
    try {
      await rejectMutation.mutateAsync({
        id: cost.id,
        data: {
          rejectedReason: reason,
          rowVersion: cost.rowVersion,
        },
      });
      setRejectionDialogOpen(false);
      setSelectedCost(null);
    } catch (_error) {
      // Error handled by hook with toast notification
    }
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
   * Format currency with proper localization
   */
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(getCurrentLocale(), {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  /**
   * Format date in current locale
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
            <div className="max-w-xs truncate">{cost.description}</div>
            {cost.invoiceNumber && (
              <div className="text-xs text-[var(--text-tertiary)]">
                {cost.invoiceNumber}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "project",
        label: t("finance.costs.details.labels.project"),
        render: (cost) => {
          if (!cost.project)
            return <span className="text-[var(--text-tertiary)]">-</span>;
          return (
            <Link
              to={`/finance/projects/${cost.projectId}/summary`}
              className="text-primary hover:underline font-medium text-sm"
            >
              {cost.project.name}
            </Link>
          );
        },
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
            <span className="text-[var(--text-tertiary)]">-</span>
          );
        },
      },
      {
        key: "amount",
        label: t("finance.costs.table.amount"),
        render: (cost) => (
          <span className="font-semibold">
            {formatAmount(cost.amount, cost.currency)}
          </span>
        ),
        align: "end",
        sortable: true,
        exportValue: (cost) => cost.amount,
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
   *
   * Action Visibility Rules:
   * - View: Always visible for all statuses
   * - Edit: PENDING only
   * - Approve: PENDING only (requires permission)
   * - Reject: PENDING only (requires permission)
   * - Delete: PENDING or REJECTED only
   *
   * APPROVED/PAID costs: View-only (no edit/delete/approve/reject)
   */
  const actions: ActionButton<ProjectCostEntity>[] = useMemo(() => {
    // View action - always visible
    const baseActions: ActionButton<ProjectCostEntity>[] = [
      {
        label: t("finance.costs.actions.view"),
        icon: <Eye className="h-4 w-4" />,
        onClick: (cost) => {
          window.location.href = `/finance/costs/${cost.id}`;
        },
        variant: "ghost",
      },
      {
        label: t("finance.budget.title"),
        icon: <BarChart3 className="h-4 w-4" />,
        onClick: (cost) => {
          window.location.href = `/finance/projects/${cost.projectId}/summary`;
        },
        variant: "ghost",
        show: (cost) => !!cost.projectId,
      },
    ];

    // Edit action - PENDING only
    const editAction: ActionButton<ProjectCostEntity>[] = canWrite
      ? [
          {
            label: t("finance.costs.actions.edit"),
            icon: <Edit className="h-4 w-4" />,
            onClick: (cost) => {
              window.location.href = `/finance/costs/${cost.id}/edit`;
            },
            variant: "ghost",
            show: (cost) => cost.paymentStatus === "PENDING",
          },
        ]
      : [];

    // Approval actions - PENDING only (requires approve permission)
    const approvalActions: ActionButton<ProjectCostEntity>[] = canApprove
      ? [
          {
            label: t("finance.costs.actions.approve"),
            icon: <CheckCircle className="h-4 w-4" />,
            onClick: handleOpenApprovalDialog,
            variant: "ghost",
            className: "text-[var(--success)] hover:opacity-80",
            show: (cost) => cost.paymentStatus === "PENDING",
          },
          {
            label: t("finance.costs.actions.reject"),
            icon: <XCircle className="h-4 w-4" />,
            onClick: handleOpenRejectionDialog,
            variant: "ghost",
            className: "text-[var(--error)] hover:opacity-80",
            show: (cost) => cost.paymentStatus === "PENDING",
          },
        ]
      : [];

    // Delete action - PENDING or REJECTED only (cannot delete approved/paid costs)
    const deleteAction: ActionButton<ProjectCostEntity>[] = canDelete
      ? [
          {
            label: t("finance.costs.actions.delete"),
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (cost) => setDeleteId(cost.id),
            variant: "ghost",
            className: "text-[var(--error)] hover:opacity-80",
            show: (cost) =>
              cost.paymentStatus === "PENDING" ||
              cost.paymentStatus === "REJECTED",
          },
        ]
      : [];

    return [...baseActions, ...editAction, ...approvalActions, ...deleteAction];
  }, [
    t,
    canWrite,
    canDelete,
    canApprove,
    handleOpenApprovalDialog,
    handleOpenRejectionDialog,
  ]);

  /**
   * Pagination info for DataTable
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
          <DollarSign className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-[var(--text-tertiary)]">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("finance.costs.title")}
        description={t("finance.costs.description")}
        icon={<DollarSign className="h-7 w-7 text-primary" />}
        actions={
          <>
            {canExport && <CostExport costs={costs} filename="project_costs" />}
            {canWrite && (
              <Button asChild className="gap-2">
                <Link to="/finance/costs/create">
                  <Plus className="h-4 w-4" />
                  {t("finance.costs.actions.create")}
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Statistics Cards with Trends */}
      <CostStatistics summary={financeStats} currency={CURRENCY.DEFAULT} />

      {/* Advanced Filters */}
      <CostFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Data Table with Pagination */}
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
        emptyMessage={t("finance.costs.empty")}
        keyExtractor={(cost) => cost.id}
        enableCompactMode
        enableHoverActions
        enableExport
        exportFilename="project_costs"
        exportTitle={t("finance.costs.title")}
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
              onClick={handleDelete}
              className="bg-[var(--error)] text-[var(--text-on-brand)] hover:opacity-90"
            >
              {t("finance.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approval Dialog - Generic Component */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        title={t("finance.costs.approval.title")}
        description={t("finance.costs.approval.description")}
        item={selectedCost}
        onApprove={handleApprove}
        isLoading={approveMutation.isPending}
        notesLabel={t("finance.costs.approval.notesLabel")}
        notesPlaceholder={t("finance.costs.approval.notesPlaceholder")}
        confirmText={t("finance.costs.approval.confirm")}
        renderContent={(cost) => (
          <div className="space-y-3">
            {/* Cost Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[var(--text-tertiary)]">
                  {t("finance.costs.fields.amount")}
                </p>
                <p className="font-semibold text-lg">
                  {formatAmount(cost.amount, cost.currency)}
                </p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">
                  {t("finance.costs.fields.costType")}
                </p>
                <Badge className={getStatusBadgeClass("info", "mt-1")}>
                  {t(`finance.costs.costTypes.${cost.costType}`)}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[var(--text-tertiary)] text-sm mb-1">
                {t("finance.costs.fields.description")}
              </p>
              <p className="text-sm">{cost.description}</p>
            </div>

            {/* Invoice Number if exists */}
            {cost.invoiceNumber && (
              <div>
                <p className="text-[var(--text-tertiary)] text-sm mb-1">
                  {t("finance.costs.fields.invoiceNumber")}
                </p>
                <p className="text-sm font-mono">{cost.invoiceNumber}</p>
              </div>
            )}

            {/* Transaction Date */}
            <div>
              <p className="text-[var(--text-tertiary)] text-sm mb-1">
                {t("finance.costs.fields.transactionDate")}
              </p>
              <p className="text-sm">{formatDate(cost.transactionDate)}</p>
            </div>
          </div>
        )}
      />

      {/* Rejection Dialog - Generic Component */}
      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        title={t("finance.costs.rejection.title")}
        description={t("finance.costs.rejection.description")}
        item={selectedCost}
        onReject={handleReject}
        isLoading={rejectMutation.isPending}
        reasonLabel={t("finance.costs.rejection.reasonLabel")}
        reasonPlaceholder={t("finance.costs.rejection.reasonPlaceholder")}
        confirmText={t("finance.costs.rejection.confirm")}
        minReasonLength={10}
        maxReasonLength={500}
        warningMessage={t("finance.costs.rejection.warning")}
        renderContent={(cost) => (
          <div className="space-y-3">
            {/* Cost Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[var(--text-tertiary)]">
                  {t("finance.costs.fields.amount")}
                </p>
                <p className="font-semibold text-lg">
                  {formatAmount(cost.amount, cost.currency)}
                </p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">
                  {t("finance.costs.fields.costType")}
                </p>
                <Badge className={getStatusBadgeClass("info", "mt-1")}>
                  {t(`finance.costs.costTypes.${cost.costType}`)}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[var(--text-tertiary)] text-sm mb-1">
                {t("finance.costs.fields.description")}
              </p>
              <p className="text-sm">{cost.description}</p>
            </div>
          </div>
        )}
      />
    </PageShell>
  );
};

export default ProjectCostsListPage;
