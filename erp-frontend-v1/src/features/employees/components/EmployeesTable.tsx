/**
 * Employees Table Component v3.1
 *
 * Enterprise-grade employees table with:
 * - DataTable v3.1 integration
 * - Sorting & Selection
 * - Bulk Actions
 * - Compact Mode
 * - Export to Excel/PDF
 * - Loading states
 * - Empty state
 *
 * @module EmployeesTable
 * @version 3.1.0
 */

import { useTranslation } from "@/i18n/useTranslation";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import { EmploymentTypeBadge } from "./EmploymentTypeBadge";
import { EmployeeActions } from "./EmployeeActions";
import {
  EmployeeEntity,
  EmployeeFiltersDto,
  getEmployeeFullName,
} from "@/types/employees.types";
import { PersonAvatar } from "@/components/common/PersonAvatar";

/** Avatar cell - profile picture or icon fallback */
function AvatarCell({ employee }: { employee: EmployeeEntity }) {
  const name = getEmployeeFullName(employee);
  return <PersonAvatar src={employee.profilePicture} alt={name} className="h-9 w-9" />;
}

interface EmployeesTableProps {
  data: EmployeeEntity[];
  totalItems: number;
  isLoading: boolean;
  filters: EmployeeFiltersDto;
  onFiltersChange: (filters: EmployeeFiltersDto) => void;
}

/**
 * EmployeesTable Component
 *
 * Displays employee records in a responsive table with full features
 */
export const EmployeesTable = ({
  data,
  totalItems,
  isLoading,
  filters,
  onFiltersChange,
}: EmployeesTableProps) => {
  const { t } = useTranslation();

  const currentPage = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    onFiltersChange({ ...filters, pageSize: newSize, page: 1 });
  };

  // Column Configuration for DataTable
  const columns: ColumnConfig<EmployeeEntity>[] = [
    {
      key: "photo",
      label: t("employees.table.photo"),
      width: "56px",
      align: "center",
      excludeFromExport: true,
      render: (employee) => (
        <a
          href={`/employees/${employee.id}`}
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
          aria-hidden="true"
        >
          <AvatarCell employee={employee} />
        </a>
      ),
    },
    {
      key: "fullName",
      label: t("employees.table.fullName"),
      sortable: true,
      render: (employee) => (
        <a
          href={`/employees/${employee.id}`}
          className="font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {getEmployeeFullName(employee)}
        </a>
      ),
      exportValue: (employee) => getEmployeeFullName(employee),
    },
    /*  {
      key: "nationalId",
      label: t("employees.table.nationalId"),
      render: (employee) => (
        <span className="font-mono text-sm">{employee.nationalId}</span>
      ),
      exportValue: (employee) => employee.nationalId,
    }, */
    {
      key: "phone",
      label: t("employees.table.phone"),
      render: (employee) => (
        <span className="text-sm">{employee.phone || "-"}</span>
      ),
      exportValue: (employee) => employee.phone || "-",
    },
    /*     {
      key: "email",
      label: t("employees.table.email"),
      render: (employee) => (
        <span className="text-sm">{employee.email || "-"}</span>
      ),
      exportValue: (employee) => employee.email || "-",
    }, */
    {
      key: "departmentName",
      label: t("employees.table.department"),
      render: (employee) => (
        <span className="text-sm">{employee.departmentName || "-"}</span>
      ),
      exportValue: (employee) => employee.departmentName || "-",
    },
    {
      key: "positionName",
      label: t("employees.table.position"),
      render: (employee) => (
        <span className="text-sm">{employee.positionName || "-"}</span>
      ),
      exportValue: (employee) => employee.positionName || "-",
    },
    {
      key: "employmentType",
      label: t("employees.table.employmentType"),
      sortable: true,
      render: (employee) => (
        <EmploymentTypeBadge type={employee.employmentType} />
      ),
      exportValue: (employee) => employee.employmentType ?? "-",
    },
    {
      key: "status",
      label: t("employees.table.status"),
      sortable: true,
      render: (employee) => <EmployeeStatusBadge status={employee.status} />,
      exportValue: (employee) => employee.status ?? "-",
    },
    /*     {
      key: "hireDate",
      label: t("employees.table.hireDate"),
      sortable: true,
      render: (employee) => (
        <span className="text-sm">
          {new Date(employee.hireDate).toLocaleDateString(getCurrentLocale())}
        </span>
      ),
      exportValue: (employee) =>
        new Date(employee.hireDate).toLocaleDateString(getCurrentLocale()),
    }, */
    {
      key: "actions",
      label: t("employees.table.actions"),
      align: "center",
      render: (employee) => <EmployeeActions employee={employee} />,
      excludeFromExport: true,
    },
  ];

  // Loading State
  if (isLoading) {
    return (
      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <CardContent className="p-12">
          <div className="text-center">
            <p className="text-lg font-medium text-[var(--text-secondary)]">
              {t("employees.list.empty")}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-2">
              {t("employees.list.emptyDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render DataTable with all features
  return (
    <DataTable<EmployeeEntity>
      data={data}
      columns={columns}
      keyExtractor={(employee) => employee.id}
      enableClientSorting={true}
      enableSelection={false}
      enableCompactMode={true}
      defaultCompact={true}
      enableHoverActions={false}
      enableExport={true}
      exportFilename="employees_list"
      exportTitle={t("employees.title")}
      className="shadow-[var(--shadow-xs)]"
      pagination={{
        currentPage,
        pageSize,
        totalItems,
        totalPages,
      }}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );
};

