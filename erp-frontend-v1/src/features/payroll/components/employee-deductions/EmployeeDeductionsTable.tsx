/**
 * Employee Deductions Table Component - Full Implementation
 *
 * Comprehensive table for employee deductions with type-based display and approval workflow.
 *
 * Features:
 * - Display deductions with type badges
 * - Approval status badges
 * - Amount display
 * - Date display
 * - Edit, delete, approve, and reject actions
 * - Export functionality
 * - Type-specific styling
 * - Permission-based action visibility
 *
 * Business Rules:
 * - Auto-approved types: TAX, INSURANCE, LOAN_REPAYMENT
 * - Manual approval types: PENALTY, ABSENCE, ADVANCE_DEDUCTION, OTHER
 * - Only users with PAYROLL_APPROVE permission can approve/reject
 * - Approved deductions cannot be modified or deleted
 *
 * @component EmployeeDeductionsTable
 * @module Payroll/EmployeeDeductions
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { Link } from "react-router-dom";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
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
import { useDeleteEmployeeDeduction } from "@/hooks/useEmployeeDeductions";
import type {
  EmployeeDeductionEntity,
  DeductionType,
} from "@/types/payroll.types";
import { DeductionStatus } from "@/types/payroll.types";
import { DeductionStatusBadge } from "../common/DeductionStatusBadge";

interface EmployeeDeductionsTableProps {
  deductions: EmployeeDeductionEntity[];
  isLoading?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEdit?: (deduction: EmployeeDeductionEntity) => void;
  onApprove?: (deduction: EmployeeDeductionEntity) => void;
  onReject?: (deduction: EmployeeDeductionEntity) => void;
  onUnapprove?: (deduction: EmployeeDeductionEntity) => void;
  employeeId?: string; // Optional - if provided, hide employee column
}

/**
 * Get badge variant for deduction type
 */
const getDeductionTypeBadgeVariant = (
  type: DeductionType,
): "destructive" | "secondary" | "warning" | "default" => {
  switch (type) {
    case "PENALTY":
    case "ABSENCE":
      return "destructive";
    case "ADVANCE_DEDUCTION":
    case "OTHER":
      return "warning";
    case "TAX":
    case "INSURANCE":
      return "default";
    case "LOAN_REPAYMENT":
      return "secondary";
    default:
      return "secondary";
  }
};

/**
 * EmployeeDeductionsTable Component
 */
export const EmployeeDeductionsTable = ({
  deductions,
  isLoading = false,
  totalCount = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onApprove,
  onReject,
  onUnapprove,
  employeeId, // If provided, hide employee column
}: EmployeeDeductionsTableProps) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] =
    useState<EmployeeDeductionEntity | null>(null);

  const deleteMutation = useDeleteEmployeeDeduction();

  // Check if user has permission to approve deductions
  const canApprove = can({
    roles: [SYSTEM_ROLES.FIN_MANAGER, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
    permissions: [PERMISSIONS.PAYROLL_APPROVE],
  });
  const canManageDeduction = can({
    roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
    permissions: [PERMISSIONS.PAYROLL_WRITE],
  });
  const canDeleteDeduction = can({
    roles: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
  });

  const handleDelete = async () => {
    if (!selectedDeduction) return;

    try {
      await deleteMutation.mutateAsync(selectedDeduction.id);
      setDeleteDialogOpen(false);
      setSelectedDeduction(null);
    } catch {
      // Error handled by mutation hook
    }
  };

  /**
   * Table columns
   */
  const columns: ColumnConfig<EmployeeDeductionEntity>[] = [
    // Employee column - only show in list view, not in employee-specific view
    ...(!employeeId
      ? [
          {
            key: "employeeId",
            label: t("payroll.employeeDeductions.table.employee"),
            render: (deduction: EmployeeDeductionEntity) => (
              <Link
                to={`/hr/employees/${deduction.employeeId}`}
                className="font-medium hover:underline"
              >
                {deduction.employee
                  ? `${deduction.employee.firstName} ${deduction.employee.lastName}`
                  : deduction.employeeId.slice(0, 8)}
              </Link>
            ),
          } as ColumnConfig<EmployeeDeductionEntity>,
        ]
      : []),
    {
      key: "deductionType",
      label: t("payroll.employeeDeductions.table.deductionType"),
      render: (deduction: EmployeeDeductionEntity) => (
        <Badge variant={getDeductionTypeBadgeVariant(deduction.deductionType)}>
          {t(
            `payroll.employeeDeductions.deductionType.${deduction.deductionType}`,
          )}
        </Badge>
      ),
    },
    {
      key: "amount",
      label: t("payroll.employeeDeductions.table.amount"),
      render: (deduction: EmployeeDeductionEntity) => (
        <div className="font-semibold">
          {deduction.amount.toLocaleString()} {t("common.currency")}
        </div>
      ),
    },
    {
      key: "deductionDate",
      label: t("payroll.employeeDeductions.table.deductionDate"),
      render: (deduction: EmployeeDeductionEntity) => {
        const date = new Date(deduction.deductionDate);
        return <div className="text-sm">{date.toLocaleDateString()}</div>;
      },
    },
    {
      key: "reason",
      label: t("payroll.employeeDeductions.table.reason"),
      render: (deduction: EmployeeDeductionEntity) => (
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
          {deduction.reason || "-"}
        </div>
      ),
    },
    {
      key: "status",
      label: t("payroll.employeeDeductions.table.status"),
      render: (deduction: EmployeeDeductionEntity) => (
        <DeductionStatusBadge status={deduction.status} />
      ),
    },
    {
      key: "actions",
      label: t("payroll.employeeDeductions.table.actions"),
      render: (deduction: EmployeeDeductionEntity) => {
        const isPending = deduction.status === DeductionStatus.PENDING;
        const isApproved = deduction.status === DeductionStatus.APPROVED;

        return (
          <div className="flex items-center gap-1">
            {/* Approve/Reject - Only for PENDING deductions */}
            {isPending && canApprove && onApprove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onApprove(deduction)}
                className="text-success hover:text-success-dark hover:bg-success/10"
                title={t("payroll.employeeDeductions.actions.approve")}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}

            {isPending && canApprove && onReject && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReject(deduction)}
                className="text-destructive hover:text-destructive-dark hover:bg-destructive/10"
                title={t("payroll.employeeDeductions.actions.reject")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}

            {/* Unapprove - Only for APPROVED deductions */}
            {isApproved && canApprove && onUnapprove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onUnapprove(deduction)}
                className="text-warning hover:text-warning-dark hover:bg-warning/10"
                title={t("payroll.employeeDeductions.actions.unapprove")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}

            {/* Edit - Only for PENDING deductions */}
            {isPending && canManageDeduction && onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(deduction)}
                title={t("payroll.employeeDeductions.actions.edit")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {/* Delete - Only for PENDING deductions */}
            {isPending && canDeleteDeduction && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedDeduction(deduction);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive hover:text-destructive-dark hover:bg-destructive/10"
                title={t("payroll.employeeDeductions.actions.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
      excludeFromExport: true,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={deductions}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        pagination={
          totalCount
            ? {
                currentPage: page,
                pageSize: pageSize,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
              }
            : undefined
        }
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        enableExport={true}
        exportFilename="employee-deductions"
        exportTitle="Employee Deductions"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("payroll.employeeDeductions.delete.confirm")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.actions.deleteConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive-dark"
            >
              {t("common.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
