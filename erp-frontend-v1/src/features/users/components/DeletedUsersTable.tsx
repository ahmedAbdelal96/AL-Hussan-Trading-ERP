import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUserFullName } from "@/types/users.types";
import { RotateCcw, User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermanentlyDeleteUser, useRestoreUser } from "@/hooks/useUsers";
import { useUserManagementPermissions } from "@/features/users/hooks/useUserManagementPermissions";
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
import type { UserEntity, UserFiltersDto } from "@/types/users.types";

interface DeletedUsersTableProps {
  data: UserEntity[];
  meta?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  isLoading: boolean;
  error?: unknown;
  filters: UserFiltersDto;
  onFiltersChange: (filters: UserFiltersDto) => void;
}

export const DeletedUsersTable = ({
  data,
  meta,
  isLoading,
  error,
  filters,
  onFiltersChange,
}: DeletedUsersTableProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const restoreUserMutation = useRestoreUser();
  const permanentlyDeleteUserMutation = usePermanentlyDeleteUser();
  const { canRestoreDeletedUser, canPermanentlyDeleteUser } =
    useUserManagementPermissions();
  const canRestore = canRestoreDeletedUser;
  const canPermanentDelete = canPermanentlyDeleteUser;

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [userToRestore, setUserToRestore] = useState<UserEntity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserEntity | null>(null);

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onFiltersChange({
      ...filters,
      pageSize: newPageSize,
      page: 1,
    });
  };

  const handleRestoreClick = (user: UserEntity) => {
    setUserToRestore(user);
    setRestoreDialogOpen(true);
  };

  const handleDeleteClick = (user: UserEntity) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!canRestore) return;
    if (!userToRestore) return;

    try {
      await restoreUserMutation.mutateAsync(userToRestore.id);
      setRestoreDialogOpen(false);
      setUserToRestore(null);
    } catch (restoreError) {
      console.error("Failed to restore user:", restoreError);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!canPermanentDelete) return;
    if (!userToDelete) return;

    try {
      await permanentlyDeleteUserMutation.mutateAsync(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (deleteError) {
      console.error("Failed to permanently delete user:", deleteError);
    }
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "-";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "PPp", {
        locale: language === "ar" ? ar : undefined,
      });
    } catch {
      return "-";
    }
  };

  const columns: ColumnConfig<UserEntity>[] = [
    {
      key: "name",
      label: t("users.table.name"),
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{getUserFullName(user)}</span>
        </div>
      ),
      align: "start",
      sortable: true,
      sortFn: (a, b) =>
        getUserFullName(a).localeCompare(getUserFullName(b), "ar"),
    },
    {
      key: "email",
      label: t("users.table.email"),
      render: (user) => (
        <span className="text-sm text-muted-foreground">{user.email}</span>
      ),
      align: "start",
      sortable: true,
      sortFn: (a, b) => a.email.localeCompare(b.email),
      hideMobile: true,
    },
    {
      key: "role",
      label: t("users.table.role"),
      render: (user) => {
        const primaryRole = user.roles?.[0] || "EMPLOYEE";
        return (
          <Badge variant="secondary" className="text-xs">
            {primaryRole}
          </Badge>
        );
      },
      align: "center",
      sortable: true,
      sortFn: (a, b) => (a.roles?.[0] || "").localeCompare(b.roles?.[0] || ""),
    },
    {
      key: "deletedAt",
      label: t("users.table.deletedAt"),
      render: (user) => (
        <span className="text-sm text-destructive">
          {formatDate(user.deletedAt)}
        </span>
      ),
      align: "center",
      sortable: true,
      sortFn: (a, b) => {
        if (!a.deletedAt || !b.deletedAt) return 0;
        return (
          new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime()
        );
      },
      hideMobile: true,
    },
    {
      key: "deletedBy",
      label: t("users.table.deletedBy"),
      render: (user) => {
        if (!user.deletedByUser) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        return (
          <span className="text-sm text-muted-foreground">
            {getUserFullName(user.deletedByUser)}
          </span>
        );
      },
      align: "center",
      hideMobile: true,
    },
    {
      key: "actions",
      label: t("common.actionsLabel"),
      render: (user) => (
        <div className="flex items-center justify-center gap-2">
          {canRestore && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => handleRestoreClick(user)}
              disabled={
                restoreUserMutation.isPending ||
                permanentlyDeleteUserMutation.isPending
              }
            >
              <RotateCcw className="h-4 w-4" />
              {t("users.actions.restore")}
            </Button>
          )}
          {canPermanentDelete && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              onClick={() => handleDeleteClick(user)}
              disabled={
                restoreUserMutation.isPending ||
                permanentlyDeleteUserMutation.isPending
              }
            >
              <Trash2 className="h-4 w-4" />
              {t("users.actions.deletePermanent")}
            </Button>
          )}
          {!canRestore && !canPermanentDelete && (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      ),
      align: "center",
      excludeFromExport: true,
    },
  ];

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(user) => user.id}
        pagination={{
          currentPage: meta?.page ?? 1,
          pageSize: meta?.pageSize ?? 10,
          totalItems: meta?.totalItems ?? 0,
          totalPages: meta?.totalPages ?? 0,
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 20, 50, 100]}
        isLoading={isLoading}
        error={(error as Error) || null}
        emptyMessage={t("users.deleted.emptyState.title")}
      />

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("users.restore.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.restore.confirmDescription")}
            </AlertDialogDescription>
            {userToRestore && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium">{getUserFullName(userToRestore)}</p>
                <p className="text-sm text-muted-foreground">
                  {userToRestore.email}
                </p>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              disabled={restoreUserMutation.isPending}
            >
              {restoreUserMutation.isPending
                ? t("common.loading")
                : t("users.actions.restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("users.delete.permanentConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("users.delete.permanentConfirmDescription")}
            </AlertDialogDescription>
            {userToDelete && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium">{getUserFullName(userToDelete)}</p>
                <p className="text-sm text-muted-foreground">
                  {userToDelete.email}
                </p>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPermanentDelete}
              disabled={permanentlyDeleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {permanentlyDeleteUserMutation.isPending
                ? t("common.loading")
                : t("users.actions.deletePermanent")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
