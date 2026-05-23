import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { CURRENCY } from "@/config/system.constants";
import { canReceivePayroll } from "@/lib/employee-payroll-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SalaryUpdateDialog } from "@/features/payroll/components/SalaryUpdateDialog";
import { SalaryHistoryTimeline } from "@/features/payroll/components/SalaryHistoryTimeline";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Clock } from "lucide-react";
import type { EmployeeEntity } from "@/types/employees.types";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";

interface SalaryTabProps {
  employee: EmployeeEntity;
}

export const SalaryTab = ({ employee }: SalaryTabProps) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const canReadPayroll = can({
    permissions: [PERMISSIONS.PAYROLL_READ],
  });
  const canUpdateSalary = can({
    roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
  });

  return (
    <div className="space-y-6">
      {/* Current Salary Card */}
      {employee.baseSalary !== null && employee.baseSalary !== undefined ? (
        <Card className="bg-surface border-app relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium tsecondary">
                    {t("payroll.salary.title.current", {
                      defaultValue:
                        "\u0627\u0644\u0631\u0627\u062a\u0628 \u0627\u0644\u062d\u0627\u0644\u064a",
                    })}
                  </p>
                  <p className="text-xs tsecondary mt-0.5">
                    {t("payroll.salary.descriptions.current", {
                      defaultValue:
                        "\u0622\u062e\u0631 \u0631\u0627\u062a\u0628 \u0645\u0633\u062c\u0644 \u0644\u0644\u0645\u0648\u0638\u0641",
                    })}
                  </p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div>
                <span className="text-4xl font-bold tprimary">
                  {formatCurrency(employee.baseSalary)}
                </span>
                <span className="text-lg text-primary ml-2">
                  {employee.currency || CURRENCY.DEFAULT}
                </span>
              </div>

              {employee.lastSalaryUpdate && (
                <div className="pt-4 border-t border-app">
                  <div className="flex items-center gap-2 text-xs tsecondary">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {t("payroll.salary.label.lastUpdate", {
                        defaultValue:
                          "\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b",
                      })}
                    </span>
                    <span className="font-medium tprimary">
                      {formatDate(employee.lastSalaryUpdate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">
              {t("payroll.salary.noSalary", {
                defaultValue:
                  "\u0644\u0645 \u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062f \u0631\u0627\u062a\u0628 \u0628\u0639\u062f",
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Update Salary Button */}
      {canReadPayroll && canUpdateSalary && (
        <Button
          onClick={() => setIsSalaryDialogOpen(true)}
          variant="default"
          disabled={!canReceivePayroll(employee.status)}
        >
          <DollarSign className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
          {t("payroll.salary.updateTitle", {
            defaultValue:
              "\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0631\u0627\u062a\u0628",
          })}
        </Button>
      )}

      {/* Salary History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("payroll.salary.title.history", {
              defaultValue:
                "\u0633\u062c\u0644 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a",
            })}
          </CardTitle>
          <CardDescription>
            {t("payroll.salary.descriptions.history", {
              defaultValue:
                "\u062c\u0645\u064a\u0639 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a \u0627\u0644\u062a\u064a \u0637\u0631\u0623\u062a \u0639\u0644\u0649 \u0631\u0627\u062a\u0628 \u0627\u0644\u0645\u0648\u0638\u0641",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalaryHistoryTimeline employeeId={employee.id} enabled={canReadPayroll} />
        </CardContent>
      </Card>

      {/* Salary Update Dialog */}
      {canReadPayroll && canUpdateSalary && (
        <SalaryUpdateDialog
          open={isSalaryDialogOpen}
          onOpenChange={setIsSalaryDialogOpen}
          employee={employee}
        />
      )}
    </div>
  );
};
