import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeesFilters } from "@/features/employees/components/EmployeesFilters";
import { EmployeesTable } from "@/features/employees/components/EmployeesTable";
import { EmployeeStats } from "@/features/employees/components/EmployeeStats";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS } from "@/config/permissions.constants";
import { EmployeeFiltersDto } from "@/types/employees.types";

/**
 * EmployeesListPage Component
 *
 * Main page for employees management with:
 * - Page header with title and "Add Employee" button
 * - Statistics cards showing counts (total, active, on leave, terminated)
 * - Comprehensive filters (search, status, employment type, department, etc.)
 * - Data table with pagination
 * - Help steps for user guidance
 *
 * Features:
 * - Real-time data fetching with React Query
 * - Filter state management
 * - Responsive layout
 * - Loading and error states handled by child components
 *
 * Permissions:
 * - View: employees:read (handled by route protection)
 * - Create: employees:create (button shown conditionally - future enhancement)
 */
export const EmployeesListPage = () => {
  const { t } = useTranslation();

  // Filter state management
  const [filters, setFilters] = useState<EmployeeFiltersDto>({
    page: 1,
    pageSize: 10,
  });

  const handleFiltersChange = (newFilters: EmployeeFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.status !== prev.status ||
        newFilters.departmentId !== prev.departmentId;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : newFilters.page || prev.page || 1,
      };
    });
  };

  // Fetch employees data with current filters
  const { data, isLoading, error } = useEmployees(filters);

  return (
    <PageShell size="wide" density="compact">
      {/* Page Header */}
      <PageHeader
        title={t("employees.list.title")}
        description={t("employees.list.description")}
        actions={
          <PermissionGate permissions={[PERMISSIONS.EMPLOYEE_WRITE]}>
            <Button asChild>
              <Link to="/employees/create">
                <Plus className="h-4 w-4 mr-2" />
                {t("employees.actions.create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />
      {/* Statistics Cards */}
      <EmployeeStats />

      {/* Filters */}
      <EmployeesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <EmployeesTable
        data={data?.data || []}
        totalItems={data?.meta?.totalItems ?? data?.total ?? 0}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Error State */}
      {error && (
        <Card className="border-[var(--invalid-border)] bg-[var(--error-bg)]">
          <CardContent className="p-6">
            <p className="text-[var(--error)] text-center">
              {t("employees.list.errorLoading")}
            </p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
