/**
 * Quick Actions Menu
 *
 * Dropdown menu with quick actions for employee management
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Upload,
  Building2,
  Briefcase,
  UserCircle,
  ChevronDown,
  Zap,
  DollarSign,
} from "lucide-react";
import { QuickStatusChangeDialog } from "./QuickStatusChangeDialog";
import { QuickDepartmentChangeDialog } from "./QuickDepartmentChangeDialog";
import { QuickPositionChangeDialog } from "./QuickPositionChangeDialog";
import { EmployeeEntity } from "@/types/employees.types";
import { useEmployeeManagementPermissions } from "@/features/employees/hooks/useEmployeeManagementPermissions";

interface QuickActionsMenuProps {
  employee: EmployeeEntity;
  onSalaryUpdateClick?: () => void;
  onUploadDocumentsClick?: () => void;
}

export const QuickActionsMenu = ({
  employee,
  onSalaryUpdateClick,
  onUploadDocumentsClick,
}: QuickActionsMenuProps) => {
  const { t } = useTranslation();
  const { canUseQuickEmployeeActions } = useEmployeeManagementPermissions();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);

  const isTerminated = employee.status === "TERMINATED";

  if (!canUseQuickEmployeeActions) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" className="gap-2" disabled={isTerminated}>
            <Zap className="h-4 w-4" />
            {t("employees.quickActions.title", {
              defaultValue: "إجراءات سريعة",
            })}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {t("employees.quickActions.title")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Change Status */}
          <DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
            <Activity className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t("employees.quickActions.changeStatus.button", {
              defaultValue: "تغيير الحالة",
            })}
          </DropdownMenuItem>

          {/* Upload Documents */}
          {onUploadDocumentsClick && (
            <DropdownMenuItem onClick={onUploadDocumentsClick}>
              <Upload className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t("employees.actions.uploadDocuments", {
                defaultValue: "رفع مستندات",
              })}
            </DropdownMenuItem>
          )}

          {/* Update Salary */}
          {onSalaryUpdateClick && (
            <DropdownMenuItem onClick={onSalaryUpdateClick}>
              <DollarSign className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t("employees.quickActions.updateSalary", {
                defaultValue: "تعديل الراتب",
              })}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Change Department */}
          <DropdownMenuItem onClick={() => setDepartmentDialogOpen(true)}>
            <Building2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t("employees.quickActions.changeDepartment", {
              defaultValue: "تغيير القسم",
            })}
          </DropdownMenuItem>

          {/* Change Position */}
          <DropdownMenuItem onClick={() => setPositionDialogOpen(true)}>
            <Briefcase className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t("employees.quickActions.changePosition", {
              defaultValue: "تغيير المنصب",
            })}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* View Profile */}
          <DropdownMenuItem
            onClick={() => {
              // TODO: Implement profile view
            }}
          >
            <UserCircle className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t("employees.quickActions.viewProfile", {
              defaultValue: "عرض الملف الكامل",
            })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Change Dialog */}
      <QuickStatusChangeDialog
        employeeId={employee.id}
        employeeVersion={employee.rowVersion ?? employee.version}
        currentStatus={employee.status}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />

      {/* Department Change Dialog */}
      <QuickDepartmentChangeDialog
        employeeId={employee.id}
        employeeVersion={employee.rowVersion ?? employee.version}
        currentDepartmentId={employee.departmentId}
        currentDepartmentName={employee.departmentName}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        open={departmentDialogOpen}
        onOpenChange={setDepartmentDialogOpen}
      />

      {/* Position Change Dialog */}
      <QuickPositionChangeDialog
        employeeId={employee.id}
        employeeVersion={employee.rowVersion ?? employee.version}
        currentPositionId={employee.positionId}
        currentPositionName={employee.positionName}
        employeeDepartmentId={employee.departmentId}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        open={positionDialogOpen}
        onOpenChange={setPositionDialogOpen}
      />
    </>
  );
};
