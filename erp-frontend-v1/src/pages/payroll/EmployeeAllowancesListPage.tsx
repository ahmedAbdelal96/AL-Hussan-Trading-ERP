/**
 * Employee Allowances List Page
 *
 * Main page for managing employee allowances with approval workflow.
 *
 * Features:
 * - Statistics cards (total, pending, approved, rejected)
 * - Approval queue highlighting
 * - Advanced filtering
 * - Paginated table with actions
 * - Inline approval/rejection
 * - Responsive design
 *
 * Architecture:
 * - React Query with approval mutations
 * - Optimistic UI updates
 * - Toast notifications
 *
 * @page EmployeeAllowancesListPage
 * @module Payroll
 */

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { InfoCard } from "@/components/common/InfoCard";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useEmployeeAllowances,
  useEmployeeAllowancesStatistics,
} from "@/hooks/useEmployeeAllowances";
import { EmployeeAllowancesTable } from "@/features/payroll/components/employee-allowances/EmployeeAllowancesTable";
import { EmployeeAllowancesFilters } from "@/features/payroll/components/employee-allowances/EmployeeAllowancesFilters";
import type { EmployeeAllowanceFiltersDto } from "@/types/payroll.types";

/**
 * EmployeeAllowancesListPage Component
 */
export const EmployeeAllowancesListPage = () => {
  const { t } = useTranslation();

  // Filter state
  const [filters, setFilters] = useState<EmployeeAllowanceFiltersDto>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch data
  const { data, isLoading } = useEmployeeAllowances(filters);
  const { data: statsData, isLoading: statsLoading } =
    useEmployeeAllowancesStatistics({
      employeeId: filters.employeeId,
      allowanceTypeId: filters.allowanceTypeId,
      frequency: filters.frequency,
    });

  /**
   * Calculate statistics
   */
  const statistics = useMemo(
    () =>
      statsData ?? {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    [statsData],
  );

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: EmployeeAllowanceFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.approvalStatus !== prev.approvalStatus;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page || prev.page || 1),
      };
    });
  };

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("payroll.employeeAllowances.list.title")}
        description={t("payroll.employeeAllowances.list.description")}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={DollarSign}
          label={t("payroll.employeeAllowances.statistics.total")}
          value={statsLoading ? "..." : statistics.total}
          variant="blue"
          valueSize="xl"
        />
        <InfoCard
          icon={Clock}
          label={t("payroll.employeeAllowances.statistics.pending")}
          value={statsLoading ? "..." : statistics.pending}
          variant="amber"
          valueSize="xl"
        />
        <InfoCard
          icon={CheckCircle}
          label={t("payroll.employeeAllowances.statistics.approved")}
          value={statsLoading ? "..." : statistics.approved}
          variant="green"
          valueSize="xl"
        />
        <InfoCard
          icon={XCircle}
          label={t("payroll.employeeAllowances.statistics.rejected")}
          value={statsLoading ? "..." : statistics.rejected}
          variant="red"
          valueSize="xl"
        />
      </div>

      {/* Filters */}
      <EmployeeAllowancesFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <EmployeeAllowancesTable
        data={data?.data || []}
        total={data?.total || 0}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </PageShell>
  );
};

export default EmployeeAllowancesListPage;
