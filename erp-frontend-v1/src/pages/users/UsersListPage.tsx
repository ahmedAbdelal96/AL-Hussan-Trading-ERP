import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUsers, useUsersStatistics } from "@/hooks/useUsers";
import {
  UsersTable,
  UsersFilters,
  UserStats,
} from "@/features/users/components";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { useUserManagementPermissions } from "@/features/users/hooks/useUserManagementPermissions";
import type { UserFiltersDto } from "@/types/users.types";

export const UsersListPage = () => {
  const { t } = useTranslation();
  const { canCreateUsers, canAccessDeletedUsers } =
    useUserManagementPermissions();
  const [filters, setFilters] = useState<UserFiltersDto>({
    page: 1,
    pageSize: 10,
  });

  const handleFiltersChange = (newFilters: UserFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.isActive !== prev.isActive;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : newFilters.page || prev.page || 1,
      };
    });
  };

  const { data, isLoading, error } = useUsers(filters);
  const { data: userStats } = useUsersStatistics();

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("users.list.title", { defaultValue: "إدارة المستخدمين" })}
        description={t("users.list.description", {
          defaultValue: "إضافة وتعديل وإدارة مستخدمي النظام",
        })}
        actions={
          <>
            <PermissionGate permissions={[PERMISSIONS.USER_DELETE]}>
              {canAccessDeletedUsers ? (
                <Button variant="outline" asChild>
                  <Link to="/users/deleted">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("users.actions.viewDeleted", {
                      defaultValue: "المستخدمين المحذوفين",
                    })}
                  </Link>
                </Button>
              ) : null}
            </PermissionGate>

            <PermissionGate
              roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN]}
              permissions={[PERMISSIONS.USER_WRITE]}
            >
              {canCreateUsers ? (
                <Button asChild>
                  <Link to="/users/create">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("users.actions.create", {
                      defaultValue: "إضافة مستخدم",
                    })}
                  </Link>
                </Button>
              ) : null}
            </PermissionGate>
          </>
        }
      />

      <UserStats stats={userStats} />

      <UsersFilters filters={filters} onFiltersChange={handleFiltersChange} />

      <UsersTable
        data={data?.data || []}
        meta={data?.meta}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {error && (
        <Card className="border-[var(--invalid-border)] bg-[var(--error-bg)]">
          <CardContent className="p-6">
            <p className="text-center text-[var(--error)]">
              {t("users.list.errorLoading", {
                defaultValue: "حدث خطأ أثناء تحميل بيانات المستخدمين",
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
