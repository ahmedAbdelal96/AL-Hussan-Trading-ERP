import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, MoreVertical } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
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
import { usePermissions } from "@/hooks/usePermissions";
import { useDeleteAsset } from "@/hooks/useAssets";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import type { AssetEntity } from "@/types/assets.types";

interface AssetActionsProps {
  asset: AssetEntity;
}

export function AssetActions({ asset }: AssetActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission, can } = usePermissions();
  const deleteAssetMutation = useDeleteAsset();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canWrite = hasPermission(PERMISSIONS.ASSET_WRITE);
  const canDelete = can({
    roles: [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SUPERADMIN],
    permissions: [PERMISSIONS.ASSET_DELETE],
  });

  const handleDelete = async () => {
    try {
      await deleteAssetMutation.mutateAsync({
        id: asset.id,
        rowVersion: asset.rowVersion,
      });
      setIsDeleteOpen(false);
    } catch (error) {
      // handled by hook toast
      console.error("Failed to delete asset:", error);
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
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">
              {t("common.more", { defaultValue: "More" })}
            </span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/assets/${asset.id}`);
            }}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            {t("assets.actions.viewDetails", { defaultValue: "View Details" })}
          </DropdownMenuItem>

          {canWrite && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/assets/${asset.id}/edit`);
              }}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              {t("assets.actions.edit", { defaultValue: "Edit Asset" })}
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteOpen(true);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("assets.actions.delete", { defaultValue: "Delete Asset" })}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("assets.messages.deleteConfirmTitle", {
                defaultValue: "Delete Asset",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("assets.messages.deleteConfirmMessage", {
                defaultValue:
                  "Are you sure you want to delete this asset? This action cannot be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAssetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAssetMutation.isPending
                ? t("common.deleting", { defaultValue: "Deleting..." })
                : t("common.delete", { defaultValue: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

