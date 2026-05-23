import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { useDeletedUsers } from "@/hooks/useUsers";
import { DeletedUsersTable, UsersFilters } from "@/features/users/components";
import type { UserFiltersDto } from "@/types/users.types";

export const DeletedUsersPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<UserFiltersDto>({
    page: 1,
    pageSize: 10,
  });

  const { data, isLoading } = useDeletedUsers(filters);

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title={t("users.deleted.title", { defaultValue: "Deleted Users" })}
        subtitle={t("users.deleted.description", {
          defaultValue: "Review and restore deleted users",
        })}
        icon={<Trash2 className="h-5 w-5" />}
        actions={
          <Button variant="outline" asChild>
            <Link to="/users">
              <ArrowRight className="h-4 w-4 ml-2" />
              {t("users.actions.backToList", {
                defaultValue: "Back to Users",
              })}
            </Link>
          </Button>
        }
      />

      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">
          {t("users.deleted.info", {
            defaultValue:
              "This page shows users deleted from the system. You can restore them to reactivate their accounts.",
          })}
        </p>
      </div>

      <UsersFilters
        filters={filters}
        onFiltersChange={setFilters}
        hideStatusFilter
      />

      <DeletedUsersTable
        data={data?.data || []}
        meta={data?.meta}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </PageShell>
  );
};
