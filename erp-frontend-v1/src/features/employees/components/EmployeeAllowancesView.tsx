import { useState, useMemo } from "react";
import {
  Plus,
  TrendingUp,
  CheckCircle,
  Clock,
  Ban,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DataTable, type ColumnConfig } from "@/components/common/DataTable";
import {
  AllowanceFrequencyBadge,
  AllowanceStatusBadge,
  MonthlyEquivalentDisplay,
  calculateMonthlyEquivalent,
} from "@/features/payroll/components/common";
import { QuickAddAllowanceDialog } from "@/features/employees/components/QuickAddAllowanceDialog";
import { RejectAllowanceDialog } from "@/features/payroll/components/RejectAllowanceDialog";
import {
  useEmployeeAllowancesByEmployee,
  useApproveEmployeeAllowance,
  useRejectEmployeeAllowance,
  useDeleteEmployeeAllowance,
} from "@/hooks/useEmployeeAllowances";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import type { EmployeeAllowanceEntity } from "@/types/payroll.types";

interface EmployeeAllowancesViewProps {
  employeeId: string;
  className?: string;
  showAddButton?: boolean;
  enabled?: boolean;
}

function calculateAllowanceStatistics(allowances: EmployeeAllowanceEntity[]) {
  return allowances.reduce(
    (stats, allowance) => {
      if (allowance.status === "APPROVED") {
        stats.approvedCount++;
        const monthly = calculateMonthlyEquivalent(
          allowance.amount,
          allowance.frequency,
        );
        stats.totalMonthly += monthly;
      } else if (allowance.status === "PENDING") {
        stats.pendingCount++;
      } else if (allowance.status === "REJECTED") {
        stats.rejectedCount++;
      }
      return stats;
    },
    { totalMonthly: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 },
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export const EmployeeAllowancesView = ({
  employeeId,
  className = "",
  showAddButton = true,
  enabled = true,
}: EmployeeAllowancesViewProps) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [rejectDialogState, setRejectDialogState] = useState<{
    isOpen: boolean;
    allowanceId: string | null;
  }>({ isOpen: false, allowanceId: null });
  const [deleteAllowanceId, setDeleteAllowanceId] = useState<string | null>(null);

  const {
    data: allowances = [],
    isLoading,
    error,
  } = useEmployeeAllowancesByEmployee(employeeId, enabled);

  const approveMutation = useApproveEmployeeAllowance();
  const rejectMutation = useRejectEmployeeAllowance();
  const deleteMutation = useDeleteEmployeeAllowance();

  const canCreateAllowance = can({
    roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
    permissions: [PERMISSIONS.PAYROLL_WRITE],
  });

  const canApproveAllowance = can({
    roles: [SYSTEM_ROLES.FIN_MANAGER, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
    permissions: [PERMISSIONS.PAYROLL_APPROVE],
  });

  const canDeleteAllowance = can({
    roles: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
  });

  const statistics = useMemo(
    () => calculateAllowanceStatistics(allowances),
    [allowances],
  );

  const handleApprove = async (allowanceId: string) => {
    try {
      const allowance = allowances.find((item) => item.id === allowanceId);
      await approveMutation.mutateAsync({
        id: allowanceId,
        data: { rowVersion: allowance?.rowVersion },
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleReject = async (allowanceId: string, reason: string) => {
    try {
      const allowance = allowances.find((item) => item.id === allowanceId);
      await rejectMutation.mutateAsync({
        id: allowanceId,
        data: { rejectionReason: reason, rowVersion: allowance?.rowVersion },
      });
      setRejectDialogState({ isOpen: false, allowanceId: null });
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deleteAllowanceId) return;
    try {
      await deleteMutation.mutateAsync(deleteAllowanceId);
      setDeleteAllowanceId(null);
    } catch {
      // Error handled by mutation
    }
  };

  const columns: ColumnConfig<EmployeeAllowanceEntity>[] = [
    {
      key: "allowanceType",
      label: t("payroll.employeeAllowances.table.allowanceType", {
        defaultValue: "Allowance Type",
      }),
      render: (allowance) => (
        <div className="font-medium">
          {allowance.allowanceType?.name || t("common.unknown")}
        </div>
      ),
      sortable: true,
    },
    {
      key: "amount",
      label: t("payroll.employeeAllowances.table.amount", {
        defaultValue: "Amount",
      }),
      render: (allowance) => (
        <span className="font-semibold">
          {formatCurrency(allowance.amount)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "frequency",
      label: t("payroll.employeeAllowances.table.frequency", {
        defaultValue: "Frequency",
      }),
      render: (allowance) => (
        <AllowanceFrequencyBadge frequency={allowance.frequency} />
      ),
    },
    {
      key: "monthlyEquivalent",
      label: t("payroll.employeeAllowances.table.monthlyEquivalent", {
        defaultValue: "Monthly Equivalent",
      }),
      render: (allowance) => (
        <MonthlyEquivalentDisplay
          amount={allowance.amount}
          frequency={allowance.frequency}
        />
      ),
      sortable: true,
    },
    {
      key: "effectivePeriod",
      label: t("payroll.employeeAllowances.table.effectivePeriod", {
        defaultValue: "Effective Period",
      }),
      render: (allowance) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">
              {t("payroll.employeeAllowances.table.from", {
                defaultValue: "From:",
              })}
            </span>
            <span className="font-medium">
              {formatDate(allowance.effectiveFrom)}
            </span>
          </div>
          {allowance.effectiveTo && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">
                {formatDate(allowance.effectiveTo)}
              </span>
            </div>
          )}
          {!allowance.effectiveTo && (
            <div className="text-xs text-muted-foreground italic">
              {t("payroll.employeeAllowances.ongoing", {
                defaultValue: "Ongoing",
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: t("payroll.employeeAllowances.table.status", {
        defaultValue: "Status",
      }),
      render: (allowance) => <AllowanceStatusBadge allowance={allowance} />,
    },
    {
      key: "actions",
      label: t("payroll.employeeAllowances.table.actions", {
        defaultValue: "Actions",
      }),
      render: (allowance) => {
        const { status } = allowance;

        if (status === "PENDING" && canApproveAllowance) {
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleApprove(allowance.id)}
                disabled={approveMutation.isPending}
              >
                <Check className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t("payroll.employeeAllowances.actions.approve", {
                    defaultValue: "Approve",
                  })}
                </span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() =>
                  setRejectDialogState({
                    isOpen: true,
                    allowanceId: allowance.id,
                  })
                }
                disabled={rejectMutation.isPending}
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {t("payroll.employeeAllowances.actions.reject", {
                    defaultValue: "Reject",
                  })}
                </span>
              </Button>
            </div>
          );
        }

        // APPROVED and REJECTED can be deleted
        if (!canDeleteAllowance) return null;

        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteAllowanceId(allowance.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t("common.actions.delete", { defaultValue: "Delete" })}
            </span>
          </Button>
        );
      },
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("payroll.employeeAllowances.statistics.totalMonthly", {
            defaultValue: "Total Monthly",
          })}
          value={formatCurrency(statistics.totalMonthly)}
          icon={TrendingUp}
          iconColor="text-green-600"
          description={t("payroll.employeeAllowances.statistics.perMonth", {
            defaultValue: "per month",
          })}
        />
        <StatCard
          title={t("payroll.employeeAllowances.statistics.active", {
            defaultValue: "Approved",
          })}
          value={statistics.approvedCount}
          icon={CheckCircle}
          iconColor="text-green-600"
        />
        <StatCard
          title={t("payroll.employeeAllowances.statistics.pending", {
            defaultValue: "Pending",
          })}
          value={statistics.pendingCount}
          icon={Clock}
          iconColor="text-amber-600"
        />
        <StatCard
          title={t("payroll.employeeAllowances.statistics.inactive", {
            defaultValue: "Rejected",
          })}
          value={statistics.rejectedCount}
          icon={Ban}
          iconColor="text-[var(--text-secondary)]"
        />
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {t("payroll.employeeAllowances.list.title", {
              defaultValue: "Allowances List",
            })}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("payroll.employeeAllowances.list.description", {
              defaultValue: "Manage employee allowances and track status",
            })}
          </p>
        </div>
        {showAddButton && canCreateAllowance && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("payroll.employeeAllowances.actions.addNew", {
                defaultValue: "Add New",
              })}
            </span>
            <span className="sm:hidden">
              {t("common.actions.add", { defaultValue: "Add" })}
            </span>
          </Button>
        )}
      </div>

      {/* Allowances Table */}
      <DataTable
        columns={columns}
        data={allowances}
        keyExtractor={(allowance) => allowance.id}
        isLoading={isLoading}
        error={error ? new Error(error.message) : null}
        emptyMessage={t("payroll.employeeAllowances.list.empty", {
          defaultValue: "No allowances found for this employee",
        })}
        className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]"
      />

      {/* Quick Add Dialog */}
      {showAddButton && canCreateAllowance && (
        <QuickAddAllowanceDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          employeeId={employeeId}
        />
      )}

      {/* Reject Dialog */}
      <RejectAllowanceDialog
        isOpen={rejectDialogState.isOpen}
        onClose={() =>
          setRejectDialogState({ isOpen: false, allowanceId: null })
        }
        onReject={(reason: string) => {
          if (rejectDialogState.allowanceId) {
            handleReject(rejectDialogState.allowanceId, reason);
          }
        }}
        isLoading={rejectMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteAllowanceId}
        onOpenChange={() => setDeleteAllowanceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("payroll.employeeAllowances.delete.title", {
                defaultValue: "تأكيد الحذف",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("payroll.employeeAllowances.delete.description", {
                defaultValue:
                  "هل أنت متأكد من حذف هذه البدلة؟ سيتم نقلها إلى قائمة المحذوفات ويمكن للمسؤول استرجاعها.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.actions.cancel", { defaultValue: "إلغاء" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("common.actions.delete", { defaultValue: "حذف" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

