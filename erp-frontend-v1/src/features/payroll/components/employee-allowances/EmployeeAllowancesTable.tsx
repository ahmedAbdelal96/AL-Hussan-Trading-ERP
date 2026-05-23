/**
 * Employee Allowances Table Component - Full Implementation
 *
 * Production-ready table with approval workflow integration.
 *
 * Features:
 * - Approval status indicators
 * - Inline approve/reject actions
 * - Monthly equivalent display
 * - Frequency badges
 * - Advanced filtering
 * - Export functionality
 * - Responsive design
 *
 * Business Logic:
 * - Only pending allowances can be approved/rejected
 * - Approval actions trigger dialog
 * - Monthly equivalent calculated based on frequency
 *
 * @component EmployeeAllowancesTable
 * @module Payroll
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { Link } from "react-router-dom";
import { Trash2, CheckCircle, XCircle, Eye } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useDeleteEmployeeAllowance,
  useApproveEmployeeAllowance,
  useRejectEmployeeAllowance,
} from "@/hooks/useEmployeeAllowances";
import {
  AllowanceFrequencyBadge,
  MonthlyEquivalentDisplay,
} from "@/features/payroll/components/common";
import { AllowanceApprovalDialog } from "./AllowanceApprovalDialog";
import type {
  EmployeeAllowanceEntity,
  EmployeeAllowanceFiltersDto,
} from "@/types/payroll.types";

interface EmployeeAllowancesTableProps {
  data: EmployeeAllowanceEntity[];
  total: number;
  isLoading: boolean;
  filters: EmployeeAllowanceFiltersDto;
  onFiltersChange: (filters: EmployeeAllowanceFiltersDto) => void;
}

/**
 * EmployeeAllowancesTable Component
 */
export const EmployeeAllowancesTable = ({
  data,
  total,
  isLoading,
  filters,
  onFiltersChange,
}: EmployeeAllowancesTableProps) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const deleteMutation = useDeleteEmployeeAllowance();
  const approveMutation = useApproveEmployeeAllowance();
  const rejectMutation = useRejectEmployeeAllowance();
  const canApprove = can({
    roles: [
      SYSTEM_ROLES.FIN_MANAGER,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.SUPERADMIN,
    ],
    permissions: [PERMISSIONS.PAYROLL_APPROVE],
  });
  const canManageAllowance = can({
    roles: [
      SYSTEM_ROLES.HR_MANAGER,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.SUPERADMIN,
    ],
    permissions: [PERMISSIONS.PAYROLL_WRITE],
  });
  const canDeleteAllowance = can({
    roles: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
  });

  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedAllowance, setSelectedAllowance] =
    useState<EmployeeAllowanceEntity | null>(null);

  /**
   * Handle delete
   */
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /**
   * Handle approve
   */
  const handleApprove = async (id: string, notes: string) => {
    try {
      const allowance = data.find((item) => item.id === id);
      await approveMutation.mutateAsync({
        id,
        data: { notes, rowVersion: allowance?.rowVersion },
      });
    } catch (error) {
      console.error("Approve error:", error);
      throw error;
    }
  };

  /**
   * Handle reject
   */
  const handleReject = async (id: string, notes: string) => {
    try {
      const allowance = data.find((item) => item.id === id);
      await rejectMutation.mutateAsync({
        id,
        data: { rejectionReason: notes, rowVersion: allowance?.rowVersion },
      });
    } catch (error) {
      console.error("Reject error:", error);
      throw error;
    }
  };

  /**
   * Open approval dialog
   */
  const openApprovalDialog = (allowance: EmployeeAllowanceEntity) => {
    setSelectedAllowance(allowance);
    setApprovalDialogOpen(true);
  };

  /**
   * Column Configuration
   */
  const columns: ColumnConfig<EmployeeAllowanceEntity>[] = [
    // Employee
    {
      key: "employeeId",
      label: t("payroll.employeeAllowances.table.employee"),
      render: (allowance) => (
        <Link
          to={`/employees/${allowance.employeeId}`}
          className="font-medium text-primary-main hover:underline"
        >
          {allowance.employee
            ? `${allowance.employee.firstName} ${allowance.employee.lastName}`
            : allowance.employeeId.slice(0, 8)}
        </Link>
      ),
      align: "start",
      exportValue: (allowance) =>
        allowance.employee
          ? `${allowance.employee.firstName} ${allowance.employee.lastName}`
          : allowance.employeeId,
    },

    // Allowance Type
    {
      key: "allowanceTypeId",
      label: t("payroll.employeeAllowances.table.allowanceType"),
      render: (allowance) => (
        <span className="text-sm">
          {allowance.allowanceType?.name ||
            allowance.allowanceTypeId.slice(0, 8)}
        </span>
      ),
      align: "start",
      hideMobile: true,
      exportValue: (allowance) =>
        allowance.allowanceType?.name || allowance.allowanceTypeId,
    },

    // Amount & Monthly Equivalent
    {
      key: "amount",
      label: t("payroll.employeeAllowances.table.amount"),
      render: (allowance) => (
        <div className="flex flex-col items-end">
          <span className="font-mono font-semibold">
            {allowance.amount.toLocaleString()} {t("payroll.common.currency")}
          </span>
          <MonthlyEquivalentDisplay
            amount={allowance.amount}
            frequency={allowance.frequency}
            className="text-xs"
          />
        </div>
      ),
      align: "end",
      exportValue: (allowance) => allowance.amount,
    },

    // Frequency
    {
      key: "frequency",
      label: t("payroll.employeeAllowances.table.frequency"),
      render: (allowance) => (
        <AllowanceFrequencyBadge frequency={allowance.frequency} />
      ),
      align: "center",
      exportValue: (allowance) =>
        t(`payroll.allowanceFrequency.${allowance.frequency}`),
    },

    // Date Range
    {
      key: "effectiveFrom",
      label: t("payroll.employeeAllowances.table.dateRange"),
      render: (allowance) => (
        <div className="flex flex-col text-sm">
          <span>{new Date(allowance.effectiveFrom).toLocaleDateString()}</span>
          {allowance.effectiveTo && (
            <span className="text-muted-foreground">
              → {new Date(allowance.effectiveTo).toLocaleDateString()}
            </span>
          )}
        </div>
      ),
      align: "center",
      hideMobile: true,
      exportValue: (allowance) => {
        const start = new Date(allowance.effectiveFrom).toLocaleDateString();
        const end = allowance.effectiveTo
          ? new Date(allowance.effectiveTo).toLocaleDateString()
          : "Ongoing";
        return `${start} - ${end}`;
      },
    },

    // Approval Status
    {
      key: "status",
      label: t("payroll.employeeAllowances.table.status"),
      render: (allowance) => (
        <Badge
          variant={
            allowance.status === "APPROVED"
              ? "success"
              : allowance.status === "REJECTED"
                ? "destructive"
                : "secondary"
          }
        >
          {t(`payroll.employeeAllowances.status.${allowance.status}`)}
        </Badge>
      ),
      align: "center",
      exportValue: (allowance) =>
        t(`payroll.employeeAllowances.status.${allowance.status}`),
    },

    // Actions
    {
      key: "actions",
      label: t("payroll.common.actions.title"),
      render: (allowance) => (
        <div className="flex items-center justify-end gap-2">
          {/* View/Approve Button */}
          {allowance.status === "PENDING" && canApprove ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openApprovalDialog(allowance)}
              title={t("payroll.employeeAllowances.actions.approve")}
            >
              <CheckCircle className="h-4 w-4 text-success-600" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openApprovalDialog(allowance)}
              title={t("common.actions.view")}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {/* Edit - handled via delete & recreate for pending allowances */}

          {/* Delete Button */}
          {canDeleteAllowance && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-error-600" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("payroll.employeeAllowances.actions.deleteConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "payroll.employeeAllowances.actions.deleteConfirmDescription",
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("common.actions.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(allowance.id)}
                    className="bg-error-600 hover:bg-error-700"
                  >
                    {t("common.actions.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
      align: "end",
      exportValue: () => "",
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        enableHoverActions={false}
        emptyMessage={t("payroll.employeeAllowances.table.empty")}
        keyExtractor={(item) => item.id}
        pagination={{
          currentPage: filters.page || 1,
          pageSize: filters.limit || 10,
          totalItems: total,
          totalPages: Math.ceil(total / (filters.limit || 10)),
        }}
        onPageChange={(page) => onFiltersChange({ ...filters, page })}
        onPageSizeChange={(limit) =>
          onFiltersChange({ ...filters, limit, page: 1 })
        }
      />

      {/* Approval Dialog */}
      <AllowanceApprovalDialog
        allowance={selectedAllowance}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
};
