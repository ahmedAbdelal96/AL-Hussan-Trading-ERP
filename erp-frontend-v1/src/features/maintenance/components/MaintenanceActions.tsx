import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { Link } from "react-router-dom";
import { useState } from "react";
import { MaintenanceRequestEntity } from "@/types/maintenance.types";
import { useDeleteMaintenance } from "@/hooks/useMaintenance";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
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

interface MaintenanceActionsProps {
  maintenance: MaintenanceRequestEntity;
}

export const MaintenanceActions = ({
  maintenance,
}: MaintenanceActionsProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const canWrite = hasPermission(PERMISSIONS.MAINTENANCE_WRITE);
  const canDelete = hasPermission(PERMISSIONS.MAINTENANCE_DELETE);

  const deleteMutation = useDeleteMaintenance();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({
      id: maintenance.id,
      rowVersion: maintenance.rowVersion,
    });
    setShowDeleteDialog(false);
  };

  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/maintenance/${maintenance.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              {t("maintenance.actions.view")}
            </Link>
          </DropdownMenuItem>

          {canWrite && (
            <DropdownMenuItem asChild>
              <Link to={`/maintenance/edit/${maintenance.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                {t("maintenance.actions.edit")}
              </Link>
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("maintenance.actions.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={canDelete && showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("maintenance.confirmations.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("maintenance.confirmations.deleteMessage", {
                number: maintenance.maintenanceNumber,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t("maintenance.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
