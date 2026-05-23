/**
 * Project Actions Component
 *
 * Dropdown menu with CRUD and utility actions for individual projects.
 *
 * Actions:
 * - View Details (navigate to /projects/:id)
 * - Edit (navigate to /projects/edit/:id)
 * - View on Map (conditional - only if GPS coordinates exist)
 * - Update Progress (quick progress update)
 * - Delete (with confirmation dialog)
 *
 * Features:
 * - Delete confirmation with AlertDialog
 * - Conditional map action based on coordinates
 * - Loading state during delete operation
 * - Error handling with toast notifications
 *
 * @component ProjectActions
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import {
  MoreVertical,
  Eye,
  Pencil,
  MapPin,
  TrendingUp,
  Trash2,
} from "lucide-react";
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
import { useDeleteProject } from "@/hooks/useProjects";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import {
  projectHasCoordinates,
  getProjectMapUrl,
  canUpdateProjectProgress,
} from "@/types/projects.types";
import type { ProjectEntity } from "@/types/projects.types";

interface ProjectActionsProps {
  project: ProjectEntity;
}

/**
 * ProjectActions Component
 * Actions dropdown for project management
 */
export const ProjectActions = ({ project }: ProjectActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteMutation = useDeleteProject();
  const canWrite = hasPermission(PERMISSIONS.PROJECT_WRITE);
  const canDelete = hasPermission(PERMISSIONS.PROJECT_DELETE);
  const canProgressUpdate = canWrite && canUpdateProjectProgress(project.status);

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        id: project.id,
        rowVersion: project.rowVersion,
      });
      setShowDeleteDialog(false);
    } catch (error) {
      // Error handled by mutation hook
      console.error("Delete error:", error);
    }
  };

  /**
   * Handle view on map
   * Opens Google Maps in new tab
   */
  const handleViewOnMap = () => {
    if (projectHasCoordinates(project)) {
      const mapUrl = getProjectMapUrl(project);
      if (mapUrl) {
        window.open(mapUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* View Details */}
          <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            {t("projects.actions.view")}
          </DropdownMenuItem>

          {/* Edit */}
          {canWrite && (
            <DropdownMenuItem
              onClick={() => navigate(`/projects/edit/${project.id}`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("projects.actions.edit")}
            </DropdownMenuItem>
          )}

          {/* View on Map (conditional) */}
          {projectHasCoordinates(project) && (
            <DropdownMenuItem onClick={handleViewOnMap}>
              <MapPin className="h-4 w-4 mr-2" />
              {t("projects.actions.viewOnMap")}
            </DropdownMenuItem>
          )}

          {/* Update Progress */}
          {canProgressUpdate && (
            <DropdownMenuItem
              onClick={() => navigate(`/projects/${project.id}/progress`)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t("projects.actions.updateProgress")}
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("projects.actions.delete")}
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
              {t("projects.confirmations.delete")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("projects.confirmations.deleteMessage", {
                name: project.name,
              })}
              <br />
              <br />
              {t("projects.confirmations.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("projects.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t("common.deleting")
                : t("projects.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
