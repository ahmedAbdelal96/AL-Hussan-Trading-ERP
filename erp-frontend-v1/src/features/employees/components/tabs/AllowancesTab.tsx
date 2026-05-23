import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { canReceivePayroll } from "@/lib/employee-payroll-status";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { EmployeeAllowancesView } from "@/features/employees/components/EmployeeAllowancesView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  useDeletedEmployeeAllowances,
  useRestoreEmployeeAllowance,
} from "@/hooks/useEmployeeAllowances";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import { formatCurrency } from "@/lib/utils";
import type { EmployeeAllowanceEntity } from "@/types/payroll.types";
import { getUserFullName } from "@/types/payroll.types";

interface AllowancesTabProps {
  employeeId: string;
  employeeNumber?: string;
  employeeStatus?: string;
}

export const AllowancesTab = ({
  employeeId,
  employeeNumber,
  employeeStatus,
}: AllowancesTabProps) => {
  const { t } = useTranslation();
  const { isSuperAdmin, can } = usePermissions();
  const canReadPayroll = can({
    permissions: [PERMISSIONS.PAYROLL_READ],
  });
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const restoreMutation = useRestoreEmployeeAllowance();

  // Deleted allowances (SUPERADMIN only)
  const { data: deletedData, isLoading: deletedLoading } =
    useDeletedEmployeeAllowances(
      isSuperAdmin ? { employeeId } : undefined,
      isSuperAdmin && activeTab === "deleted",
    );

  const deletedAllowancesColumns: ColumnConfig<EmployeeAllowanceEntity>[] = [
    {
      key: "type",
      label: t("payroll.employeeAllowances.table.type"),
      align: "start",
      render: (allowance) => allowance.allowanceType?.name || "-",
      exportValue: (allowance) => allowance.allowanceType?.name || "-",
    },
    {
      key: "amount",
      label: t("payroll.employeeAllowances.table.amount"),
      align: "end",
      sortable: true,
      render: (allowance) => formatCurrency(allowance.amount),
      exportValue: (allowance) => allowance.amount,
    },
    {
      key: "frequency",
      label: t("payroll.employeeAllowances.table.frequency"),
      align: "center",
      render: (allowance) =>
        t(`payroll.employeeAllowances.frequency.${allowance.frequency}`, {
          defaultValue: allowance.frequency,
        }),
      exportValue: (allowance) => allowance.frequency,
    },
    {
      key: "effectiveFrom",
      label: t("payroll.employeeAllowances.table.effectiveFrom"),
      align: "center",
      sortable: true,
      render: (allowance) =>
        new Date(allowance.effectiveFrom).toLocaleDateString("ar-EG"),
      exportValue: (allowance) =>
        new Date(allowance.effectiveFrom).toLocaleDateString("ar-EG"),
    },
    {
      key: "deletedBy",
      label: t("payroll.employeeAllowances.table.deletedBy"),
      align: "start",
      render: (allowance) => getUserFullName(allowance.deletedByUser),
      exportValue: (allowance) => getUserFullName(allowance.deletedByUser),
    },
    {
      key: "deletedAt",
      label: t("payroll.employeeAllowances.table.deletedAt"),
      align: "center",
      sortable: true,
      render: (allowance) =>
        allowance.deletedAt
          ? new Date(allowance.deletedAt).toLocaleString("ar-EG")
          : "-",
      exportValue: (allowance) =>
        allowance.deletedAt
          ? new Date(allowance.deletedAt).toLocaleString("ar-EG")
          : "-",
    },
  ];

  const deletedAllowancesActions: ActionButton<EmployeeAllowanceEntity>[] = [
    {
      label: t("payroll.employeeAllowances.actions.restore", {
        defaultValue: "\u0627\u0633\u062a\u0631\u062c\u0627\u0639",
      }),
      icon: <ArrowLeft className="h-4 w-4" />,
      onClick: (allowance) => setRestoreId(allowance.id),
      variant: "default",
    },
  ];

  const handleRestore = async () => {
    if (!restoreId) return;
    try {
      await restoreMutation.mutateAsync(restoreId);
      setRestoreId(null);
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "active" | "deleted")}
        className="space-y-6"
        dir="rtl"
      >
        {isSuperAdmin && (
          <TabsList className="grid grid-cols-2 w-[400px] text-base mx-auto">
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
        )}

        <TabsContent value="active">
          <EmployeeAllowancesView
            employeeId={employeeId}
            showAddButton={canReceivePayroll(employeeStatus)}
            enabled={canReadPayroll}
          />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="deleted" className="space-y-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  {t("payroll.employeeAllowances.deletedTitle", {
                    defaultValue: "Deleted Allowances",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable<EmployeeAllowanceEntity>
                  data={deletedData?.data || []}
                  columns={deletedAllowancesColumns}
                  actions={deletedAllowancesActions}
                  keyExtractor={(allowance) => allowance.id}
                  isLoading={deletedLoading}
                  enableClientSorting={true}
                  defaultSort={{ column: "deletedAt", direction: "desc" }}
                  enableExport={true}
                  exportFilename={`employee_${employeeNumber}_deleted_allowances`}
                  exportTitle={t("payroll.employeeAllowances.deletedTitle", {
                    defaultValue: "Deleted Allowances",
                  })}
                  emptyMessage={t("payroll.employeeAllowances.noDeletedData", {
                    defaultValue:
                      "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u062f\u0644\u0627\u062a \u0645\u062d\u0630\u0648\u0641\u0629",
                  })}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreId} onOpenChange={() => setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("payroll.employeeAllowances.restore.title", {
                defaultValue:
                  "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0627\u0633\u062a\u0631\u062c\u0627\u0639",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("payroll.employeeAllowances.restore.description", {
                defaultValue:
                  "\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0647\u0630\u0647 \u0627\u0644\u0628\u062f\u0644\u0629\u061f \u0633\u064a\u062a\u0645 \u0625\u0639\u0627\u062f\u062a\u0647\u0627 \u0625\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0628\u062f\u0644\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629.",
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
