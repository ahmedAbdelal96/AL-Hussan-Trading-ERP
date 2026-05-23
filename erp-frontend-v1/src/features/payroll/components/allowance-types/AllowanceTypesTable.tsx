/**
 * Allowance Types Table Component
 *
 * Simple table for displaying allowance types (master data).
 * Includes CRUD actions and status management.
 *
 * Features:
 * - Bilingual name display (English/Arabic)
 * - Status badges
 * - Quick actions (edit, delete, toggle active)
 * - Pagination
 * - Export functionality
 *
 * @component AllowanceTypesTable
 * @module Payroll
 */

import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useDeleteAllowanceType,
  useUpdateAllowanceType,
} from "@/hooks/useAllowanceTypes";
import type {
  AllowanceTypeEntity,
  AllowanceTypeFiltersDto,
} from "@/types/payroll.types";

interface AllowanceTypesTableProps {
  data: AllowanceTypeEntity[];
  total: number;
  isLoading: boolean;
  filters: AllowanceTypeFiltersDto;
  onFiltersChange: (filters: AllowanceTypeFiltersDto) => void;
}

/**
 * AllowanceTypesTable Component
 */
export const AllowanceTypesTable = ({
  data,
  total,
  isLoading,
  filters,
  onFiltersChange,
}: AllowanceTypesTableProps) => {
  const { t } = useTranslation();
  const deleteMutation = useDeleteAllowanceType();
  const updateMutation = useUpdateAllowanceType();

  /**
   * Handle delete
   */
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /**
   * Handle toggle active
   */
  const handleToggleActive = async (type: AllowanceTypeEntity) => {
    try {
      await updateMutation.mutateAsync({
        id: type.id,
        data: {
          isActive: !type.isActive,
          rowVersion: type.rowVersion,
        },
      });
    } catch (error) {
      console.error("Toggle active error:", error);
    }
  };

  /**
   * Column Configuration
   */
  const columns: ColumnConfig<AllowanceTypeEntity>[] = [
    // Name
    {
      key: "name",
      label: t("payroll.allowanceTypes.table.name"),
      render: (type) => (
        <Link
          to={`/payroll/allowance-types/edit/${type.id}`}
          className="font-medium text-[var(--primary-main)] hover:underline"
        >
          {type.name}
        </Link>
      ),
      align: "start",
      exportValue: (type) => type.name,
    },

    // Description
    {
      key: "description",
      label: t("payroll.allowanceTypes.table.description"),
      render: (type) => (
        <span className="text-sm line-clamp-2">{type.description || "-"}</span>
      ),
      align: "start",
      hideMobile: true,
      exportValue: (type) => type.description || "-",
    },

    // Status
    {
      key: "isActive",
      label: t("payroll.allowanceTypes.table.status"),
      render: (type) => (
        <Badge variant={type.isActive ? "success" : "secondary"}>
          {type.isActive
            ? t("payroll.common.status.active")
            : t("payroll.common.status.inactive")}
        </Badge>
      ),
      align: "center",
      exportValue: (type) =>
        type.isActive
          ? t("payroll.common.status.active")
          : t("payroll.common.status.inactive"),
    },

    // Created Date
    {
      key: "createdAt",
      label: t("payroll.allowanceTypes.table.createdAt"),
      render: (type) => (
        <span className="text-sm text-[var(--text-tertiary)]">
          {new Date(type.createdAt).toLocaleDateString()}
        </span>
      ),
      align: "center",
      hideMobile: true,
      exportValue: (type) => new Date(type.createdAt).toLocaleDateString(),
    },

    // Actions
    {
      key: "actions",
      label: t("payroll.common.actions.title"),
      render: (type) => (
        <div className="flex items-center justify-end gap-2">
          {/* Edit */}
          <Button asChild variant="ghost" size="icon-sm">
            <Link to={`/payroll/allowance-types/edit/${type.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>

          {/* Toggle Active */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleToggleActive(type)}
            disabled={updateMutation.isPending}
          >
            {type.isActive ? (
              <XCircle className="h-4 w-4 text-[var(--warning)]" />
            ) : (
              <CheckCircle className="h-4 w-4 text-[var(--success)]" />
            )}
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-[var(--error)]" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("payroll.allowanceTypes.actions.deleteConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("payroll.allowanceTypes.actions.deleteConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("common.actions.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(type.id)}
                  className="bg-[var(--error)] hover:bg-[var(--error)]/90 text-[var(--text-on-brand)]"
                >
                  {t("common.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
      align: "end",
      exportValue: () => "",
    },
  ];

  return (
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        enableHoverActions={false}
        emptyMessage={t("payroll.allowanceTypes.table.empty")}
      keyExtractor={(item) => item.id}
      pagination={{
        currentPage: filters.page || 1,
        pageSize: filters.limit || 10,
        totalItems: total,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      }}
      onPageChange={(page) => onFiltersChange({ ...filters, page })}
      onPageSizeChange={(limit) =>
        onFiltersChange({ ...filters, limit, page: 1 })
      }
    />
  );
};
