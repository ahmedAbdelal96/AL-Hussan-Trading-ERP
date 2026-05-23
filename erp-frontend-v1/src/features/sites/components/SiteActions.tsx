/**
 * Site Actions Component
 *
 * Dropdown menu with available actions for a site:
 * - View Details
 * - Edit
 * - Delete (with confirmation)
 *
 * @module SiteActions
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Button } from "@/components/ui/button";
import { useDeleteSite } from "@/hooks/useSites";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import type { SiteEntity } from "@/types/sites.types";

interface SiteActionsProps {
  /** Site entity to perform actions on */
  site: SiteEntity;
}

/**
 * Site Actions Component
 *
 * Provides action menu for individual site operations
 */
export const SiteActions = ({ site }: SiteActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const deleteMutation = useDeleteSite();
  const canWrite = hasPermission(PERMISSIONS.SITE_WRITE);
  const canDelete = hasPermission(PERMISSIONS.SITE_DELETE);

  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /**
   * Handle edit action
   */
  const handleEdit = () => {
    navigate(`/sites/edit/${site.id}`);
  };

  /**
   * Handle view details action
   */
  const handleViewDetails = () => {
    navigate(`/sites/${site.id}`);
  };

  /**
   * Handle delete action
   * Shows confirmation dialog first
   */
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  /**
   * Confirm and execute delete
   */
  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync({
        id: site.id,
        rowVersion: site.rowVersion,
      });
      setShowDeleteDialog(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Delete error:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t("sites.actions.viewDetails")}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            {t("common.actionsLabel", { defaultValue: "الإجراءات" })}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Details */}
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            {t("sites.actions.viewDetails")}
          </DropdownMenuItem>

          {/* Edit */}
          {canWrite && (
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t("sites.actions.edit")}
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("sites.actions.delete")}
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
              {t("sites.confirmations.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("sites.confirmations.delete.message", { name: site.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("sites.confirmations.delete.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t("common.deleting", { defaultValue: "جاري الحذف..." })
                : t("sites.confirmations.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
