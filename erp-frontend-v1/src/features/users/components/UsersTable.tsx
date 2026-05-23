import { useTranslation } from "@/i18n/useTranslation";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserActions } from "./UserActions";
import { getUserFullName, getUserStatus } from "@/types/users.types";
import type { UserEntity, UserFiltersDto } from "@/types/users.types";

interface UsersTableProps {
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

const getPrimaryRole = (user: UserEntity): string => user.roles?.[0] ?? "-";

export const UsersTable = ({
  data,
  meta,
  isLoading,
  error,
  filters,
  onFiltersChange,
}: UsersTableProps) => {
  const { t } = useTranslation();

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

  const columns: ColumnConfig<UserEntity>[] = [
    {
      key: "name",
      label: t("users.table.name"),
      render: (user) => (
        <span className="font-medium">{getUserFullName(user)}</span>
      ),
      align: "start",
      sortable: true,
      sortFn: (a, b) =>
        getUserFullName(a).localeCompare(getUserFullName(b), "ar"),
      exportValue: (user) => getUserFullName(user),
    },
    {
      key: "email",
      label: t("users.table.email"),
      render: (user) => (
        <span className="text-sm text-text-secondary">{user.email}</span>
      ),
      align: "start",
      sortable: true,
      sortFn: (a, b) => a.email.localeCompare(b.email),
      exportValue: (user) => user.email,
    },
    {
      key: "phone",
      label: t("users.table.phone"),
      render: (user) => (
        <span className="text-sm">
          {user.phone || <span className="text-text-tertiary">-</span>}
        </span>
      ),
      align: "start",
      hideMobile: true,
      sortable: true,
      sortFn: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
      exportValue: (user) => user.phone || "-",
    },
    {
      key: "role",
      label: t("users.table.role"),
      render: (user) => (
        <Badge variant="secondary" className="font-medium">
          {getPrimaryRole(user)}
        </Badge>
      ),
      align: "start",
      sortable: true,
      sortFn: (a, b) => getPrimaryRole(a).localeCompare(getPrimaryRole(b)),
      exportValue: (user) => getPrimaryRole(user),
    },
    {
      key: "status",
      label: t("users.table.status"),
      render: (user) => <UserStatusBadge user={user} />,
      align: "center",
      sortable: true,
      sortFn: (a, b) => getUserStatus(a).localeCompare(getUserStatus(b)),
      exportValue: (user) => getUserStatus(user),
    },
    {
      key: "actions",
      label: t("common.actionsLabel"),
      render: (user) => <UserActions user={user} />,
      align: "end",
      className: "w-20",
      excludeFromExport: true,
    },
  ];

  const totalItems = meta?.totalItems || data.length || 0;

  return (
    <DataTable
      data={data}
      columns={columns}
      pagination={
        meta
          ? {
              currentPage: meta.page,
              pageSize: meta.pageSize,
              totalItems: meta.totalItems,
              totalPages: meta.totalPages,
            }
          : {
              currentPage: filters.page || 1,
              pageSize: filters.pageSize || 10,
              totalItems,
              totalPages: Math.ceil(totalItems / (filters.pageSize || 10)),
            }
      }
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      pageSizeOptions={[10, 20, 50, 100]}
      isLoading={isLoading}
      error={(error as Error) || null}
      emptyMessage={t("users.table.empty")}
      keyExtractor={(user) => user.id}
      avatar={{
        imageUrl: (user) => user.profilePicture,
        name: (user) => getUserFullName(user),
        alt: (user) => `${getUserFullName(user)} avatar`,
      }}
      enableCompactMode
      defaultCompact={false}
      enableClientSorting
      enableHoverActions={false}
      enableExport
      exportFilename="users_list"
      exportTitle={t("users.title")}
      className="shadow-sm"
    />
  );
};
