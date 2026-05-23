/**
 * Employee Deductions List Page
 *
 * Main page for managing employee deductions with approval workflow.
 *
 * Features:
 * - Statistics (total, pending approval, approved)
 * - Type-based filtering
 * - Approval workflow for manual-approval types
 * - Auto-approval indicator for auto-approved types
 * - Advanced filtering
 * - Permission-based actions
 *
 * @page EmployeeDeductionsListPage
 * @module Payroll
 */

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { DollarSign, Clock, CheckCircle2, Trash2, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { InfoCard } from "@/components/common/InfoCard";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass, type StatusTone } from "@/components/common/statusBadgeStyles";
import {
  useEmployeeDeductions,
  useApproveEmployeeDeduction,
  useRejectEmployeeDeduction,
  useDeletedEmployeeDeductions,
  useRestoreEmployeeDeduction,
  useEmployeeDeductionsStatistics,
} from "@/hooks/useEmployeeDeductions";
import {
  EmployeeDeductionsTable,
  DeductionApprovalDialog,
} from "@/features/payroll/components/employee-deductions";
import { EmployeeDeductionsFilters } from "@/features/payroll/components/employee-deductions/EmployeeDeductionsFilters";
import type {
  EmployeeDeductionFiltersDto,
  EmployeeDeductionEntity,
  DeductionType,
} from "@/types/payroll.types";
import { DeductionStatus } from "@/types/payroll.types";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDate } from "@/lib/utils";
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

export const EmployeeDeductionsListPage = () => {
  const { t } = useTranslation();
  const { isSuperAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

  const [filters, setFilters] = useState<EmployeeDeductionFiltersDto>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] =
    useState<EmployeeDeductionEntity | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const { data, isLoading } = useEmployeeDeductions(filters);
  const { data: statsData, isLoading: statsLoading } =
    useEmployeeDeductionsStatistics({
      employeeId: filters.employeeId,
      deductionType: filters.deductionType,
      loanId: filters.loanId,
    });
  const { data: deletedData, isLoading: deletedLoading } =
    useDeletedEmployeeDeductions(
      {
        page: filters.page || 1,
        limit: filters.limit || 10,
      },
      isSuperAdmin && activeTab === "deleted",
    );
  const approveMutation = useApproveEmployeeDeduction();
  const rejectMutation = useRejectEmployeeDeduction();
  const restoreMutation = useRestoreEmployeeDeduction();

  const statistics = useMemo(
    () =>
      statsData ?? {
        total: 0,
        pending: 0,
        approved: 0,
      },
    [statsData],
  );

  const handleFiltersChange = (newFilters: EmployeeDeductionFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.status !== prev.status ||
        newFilters.deductionTypeId !== prev.deductionTypeId;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page || prev.page || 1),
      };
    });
  };

  const handleApprove = (deduction: EmployeeDeductionEntity) => {
    setSelectedDeduction(deduction);
    setApprovalDialogOpen(true);
  };

  const handleReject = (deduction: EmployeeDeductionEntity) => {
    setSelectedDeduction(deduction);
    setApprovalDialogOpen(true);
  };

  const handleApprovalDialogApprove = async (notes?: string) => {
    if (!selectedDeduction) return;

    try {
      await approveMutation.mutateAsync({
        id: selectedDeduction.id,
        data: {
          notes,
          rowVersion: selectedDeduction.rowVersion,
        },
      });
      setApprovalDialogOpen(false);
      setSelectedDeduction(null);
    } catch (error) {
    }
  };

  const handleApprovalDialogReject = async (rejectionReason: string) => {
    if (!selectedDeduction) return;

    try {
      await rejectMutation.mutateAsync({
        id: selectedDeduction.id,
        data: {
          rejectionReason,
          rowVersion: selectedDeduction.rowVersion,
        },
      });
      setApprovalDialogOpen(false);
      setSelectedDeduction(null);
    } catch (error) {
    }
  };

  const handleRestore = () => {
    if (restoreId) {
      restoreMutation.mutate(restoreId, {
        onSuccess: () => {
          setRestoreId(null);
        },
      });
    }
  };

  const getDeductionTypeBadge = (type: DeductionType) => {
    const tones: Record<DeductionType, StatusTone> = {
      LOAN_REPAYMENT: "info",
      INSURANCE: "purple",
      TAX: "neutral",
      PENALTY: "danger",
      ADVANCE_DEDUCTION: "info",
      ABSENCE: "danger",
      OTHER: "neutral",
    };

    return (
      <Badge className={getStatusBadgeClass(tones[type])}>
        {t(`payroll.employeeDeductions.deductionType.${type}`)}
      </Badge>
    );
  };

  // Deleted deductions table configuration
  const deletedDeductionsColumns: ColumnConfig<EmployeeDeductionEntity>[] = [
    {
      key: "employee",
      label: t("payroll.employeeDeductions.table.employee"),
      align: "start",
      render: (deduction) => (
        <div>
          <div className="font-medium">
            {deduction.employee?.firstName} {deduction.employee?.lastName}
          </div>
          <div className="text-xs text-muted-foreground">
            {deduction.employee?.employeeNumber}
          </div>
        </div>
      ),
      exportValue: (deduction) =>
        `${deduction.employee?.firstName} ${deduction.employee?.lastName} (${deduction.employee?.employeeNumber})`,
    },
    {
      key: "deductionType",
      label: t("payroll.employeeDeductions.table.deductionType"),
      align: "start",
      render: (deduction) => getDeductionTypeBadge(deduction.deductionType),
      exportValue: (deduction) =>
        t(
          `payroll.employeeDeductions.deductionType.${deduction.deductionType}`,
        ),
    },
    {
      key: "amount",
      label: t("payroll.employeeDeductions.table.amount"),
      align: "end",
      sortable: true,
      render: (deduction) =>
        `${deduction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${t("common.currency")}`,
      exportValue: (deduction) => deduction.amount,
    },
    {
      key: "deductionDate",
      label: t("payroll.employeeDeductions.table.deductionDate"),
      align: "center",
      sortable: true,
      render: (deduction) => formatDate(deduction.deductionDate),
      exportValue: (deduction) => formatDate(deduction.deductionDate),
    },
    {
      key: "deletedAt",
      label: t("payroll.employeeDeductions.deleted.deletedAt"),
      align: "center",
      sortable: true,
      render: (deduction) =>
        deduction.deletedAt ? formatDate(deduction.deletedAt) : "-",
      exportValue: (deduction) =>
        deduction.deletedAt ? formatDate(deduction.deletedAt) : "-",
    },
    {
      key: "deletedBy",
      label: t("payroll.employeeDeductions.deleted.deletedBy"),
      align: "start",
      render: (deduction) => deduction.deletedBy || "-",
      exportValue: (deduction) => deduction.deletedBy || "-",
    },
  ];

  const deletedDeductionsActions: ActionButton<EmployeeDeductionEntity>[] = [
    {
      label: t("payroll.employeeDeductions.deleted.restore"),
      icon: <Undo2 className="h-4 w-4" />,
      onClick: (deduction) => setRestoreId(deduction.id),
      variant: "default",
    },
  ];

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("payroll.employeeDeductions.list.title")}
        description={t("payroll.employeeDeductions.list.description")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard
          icon={DollarSign}
          label={t("payroll.employeeDeductions.statistics.total")}
          value={statsLoading ? "..." : statistics.total}
          variant="blue"
          valueSize="xl"
        />
        <InfoCard
          icon={Clock}
          label={t("payroll.employeeDeductions.status.pendingApproval")}
          value={statsLoading ? "..." : statistics.pending}
          variant="orange"
          valueSize="xl"
        />
        <InfoCard
          icon={CheckCircle2}
          label={t("payroll.employeeDeductions.status.approved")}
          value={statsLoading ? "..." : statistics.approved}
          variant="green"
          valueSize="xl"
        />
      </div>

      {/* Tabs for Active vs Deleted Deductions */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "active" | "deleted")}
        className="space-y-6"
      >
        <div className="flex items-center justify-center">
          <TabsList
            className={`${isSuperAdmin ? "grid grid-cols-2 w-[400px]" : "grid grid-cols-1 w-[200px]"}`}
          >
            <TabsTrigger value="active" className="text-base">
              {t("payroll.employeeDeductions.tabs.active", {
                defaultValue: "ا�\u001e� شطة",
              })}
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="deleted" className="text-base">
                <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t("payroll.employeeDeductions.tabs.deleted", {
                  defaultValue: "ا�\u001e�&حذ��فة",
                })}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="active" className="space-y-4">
          <EmployeeDeductionsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          <EmployeeDeductionsTable
            deductions={data?.data || []}
            isLoading={isLoading}
            totalCount={data?.total || 0}
            page={filters.page || 1}
            pageSize={filters.limit || 10}
            onPageChange={(page) =>
              setFilters((prev) => ({ ...prev, page }))
            }
            onPageSizeChange={(limit) =>
              setFilters((prev) => ({ ...prev, limit, page: 1 }))
            }
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="deleted" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <DataTable<EmployeeDeductionEntity>
                  data={deletedData?.data || []}
                  columns={deletedDeductionsColumns}
                  actions={deletedDeductionsActions}
                  keyExtractor={(deduction) => deduction.id}
                  isLoading={deletedLoading}
                  enableClientSorting={true}
                  defaultSort={{ column: "deletedAt", direction: "desc" }}
                  enableExport={true}
                  exportFilename="deleted_employee_deductions"
                  exportTitle={
                    t("payroll.employeeDeductions.list.title") +
                    " - " +
                    t("payroll.employeeDeductions.deleted.title")
                  }
                  emptyMessage={t(
                    "payroll.employeeDeductions.deleted.noDeleted",
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {selectedDeduction && (
        <DeductionApprovalDialog
          deduction={selectedDeduction}
          isOpen={approvalDialogOpen}
          onClose={() => {
            setApprovalDialogOpen(false);
            setSelectedDeduction(null);
          }}
          onApprove={handleApprovalDialogApprove}
          onReject={handleApprovalDialogReject}
        />
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("payroll.employeeDeductions.restore.confirm")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("payroll.employeeDeductions.restore.confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending
                ? t("common.loading")
                : t("payroll.employeeDeductions.deleted.restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default EmployeeDeductionsListPage;
