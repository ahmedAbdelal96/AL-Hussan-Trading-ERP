import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS } from "@/config/permissions.constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDeleteEmployee } from "@/hooks/useEmployees";
import { useEmployeeManagementPermissions } from "@/features/employees/hooks/useEmployeeManagementPermissions";
import { EmployeeEntity } from "@/types/employees.types";

interface EmployeeActionsProps {
  employee: EmployeeEntity;
}

/**
 * EmployeeActions Component
 *
 * Provides action menu for individual employee records:
 * - View: Navigate to employee details (future feature)
 * - Edit: Navigate to edit form
 * - Delete: Show confirmation dialog and delete
 *
 * Design principles:
 * - Dropdown menu for clean UI
 * - Confirmation dialog for destructive actions
 * - Icons for visual clarity
 * - Proper error handling via hook
 * - Optimistic updates via React Query cache invalidation
 *
 * Performance considerations:
 * - Lazy render of AlertDialog (only when needed)
 * - Event propagation stopped to prevent row click conflicts
 */
export const EmployeeActions = ({ employee }: EmployeeActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEditEmployee, canSoftDeleteEmployee } =
    useEmployeeManagementPermissions();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteMutation = useDeleteEmployee();
  const canWrite = canEditEmployee;
  const canDelete = canSoftDeleteEmployee;

  const handleView = () => {
    navigate(`/employees/${employee.id}`);
  };

  const handleEdit = () => {
    navigate(`/employees/edit/${employee.id}`);
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(employee.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      // Error handled in hook with toast
      console.error("Delete failed:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()} // Prevent row click
          >
            <span className="sr-only">{t("employees.actions.openMenu")}</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* View Action */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            {t("employees.actions.view")}
          </DropdownMenuItem>

          {/* Edit Action */}
          <PermissionGate permissions={[PERMISSIONS.EMPLOYEE_WRITE]}>
            {canWrite && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                disabled={employee.status === "TERMINATED"}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("employees.actions.edit")}
              </DropdownMenuItem>
            )}
          </PermissionGate>

          <PermissionGate permissions={[PERMISSIONS.EMPLOYEE_DELETE]}>
            {canDelete && (
              <>
                <DropdownMenuSeparator />

                {/* Delete Action */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("employees.actions.delete")}
                </DropdownMenuItem>
              </>
            )}
          </PermissionGate>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={canDelete && isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("employees.delete.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("employees.delete.confirmMessage", {
                name: `${employee.firstName} ${employee.lastName}`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t("common.deleting")
                : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
