import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  useEmployeeDeductionsByEmployee,
  useApproveEmployeeDeduction,
  useRejectEmployeeDeduction,
  useUnapproveEmployeeDeduction,
  useDeletedEmployeeDeductions,
  useRestoreEmployeeDeduction,
} from "@/hooks/useEmployeeDeductions";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  ArrowLeft,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react";
import {
  EmployeeDeductionsTable,
  DeductionApprovalDialog,
} from "@/features/payroll/components/employee-deductions";
import { QuickAddDeductionDialog } from "@/features/employees/components/QuickAddDeductionDialog";
import type { EmployeeDeductionEntity } from "@/types/payroll.types";
import { getUserFullName } from "@/types/payroll.types";
import { formatCurrency } from "@/lib/utils";
import { canReceivePayroll } from "@/lib/employee-payroll-status";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";

interface DeductionsTabProps {
  employeeId: string;
  employeeNumber?: string;
  employeeStatus?: string;
}

export const DeductionsTab = ({
  employeeId,
  employeeNumber,
  employeeStatus,
}: DeductionsTabProps) => {
  const { t } = useTranslation();
  const { isSuperAdmin, can } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] =
    useState<EmployeeDeductionEntity | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const canReadPayroll = can({
    permissions: [PERMISSIONS.PAYROLL_READ],
  });
  const canCreateDeduction = can({
    roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
    permissions: [PERMISSIONS.PAYROLL_WRITE],
  });

  const { data: deductionsResponse, isLoading } =
    useEmployeeDeductionsByEmployee(employeeId, canReadPayroll);
  const approveMutation = useApproveEmployeeDeduction();
  const rejectMutation = useRejectEmployeeDeduction();
  const unapproveMutation = useUnapproveEmployeeDeduction();
  const restoreMutation = useRestoreEmployeeDeduction();

  // Deleted deductions (SUPERADMIN only)
  const { data: deletedData, isLoading: deletedLoading } =
    useDeletedEmployeeDeductions(
      isSuperAdmin ? { employeeId } : undefined,
      isSuperAdmin && activeTab === "deleted",
    );

  // Handle different response formats
  const deductions: EmployeeDeductionEntity[] = Array.isArray(
    deductionsResponse,
  )
    ? deductionsResponse
    : (deductionsResponse as unknown as { data?: EmployeeDeductionEntity[] })
        ?.data || [];

  // Calculate statistics
  const currentYear = new Date().getFullYear();
  const stats = deductions.reduce(
    (
      acc: {
        totalAll: number;
        totalThisYear: number;
        totalThisMonth: number;
        yearCount: number;
        monthCount: number;
      },
      deduction: EmployeeDeductionEntity,
    ) => {
      const deductionDate = new Date(deduction.deductionDate);
      const isCurrentYear = deductionDate.getFullYear() === currentYear;
      const isCurrentMonth =
        isCurrentYear && deductionDate.getMonth() === new Date().getMonth();

      acc.totalAll += deduction.amount;
      if (isCurrentYear) {
        acc.totalThisYear += deduction.amount;
        acc.yearCount++;
      }
      if (isCurrentMonth) {
        acc.totalThisMonth += deduction.amount;
        acc.monthCount++;
      }
      return acc;
    },
    {
      totalAll: 0,
      totalThisYear: 0,
      totalThisMonth: 0,
      yearCount: 0,
      monthCount: 0,
    },
  );

  // Approval handlers
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
    } catch {
      // Error handled by mutation hook
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
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleUnapprove = async (deduction: EmployeeDeductionEntity) => {
    try {
      await unapproveMutation.mutateAsync({
        id: deduction.id,
        data: {
          notes: "Approval cancelled",
          rowVersion: deduction.rowVersion,
        },
      });
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleRestore = async () => {
    if (!restoreId) return;
    try {
      await restoreMutation.mutateAsync(restoreId);
      setRestoreId(null);
    } catch {
      // Error handled by mutation hook
    }
  };

  // Deleted deductions table columns
  const deletedDeductionsColumns: ColumnConfig<EmployeeDeductionEntity>[] = [
    {
      key: "type",
      label: t("payroll.employeeDeductions.table.type"),
      align: "start",
      render: (deduction) =>
        t(`payroll.employeeDeductions.types.${deduction.deductionType}`, {
          defaultValue: deduction.deductionType,
        }),
      exportValue: (deduction) => deduction.deductionType,
    },
    {
      key: "amount",
      label: t("payroll.employeeDeductions.table.amount"),
      align: "end",
      sortable: true,
      render: (deduction) => formatCurrency(deduction.amount),
      exportValue: (deduction) => deduction.amount,
    },
    {
      key: "deductionDate",
      label: t("payroll.employeeDeductions.table.deductionDate"),
      align: "center",
      sortable: true,
      render: (deduction) =>
        new Date(deduction.deductionDate).toLocaleDateString("ar-EG"),
      exportValue: (deduction) =>
        new Date(deduction.deductionDate).toLocaleDateString("ar-EG"),
    },
    {
      key: "deletedBy",
      label: t("payroll.employeeDeductions.table.deletedBy"),
      align: "start",
      render: (deduction) => getUserFullName(deduction.deletedByUser),
      exportValue: (deduction) => getUserFullName(deduction.deletedByUser),
    },
    {
      key: "deletedAt",
      label: t("payroll.employeeDeductions.table.deletedAt"),
      align: "center",
      sortable: true,
      render: (deduction) =>
        deduction.deletedAt
          ? new Date(deduction.deletedAt).toLocaleString("ar-EG")
          : "-",
      exportValue: (deduction) =>
        deduction.deletedAt
          ? new Date(deduction.deletedAt).toLocaleString("ar-EG")
          : "-",
    },
  ];

  const deletedDeductionsActions: ActionButton<EmployeeDeductionEntity>[] = [
    {
      label: t("payroll.employeeDeductions.actions.restore", {
        defaultValue: "\u0627\u0633\u062a\u0631\u062c\u0627\u0639",
      }),
      icon: <ArrowLeft className="h-4 w-4" />,
      onClick: (deduction) => setRestoreId(deduction.id),
      variant: "default",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.employeeDeductions.stats.totalAll", {
                defaultValue: "Total All Time",
              })}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAll)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.employeeDeductions.stats.thisYear", {
                defaultValue: "This Year",
              })}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalThisYear)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.yearCount}{" "}
              {t("payroll.employeeDeductions.stats.deductions", {
                defaultValue: "deductions",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.employeeDeductions.stats.thisMonth", {
                defaultValue: "This Month",
              })}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.monthCount}{" "}
              {t("payroll.employeeDeductions.stats.deductions", {
                defaultValue: "deductions",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.employeeDeductions.stats.avgMonthly", {
                defaultValue: "Avg Monthly",
              })}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                stats.yearCount > 0 ? stats.totalThisYear / stats.yearCount : 0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deductions Table with Active/Deleted Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "active" | "deleted")}
        className="space-y-6"
      >
        {isSuperAdmin && (
          <div className="flex items-center justify-center">
            <TabsList className="grid grid-cols-2 w-[400px] text-base">
              <TabsTrigger value="active">
                {t("common.active", {
                  defaultValue: "\u0627\u0644\u0646\u0634\u0637\u0629",
                })}
              </TabsTrigger>
              <TabsTrigger value="deleted" className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t("common.deleted", {
                  defaultValue:
                    "\u0627\u0644\u0645\u062d\u0630\u0648\u0641\u0629",
                })}
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        <TabsContent value="active" className="space-y-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {t("payroll.employeeDeductions.tableTitle", {
                    defaultValue: "Deduction History",
                  })}
                </CardTitle>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  size="sm"
                  className="gap-2"
                  disabled={!canReceivePayroll(employeeStatus) || !canCreateDeduction}
                >
                  <Plus className="h-4 w-4" />
                  {t("payroll.employeeDeductions.actions.addDeduction", {
                    defaultValue: "Add Deduction",
                  })}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deductions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">
                    {t("payroll.employeeDeductions.noData", {
                      defaultValue:
                        "\u0644\u0627 \u062a\u0648\u062c\u062f \u062e\u0635\u0648\u0645\u0627\u062a \u0645\u0633\u062c\u0644\u0629",
                    })}
                  </p>
                  <p className="text-xs mt-1">
                    {t("payroll.employeeDeductions.noDataHint", {
                      defaultValue:
                        "\u0627\u0628\u062f\u0623 \u0628\u0625\u0636\u0627\u0641\u0629 \u062e\u0635\u0645 \u062c\u062f\u064a\u062f \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0632\u0631 \u0623\u0639\u0644\u0627\u0647",
                    })}
                  </p>
                </div>
              ) : (
                <EmployeeDeductionsTable
                  deductions={deductions}
                  isLoading={isLoading}
                  employeeId={employeeId}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onUnapprove={handleUnapprove}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="deleted" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  {t("payroll.employeeDeductions.deletedTitle", {
                    defaultValue: "Deleted Deductions",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable<EmployeeDeductionEntity>
                  data={deletedData?.data || []}
                  columns={deletedDeductionsColumns}
                  actions={deletedDeductionsActions}
                  keyExtractor={(deduction) => deduction.id}
                  isLoading={deletedLoading}
                  enableClientSorting={true}
                  defaultSort={{ column: "deletedAt", direction: "desc" }}
                  enableExport={true}
                  exportFilename={`employee_${employeeNumber}_deleted_deductions`}
                  exportTitle={t("payroll.employeeDeductions.deletedTitle", {
                    defaultValue: "Deleted Deductions",
                  })}
                  emptyMessage={t("payroll.employeeDeductions.noDeletedData", {
                    defaultValue:
                      "\u0644\u0627 \u062a\u0648\u062c\u062f \u062e\u0635\u0648\u0645\u0627\u062a \u0645\u062d\u0630\u0648\u0641\u0629",
                  })}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Quick Add Deduction Dialog */}
      <QuickAddDeductionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        employeeId={employeeId}
      />

      {/* Deduction Approval Dialog */}
      <DeductionApprovalDialog
        isOpen={approvalDialogOpen}
        onClose={() => {
          setApprovalDialogOpen(false);
          setSelectedDeduction(null);
        }}
        deduction={selectedDeduction}
        onApprove={handleApprovalDialogApprove}
        onReject={handleApprovalDialogReject}
      />

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("payroll.employeeDeductions.restore.title", {
                defaultValue:
                  "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0627\u0633\u062a\u0631\u062c\u0627\u0639",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("payroll.employeeDeductions.restore.description", {
                defaultValue:
                  "\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0647\u0630\u0627 \u0627\u0644\u062e\u0635\u0645\u061f \u0633\u064a\u062a\u0645 \u0625\u0639\u0627\u062f\u062a\u0647 \u0625\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062e\u0635\u0648\u0645\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.actions.cancel", {
                defaultValue: "\u0625\u0644\u063a\u0627\u0621",
              })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              {t("common.actions.restore", {
                defaultValue: "\u0627\u0633\u062a\u0631\u062c\u0627\u0639",
              })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
