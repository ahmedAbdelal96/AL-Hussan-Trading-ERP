/**
 * Employee Loans Table Component - Full Implementation
 *
 * Comprehensive table with loan approval workflow and payment tracking.
 *
 * Features:
 * - Display loans with progress bars
 * - Loan status badges
 * - Monthly installment display
 * - Outstanding balance calculation
 * - Inline approve/reject for pending
 * - Record payment button for active
 * - View details for all statuses
 * - Edit (pending only)
 * - Delete confirmation
 * - Export functionality
 *
 * Business Rules:
 * - Only pending loans can be approved/rejected/edited
 * - Only active loans can have payments recorded
 * - Progress bar shows payment completion
 *
 * @component EmployeeLoansTable
 * @module Payroll/EmployeeLoans
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { Link } from "react-router-dom";
import { CheckCircle, Eye, Edit, Trash2, Receipt } from "lucide-react";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
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
import { LoanStatusBadge } from "@/features/payroll/components/common/LoanStatusBadge";
import { LoanProgressBar } from "@/features/payroll/components/common/LoanProgressBar";
import { LoanApprovalDialog } from "./LoanApprovalDialog";
import { LoanPaymentDialog } from "./LoanPaymentDialog";
import {
  useDeleteEmployeeLoan,
  useApproveEmployeeLoan,
} from "@/hooks/useEmployeeLoans";
import type { EmployeeLoanEntity } from "@/types/payroll.types";
import { LoanStatus } from "@/types/payroll.types";

interface EmployeeLoansTableProps {
  loans: EmployeeLoanEntity[];
  isLoading?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEdit?: (loan: EmployeeLoanEntity) => void;
  showEmployeeColumn?: boolean;
}

/**
 * EmployeeLoansTable Component
 */
export const EmployeeLoansTable = ({
  loans,
  isLoading = false,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onEdit,
  showEmployeeColumn = true,
}: EmployeeLoansTableProps) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<EmployeeLoanEntity | null>(
    null,
  );

  const deleteMutation = useDeleteEmployeeLoan();
  const approveMutation = useApproveEmployeeLoan();
  const canApprove = can({
    roles: [
      SYSTEM_ROLES.FIN_MANAGER,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.SUPERADMIN,
    ],
    permissions: [PERMISSIONS.PAYROLL_APPROVE],
  });
  const canManageLoan = can({
    roles: [
      SYSTEM_ROLES.HR_MANAGER,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.SUPERADMIN,
    ],
    permissions: [PERMISSIONS.PAYROLL_WRITE],
  });
  const canDeleteLoan = can({
    roles: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
  });
  console.log("EmployeeLoansTable render", {
    loans,
    isLoading,
    totalCount,
    page,
    pageSize,
  });
  /**
   * Open approval dialog
   */
  const openApprovalDialog = (loan: EmployeeLoanEntity) => {
    setSelectedLoan(loan);
    setApprovalDialogOpen(true);
  };

  /**
   * Open payment dialog
   */
  const openPaymentDialog = (loan: EmployeeLoanEntity) => {
    setSelectedLoan(loan);
    setPaymentDialogOpen(true);
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (!selectedLoan) return;

    try {
      await deleteMutation.mutateAsync(selectedLoan.id);
      setDeleteDialogOpen(false);
      setSelectedLoan(null);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  /**
   * Quick approve (inline)
   */
  const handleQuickApprove = async (loan: EmployeeLoanEntity) => {
    try {
      await approveMutation.mutateAsync({
        id: loan.id,
        data: { rowVersion: loan.rowVersion },
      });
    } catch {
      // Error handled by mutation hook
    }
  };

  /** Get employee display name */
  const getEmployeeName = (loan: EmployeeLoanEntity) => {
    if (loan.employee) {
      return `${loan.employee.firstName} ${loan.employee.lastName}`.trim();
    }
    return loan.employeeId.slice(0, 8);
  };

  /** Calculate paid amount */
  const getPaidAmount = (loan: EmployeeLoanEntity) => {
    return Math.max(loan.amount - loan.remainingAmount, 0);
  };

  /**
   * Table columns
   */
  const columns: ColumnConfig<EmployeeLoanEntity>[] = [
    ...(showEmployeeColumn
      ? [
          {
            key: "employee",
            label: t("payroll.employeeLoans.columns.employee"),
            align: "start" as const,
            render: (loan: EmployeeLoanEntity) => (
              <Link
                to={`/hr/employees/${loan.employeeId}`}
                className="font-medium hover:underline"
              >
                {getEmployeeName(loan)}
              </Link>
            ),
            exportValue: (loan: EmployeeLoanEntity) => getEmployeeName(loan),
          },
        ]
      : []),
    {
      key: "amount",
      label: t("payroll.employeeLoans.columns.totalAmount"),
      align: "start" as const,
      render: (loan) => (
        <div className="font-semibold">{loan.amount.toLocaleString()}</div>
      ),
      exportValue: (loan) => loan.amount,
    },
    {
      key: "installments",
      label: t("payroll.employeeLoans.columns.installments"),
      align: "start" as const,
      render: (loan) => {
        const monthlyInstallment =
          loan.installmentAmount || loan.amount / loan.installments;

        return (
          <div className="space-y-1">
            <div className="font-medium">
              {loan.installments} {t("payroll.employeeLoans.fields.months")}
            </div>
            <div className="text-xs text-muted-foreground">
              {monthlyInstallment.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {t("payroll.common.currency")}/
              {t("payroll.employeeLoans.fields.month")}
            </div>
          </div>
        );
      },
      exportValue: (loan) => loan.installments,
    },
    {
      key: "progress",
      label: t("payroll.employeeLoans.columns.progress"),
      align: "start" as const,
      render: (loan) => {
        const paidAmount = getPaidAmount(loan);

        return (
          <div className="space-y-2 min-w-[200px]">
            <LoanProgressBar
              loan={{
                amount: loan.amount,
                remainingAmount: loan.remainingAmount,
                installments: loan.installments,
                paidInstallments: loan.paidInstallments,
              }}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-success-main font-medium">
                {paidAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {t("payroll.common.currency")}
              </span>
              <span className="text-muted-foreground">
                {t("payroll.employeeLoans.remaining")}:{" "}
                {loan.remainingAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {t("payroll.common.currency")}
              </span>
            </div>
          </div>
        );
      },
      excludeFromExport: true,
    },
    {
      key: "notes",
      label: t("payroll.employeeLoans.columns.notes", {
        defaultValue: "Notes",
      }),
      align: "start" as const,
      render: (loan) => (
        <div className="max-w-[240px] truncate" title={loan.notes || ""}>
          {loan.notes?.trim()
            ? loan.notes
            : t("payroll.employeeLoans.columns.noNotes", {
                defaultValue: "-",
              })}
        </div>
      ),
      exportValue: (loan) => loan.notes || "",
    },
    {
      key: "status",
      label: t("payroll.employeeLoans.columns.status"),
      align: "center" as const,
      render: (loan) => <LoanStatusBadge status={loan.status} loan={loan} />,
      exportValue: (loan) => loan.status,
    },
    {
      key: "actions",
      label: t("payroll.common.columns.actions"),
      align: "end" as const,
      excludeFromExport: true,
      render: (loan) => {
        const isPending = loan.status === LoanStatus.PENDING;
        const isApproved = loan.status === LoanStatus.APPROVED;
        const isFullyPaid = loan.remainingAmount <= 0;
        const canDelete = isPending;

        return (
          <div className="flex items-center gap-2 justify-end">
            {isPending && canApprove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuickApprove(loan)}
                className="text-success-main hover:text-success-dark hover:bg-success-main/10"
                title={t("payroll.common.actions.approve")}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {isApproved && !isFullyPaid && canManageLoan && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openPaymentDialog(loan)}
                className="text-primary-main hover:text-primary-dark hover:bg-primary-main/10"
                title={t("payroll.employeeLoans.payment.recordPayment")}
              >
                <Receipt className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => openApprovalDialog(loan)}
              title={t("payroll.common.actions.view")}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {isPending && canManageLoan && onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(loan)}
                title={t("payroll.common.actions.edit")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {canDelete && canDeleteLoan && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedLoan(loan);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive hover:text-destructive-dark hover:bg-destructive/10"
                title={t("payroll.common.actions.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={loans}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        pagination={
          totalCount
            ? {
                currentPage: page,
                pageSize,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
              }
            : undefined
        }
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        enableExport={true}
        exportFilename="employee-loans"
        exportTitle="Employee Loans"
      />

      {/* Approval Dialog */}
      <LoanApprovalDialog
        loan={selectedLoan}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
      />

      {/* Payment Dialog */}
      <LoanPaymentDialog
        loan={selectedLoan}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("payroll.employeeLoans.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("payroll.employeeLoans.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("payroll.common.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive-dark"
            >
              {t("payroll.common.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
