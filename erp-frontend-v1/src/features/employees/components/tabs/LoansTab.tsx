import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useEmployeeLoansByEmployee } from "@/hooks/useEmployeeLoans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Clock,
  DollarSign,
  TrendingDown,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { EmployeeLoansTable } from "@/features/payroll/components/employee-loans/EmployeeLoansTable";
import { QuickAddLoanDialog } from "@/features/employees/components/QuickAddLoanDialog";
import { formatCurrency } from "@/lib/utils";
import { canReceiveLoan } from "@/lib/employee-payroll-status";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import type { EmployeeLoanEntity } from "@/types/payroll.types";

interface LoansTabProps {
  employeeId: string;
  employeeStatus?: string;
}

export const LoansTab = ({ employeeId, employeeStatus }: LoansTabProps) => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const canReadPayroll = can({
    permissions: [PERMISSIONS.PAYROLL_READ],
  });
  const canCreateLoan = can({
    roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
    permissions: [PERMISSIONS.PAYROLL_WRITE],
  });

  const { data: loansResponse, isLoading } =
    useEmployeeLoansByEmployee(employeeId, canReadPayroll);
  const loans: EmployeeLoanEntity[] = Array.isArray(loansResponse)
    ? loansResponse
    : [];

  // Calculate statistics
  const stats = loans.reduce(
    (
      acc: {
        totalAmount: number;
        totalRemaining: number;
        activeCount: number;
        pendingCount: number;
      },
      loan: EmployeeLoanEntity,
    ) => {
      const isApproved = loan.status === "APPROVED";

      if (isApproved) {
        acc.totalAmount += loan.amount;
        acc.totalRemaining += loan.remainingAmount;
        if (loan.remainingAmount > 0) {
          acc.activeCount++;
        }
      } else if (loan.status === "PENDING") {
        acc.pendingCount++;
      }
      return acc;
    },
    {
      totalAmount: 0,
      totalRemaining: 0,
      activeCount: 0,
      pendingCount: 0,
    },
  );

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
              {t("payroll.employeeLoans.stats.totalAmount", {
                defaultValue: "Total Loan Amount",
              })}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("payroll.employeeLoans.stats.approvedLoans", {
                defaultValue: "Approved loans",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.employeeLoans.stats.remaining", {
                defaultValue: "Remaining Balance",
              })}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("payroll.employeeLoans.stats.toBePaid", {
                defaultValue: "To be paid",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.employeeLoans.stats.activeLoans", {
                defaultValue: "Active Loans",
              })}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("payroll.employeeLoans.stats.currentlyActive", {
                defaultValue: "Currently active",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.employeeLoans.stats.pendingLoans", {
                defaultValue: "Pending Loans",
              })}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("payroll.employeeLoans.stats.awaitingApproval", {
                defaultValue: "Awaiting approval",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t("payroll.employeeLoans.tableTitle", {
                defaultValue: "Loan History",
              })}
            </CardTitle>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="gap-2"
              disabled={!canReceiveLoan(employeeStatus) || !canCreateLoan}
            >
              <Plus className="h-4 w-4" />
              {t("payroll.employeeLoans.actions.create", {
                defaultValue: "Add Loan",
              })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">
                {t("payroll.employeeLoans.noData", {
                  defaultValue:
                    "\u0644\u0627 \u062a\u0648\u062c\u062f \u0633\u0644\u0641 \u0645\u0633\u062c\u0644\u0629",
                })}
              </p>
              <p className="text-xs mt-1">
                {t("payroll.employeeLoans.noDataHint", {
                  defaultValue:
                    "\u0627\u0628\u062f\u0623 \u0628\u0625\u0636\u0627\u0641\u0629 \u0633\u0644\u0641\u0629 \u062c\u062f\u064a\u062f\u0629 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0632\u0631 \u0623\u0639\u0644\u0627\u0647",
                })}
              </p>
            </div>
          ) : (
            <EmployeeLoansTable
              loans={loans}
              isLoading={isLoading}
              showEmployeeColumn={false}
            />
          )}
        </CardContent>
      </Card>

      <QuickAddLoanDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        employeeId={employeeId}
      />
    </div>
  );
};
