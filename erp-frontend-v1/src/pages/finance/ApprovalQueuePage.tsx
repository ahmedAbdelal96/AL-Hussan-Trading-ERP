/**
 * Approval Queue Page
 *
 * Centralized page for reviewing and approving pending costs.
 *
 * Features:
 * - View all PENDING costs
 * - Quick approve/reject actions
 * - Bulk operations (select multiple)
 * - Detailed preview in modal
 * - Filter by amount, date, project
 * - Statistics dashboard
 *
 * @page ApprovalQueuePage
 * @version 1.0
 */

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { getCurrentLocale, CURRENCY } from "@/config/system.constants";
import { showToast } from "@/lib/toast";
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  CheckSquare,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useProjectCosts,
  useApproveProjectCost,
  useRejectProjectCost,
} from "@/hooks/useFinance";
import type {
  ProjectCostFiltersDto,
  ProjectCostEntity,
} from "@/types/finance.types";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { CostFilters } from "@/features/finance/components/CostFilters";
import { ApprovalDialog } from "@/components/common/ApprovalDialog";
import { RejectionDialog } from "@/components/common/RejectionDialog";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

export const ApprovalQueuePage = () => {
  const { t } = useTranslation();
  const { can } = usePermissions();

  // State management
  const [filters, setFilters] = useState<ProjectCostFiltersDto>({
    page: 1,
    limit: 20,
    paymentStatus: "PENDING", // Only show pending costs
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<ProjectCostEntity | null>(
    null,
  );

  // Data fetching
  const { data, isLoading } = useProjectCosts(filters);
  const approveMutation = useApproveProjectCost();
  const rejectMutation = useRejectProjectCost();

  // Memoized costs array
  const costs = useMemo(() => {
    return data?.data || [];
  }, [data]);

  /**
   * Check if user can approve
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
   * Handle toggle selection
   */
  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  /**
   * Handle select all
   */
  const handleSelectAll = () => {
    if (selectedIds.size === costs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(costs.map((c) => c.id)));
    }
  };

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: ProjectCostFiltersDto) => {
    setFilters(() => ({ ...newFilters, paymentStatus: "PENDING" }));
  };

  /**
   * Reset filters
   */
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      paymentStatus: "PENDING",
    });
  };

  /**
   * Open approval dialog
   */
  const handleOpenApprovalDialog = useCallback(
    (cost: ProjectCostEntity) => {
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
   * Open rejection dialog
   */
  const handleOpenRejectionDialog = useCallback(
    (cost: ProjectCostEntity) => {
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
      // Remove from selected if was selected
      if (selectedIds.has(cost.id)) {
        const newSelected = new Set(selectedIds);
        newSelected.delete(cost.id);
        setSelectedIds(newSelected);
      }
    } catch (_error) {
      // Error handled by hook
    }
  };

  /**
   * Handle cost rejection
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
      // Remove from selected if was selected
      if (selectedIds.has(cost.id)) {
        const newSelected = new Set(selectedIds);
        newSelected.delete(cost.id);
        setSelectedIds(newSelected);
      }
    } catch (_error) {
      // Error handled by hook
    }
  };

  /**
   * Handle bulk approve
   */
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    try {
      const promises = Array.from(selectedIds)
        .map((id) => costs.find((c) => c.id === id))
        .filter((cost): cost is ProjectCostEntity => !!cost)
        .map((cost) =>
          approveMutation.mutateAsync({
            id: cost.id,
            data: { rowVersion: cost.rowVersion },
          }),
        );
      await Promise.all(promises);
      showToast.success(
        t("finance.approvals.bulkApproveSuccess", {
          count: selectedIds.size,
        }) || `Approved ${selectedIds.size} costs`,
      );
      setSelectedIds(new Set());
    } catch (_error) {
      showToast.error(
        t("finance.approvals.bulkApproveError") ||
          "Failed to approve some costs",
      );
    }
  };

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
   * Calculate statistics
   */
  const statistics = useMemo(() => {
    const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const oldestDate = costs.length
      ? Math.min(...costs.map((c) => new Date(c.transactionDate).getTime()))
      : Date.now();
    const avgAmount = costs.length ? totalAmount / costs.length : 0;

    return {
      total: costs.length,
      totalAmount,
      avgAmount,
      oldestDays: Math.floor((Date.now() - oldestDate) / (1000 * 60 * 60 * 24)),
    };
  }, [costs]);

  /**
   * DataTable columns configuration
   */
  const columns: ColumnConfig<ProjectCostEntity>[] = useMemo(() => {
    const baseColumns: ColumnConfig<ProjectCostEntity>[] = [
      {
        key: "transactionDate",
        label: t("finance.costs.table.transactionDate"),
        render: (cost) => {
          const daysDiff = Math.floor(
            (Date.now() - new Date(cost.transactionDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return (
            <div>
              <div className="font-medium">
                {formatDate(cost.transactionDate)}
              </div>
              {daysDiff > 7 && (
                <div className="text-xs text-orange-600 font-medium">
                  {daysDiff} {t("finance.approvals.daysAgo")}
                </div>
              )}
            </div>
          );
        },
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
            {cost.project && (
              <div className="text-xs text-blue-600 mt-1">
                {cost.project.projectCode} - {cost.project.name}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "amount",
        label: t("finance.costs.table.amount"),
        render: (cost) => (
          <div className="text-right">
            <div className="font-semibold text-lg">
              {formatAmount(cost.amount, cost.currency)}
            </div>
            {cost.category && (
              <Badge className={getStatusBadgeClass("neutral", "mt-1")}>
                {cost.category.name}
              </Badge>
            )}
          </div>
        ),
        align: "end",
        sortable: true,
      },
      {
        key: "creator",
        label: t("finance.costs.table.createdBy"),
        render: (cost) => (
          <div className="text-sm">
            {cost.creator
              ? `${cost.creator.firstName} ${cost.creator.lastName}`
              : "-"}
          </div>
        ),
      },
    ];

    if (!canApprove) {
      return baseColumns;
    }

    return [
      {
        key: "select",
        label: (
          <Checkbox
            checked={selectedIds.size === costs.length && costs.length > 0}
            onCheckedChange={handleSelectAll}
          />
        ),
        render: (cost) => (
          <Checkbox
            checked={selectedIds.has(cost.id)}
            onCheckedChange={() => handleToggleSelection(cost.id)}
          />
        ),
        width: "50px",
      },
      ...baseColumns,
    ];
  }, [t, canApprove, selectedIds, costs]);

  /**
   * DataTable actions configuration
   */
  const actions: ActionButton<ProjectCostEntity>[] = useMemo(() => {
    const baseActions: ActionButton<ProjectCostEntity>[] = [
      {
        label: t("finance.costs.actions.view"),
        icon: <Eye className="h-4 w-4" />,
        onClick: (cost) => {
          window.location.href = `/finance/costs/${cost.id}`;
        },
        variant: "ghost",
      },
    ];

    if (!canApprove) return baseActions;

    return [
      ...baseActions,
      {
        label: t("finance.costs.actions.approve"),
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: handleOpenApprovalDialog,
        variant: "ghost",
        className: "text-success hover:text-success/80",
      },
      {
        label: t("finance.costs.actions.reject"),
        icon: <XCircle className="h-4 w-4" />,
        onClick: handleOpenRejectionDialog,
        variant: "ghost",
        className: "text-destructive hover:text-destructive/80",
      },
    ];
  }, [t, canApprove, handleOpenApprovalDialog, handleOpenRejectionDialog]);

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
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("finance.approvals.title")}
        description={t("finance.approvals.description")}
        icon={<Clock className="h-7 w-7 text-primary" />}
        actions={
          canApprove && selectedIds.size > 0 ? (
            <Button
              onClick={handleBulkApprove}
              className="gap-2"
              disabled={approveMutation.isPending}
            >
              <CheckSquare className="h-4 w-4" />
              {t("finance.approvals.approveSelected")} ({selectedIds.size})
            </Button>
          ) : null
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("finance.approvals.pendingCosts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("finance.approvals.waitingApproval")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("finance.approvals.totalAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                formatAmount(statistics.totalAmount, CURRENCY.DEFAULT).split(
                  ".",
                )[0]
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("finance.approvals.pendingValue")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("finance.approvals.avgAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {
                formatAmount(statistics.avgAmount, CURRENCY.DEFAULT).split(
                  ".",
                )[0]
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("finance.approvals.perCost")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("finance.approvals.oldestPending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statistics.oldestDays}
              <span className="text-lg ml-1">
                {t("finance.approvals.days")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("finance.approvals.waiting")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      {!canApprove && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              {t("finance.approvals.viewOnlyMode")}
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {t("finance.approvals.viewOnlyDescription")}
            </p>
          </div>
        </div>
      )}

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
        emptyMessage={t("finance.approvals.empty")}
        keyExtractor={(cost) => cost.id}
        enableCompactMode
        enableExport
        exportFilename="pending_approvals"
        exportTitle={t("finance.approvals.title")}
      />

      {/* Approval Dialog */}
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">
                  {t("finance.costs.fields.amount")}
                </p>
                <p className="font-semibold text-lg">
                  {formatAmount(cost.amount, cost.currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {t("finance.costs.fields.costType")}
                </p>
                <Badge className={getStatusBadgeClass("info", "mt-1")}>
                  {t(`finance.costs.costTypes.${cost.costType}`)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">
                {t("finance.costs.fields.description")}
              </p>
              <p className="text-sm">{cost.description}</p>
            </div>
            {cost.invoiceNumber && (
              <div>
                <p className="text-muted-foreground text-sm mb-1">
                  {t("finance.costs.fields.invoiceNumber")}
                </p>
                <p className="text-sm font-mono">{cost.invoiceNumber}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm mb-1">
                {t("finance.costs.fields.transactionDate")}
              </p>
              <p className="text-sm">{formatDate(cost.transactionDate)}</p>
            </div>
          </div>
        )}
      />

      {/* Rejection Dialog */}
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">
                  {t("finance.costs.fields.amount")}
                </p>
                <p className="font-semibold text-lg">
                  {formatAmount(cost.amount, cost.currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {t("finance.costs.fields.costType")}
                </p>
                <Badge className={getStatusBadgeClass("info", "mt-1")}>
                  {t(`finance.costs.costTypes.${cost.costType}`)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">
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

export default ApprovalQueuePage;
