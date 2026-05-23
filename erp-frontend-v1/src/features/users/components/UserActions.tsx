import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { PermissionGate } from "@/components/common/PermissionGate";
import { useDeleteUser } from "@/hooks/useUsers";
import { useUserManagementPermissions } from "@/features/users/hooks/useUserManagementPermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { ManageUserPhotoDialog } from "./ManageUserPhotoDialog";
import type { UserEntity } from "@/types/users.types";

interface UserActionsProps {
  user: UserEntity;
}

export const UserActions = ({ user }: UserActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    canWriteUsers,
    canResetUserPassword,
    canSoftDeleteUser,
    canManageUserPhoto,
    canUseCriticalUserOps,
  } = useUserManagementPermissions();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const deleteUser = useDeleteUser();

  const canEdit = canWriteUsers;
  const canResetPassword = canUseCriticalUserOps && canResetUserPassword;
  const canDelete = canSoftDeleteUser && !user.deletedAt;

  const handleEdit = () => {
    navigate(`/users/edit/${user.id}`);
  };

  const handleView = () => {
    navigate(`/users/${user.id}`);
  };

  const handleDelete = async () => {
    await deleteUser.mutateAsync(user.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleView} className="gap-2">
            <Eye className="h-4 w-4" />
            {t("common.view", { defaultValue: "عرض" })}
          </DropdownMenuItem>

          <PermissionGate permissions={[PERMISSIONS.USER_WRITE]}>
            {canEdit && (
              <DropdownMenuItem onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                {t("common.edit", { defaultValue: "تعديل" })}
              </DropdownMenuItem>
            )}
          </PermissionGate>

          <PermissionGate permissions={[PERMISSIONS.USER_WRITE]}>
            {canManageUserPhoto && (
              <DropdownMenuItem
                onClick={() => setPhotoDialogOpen(true)}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {t("users.actions.managePhoto", {
                  defaultValue: "إدارة الصورة الشخصية",
                })}
              </DropdownMenuItem>
            )}
          </PermissionGate>

          <PermissionGate
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN]}
            permissions={[PERMISSIONS.USER_RESET_PASSWORD]}
          >
            {canResetPassword && (
              <DropdownMenuItem
                onClick={() => setResetPasswordOpen(true)}
                className="gap-2"
              >
                <Key className="h-4 w-4" />
                {t("users.actions.resetPassword", {
                  defaultValue: "إعادة تعيين كلمة المرور",
                })}
              </DropdownMenuItem>
            )}
          </PermissionGate>

          <PermissionGate
            roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN]}
            permissions={[PERMISSIONS.USER_DELETE]}
          >
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("common.delete", { defaultValue: "حذف" })}
                </DropdownMenuItem>
              </>
            )}
          </PermissionGate>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={canDelete && deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("users.delete.title", { defaultValue: "تأكيد الحذف" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.delete.description", {
                defaultValue: `هل أنت متأكد من حذف المستخدم "${user.firstName} ${user.lastName}"؟ لا يمكن التراجع عن هذا الإجراء.`,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel", { defaultValue: "إلغاء" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending
                ? t("common.deleting", { defaultValue: "جاري الحذف..." })
                : t("common.delete", { defaultValue: "حذف" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResetPasswordDialog
        user={user}
        open={canResetPassword && resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
      />

      <ManageUserPhotoDialog
        user={user}
        open={canEdit && photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
      />
    </>
  );
};
