/**
 * Employee Loans List Page
 *
 * Main page for managing employee loans with progress tracking.
 *
 * Features:
 * - Statistics (total, active, pending approval, completed)
 * - Loan progress indicators
 * - Approval workflow
 * - Payment installment tracking
 * - Advanced filtering
 *
 * @page EmployeeLoansListPage
 * @module Payroll
 */

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { InfoCard } from "@/components/common/InfoCard";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useEmployeeLoans,
  useEmployeeLoansStatistics,
} from "@/hooks/useEmployeeLoans";
import { EmployeeLoansTable } from "@/features/payroll/components/employee-loans/EmployeeLoansTable";
import { EmployeeLoansFilters } from "@/features/payroll/components/employee-loans/EmployeeLoansFilters";
import type { EmployeeLoanFiltersDto } from "@/types/payroll.types";

export const EmployeeLoansListPage = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<EmployeeLoanFiltersDto>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading } = useEmployeeLoans(filters);
  const { data: statsData, isLoading: statsLoading } =
    useEmployeeLoansStatistics({
      employeeId: filters.employeeId,
    });

  const statistics = useMemo(
    () =>
      statsData ?? {
        total: 0,
        pending: 0,
        active: 0,
        completed: 0,
      },
    [statsData],
  );

  const handleFiltersChange = (newFilters: EmployeeLoanFiltersDto) => {
    setFilters((prev) => {
      const shouldResetPage =
        newFilters.search !== prev.search ||
        newFilters.approvalStatus !== prev.approvalStatus ||
        newFilters.paymentStatus !== prev.paymentStatus;

      return {
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page || prev.page || 1),
      };
    });
  };

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("payroll.employeeLoans.list.title")}
        description={t("payroll.employeeLoans.list.description")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={DollarSign}
          label={t("payroll.employeeLoans.statistics.total")}
          value={statsLoading ? "..." : statistics.total}
          variant="blue"
          valueSize="xl"
        />
        <InfoCard
          icon={Clock}
          label={t("payroll.employeeLoans.statistics.pending")}
          value={statsLoading ? "..." : statistics.pending}
          variant="amber"
          valueSize="xl"
        />
        <InfoCard
          icon={TrendingUp}
          label={t("payroll.employeeLoans.statistics.active")}
          value={statsLoading ? "..." : statistics.active}
          variant="cyan"
          valueSize="xl"
        />
        <InfoCard
          icon={CheckCircle}
          label={t("payroll.employeeLoans.statistics.completed")}
          value={statsLoading ? "..." : statistics.completed}
          variant="green"
          valueSize="xl"
        />
      </div>

      <EmployeeLoansFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <EmployeeLoansTable
        loans={data?.data || []}
        totalCount={data?.total || 0}
        isLoading={isLoading}
        page={filters.page || 1}
        pageSize={filters.limit || filters.pageSize || 10}
        onPageChange={(page) =>
          setFilters((prev) => ({ ...prev, page }))
        }
        onPageSizeChange={(pageSize) =>
          setFilters((prev) => ({ ...prev, pageSize, limit: pageSize, page: 1 }))
        }
      />
    </PageShell>
  );
};

export default EmployeeLoansListPage;
