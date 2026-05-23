/**
 * Allowance Types List Page
 *
 * Main page for managing allowance types (master data).
 * Displays all allowance types with filtering and CRUD operations.
 *
 * Features:
 * - Statistics cards (total, active, inactive)
 * - Search and filtering
 * - Paginated table with sorting
 * - Quick actions (edit, delete, activate/deactivate)
 * - Responsive design
 *
 * Architecture:
 * - Uses React Query for data fetching
 * - Automatic cache invalidation
 * - Optimistic UI updates
 *
 * @page AllowanceTypesListPage
 * @module Payroll
 */

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { Plus, Tag, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/common/InfoCard";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionGate } from "@/components/common/PermissionGate";
import {
  useAllowanceTypes,
  useAllowanceTypesStatistics,
} from "@/hooks/useAllowanceTypes";
import { AllowanceTypesTable } from "@/features/payroll/components/allowance-types/AllowanceTypesTable";
import { AllowanceTypesFilters } from "@/features/payroll/components/allowance-types/AllowanceTypesFilters";
import { PERMISSIONS } from "@/config/permissions.constants";
import type { AllowanceTypeFiltersDto } from "@/types/payroll.types";

/**
 * AllowanceTypesListPage Component
 */
export const AllowanceTypesListPage = () => {
  const { t } = useTranslation();

  // Filter state
  const [filters, setFilters] = useState<AllowanceTypeFiltersDto>({
    page: 1,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });

  // Fetch allowance types
  const { data, isLoading } = useAllowanceTypes(filters);
  const { data: statsData, isLoading: statsLoading } =
    useAllowanceTypesStatistics({
      search: filters.search,
      isActive: filters.isActive,
    });

  /**
   * Calculate statistics
   */
  const statistics = useMemo(
    () =>
      statsData ?? {
        total: 0,
        active: 0,
        inactive: 0,
      },
    [statsData],
  );

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: AllowanceTypeFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.isActive !== prev.isActive;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page || prev.page || 1),
      };
    });
  };

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("payroll.allowanceTypes.list.title")}
        description={t("payroll.allowanceTypes.list.description")}
        actions={
          <PermissionGate permissions={[PERMISSIONS.PAYROLL_WRITE]}>
            <Button asChild>
              <Link to="/payroll/allowance-types/create">
                <Plus className="h-4 w-4" />
                {t("payroll.allowanceTypes.actions.create")}
              </Link>
            </Button>
          </PermissionGate>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard
          icon={Tag}
          label={t("payroll.allowanceTypes.statistics.total")}
          value={statsLoading ? "..." : statistics.total}
          variant="blue"
          valueSize="xl"
        />
        <InfoCard
          icon={CheckCircle}
          label={t("payroll.allowanceTypes.statistics.active")}
          value={statsLoading ? "..." : statistics.active}
          variant="green"
          valueSize="xl"
        />
        <InfoCard
          icon={XCircle}
          label={t("payroll.allowanceTypes.statistics.inactive")}
          value={statsLoading ? "..." : statistics.inactive}
          variant="red"
          valueSize="xl"
        />
      </div>

      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <CardContent className="p-4">
          <AllowanceTypesFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      <AllowanceTypesTable
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </PageShell>
  );
};

export default AllowanceTypesListPage;
