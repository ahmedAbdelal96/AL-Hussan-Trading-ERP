import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmployeeLoanFiltersDto, LoanStatus } from "@/types/payroll.types";

interface EmployeeLoansFiltersProps {
  filters: EmployeeLoanFiltersDto;
  onFiltersChange: (filters: EmployeeLoanFiltersDto) => void;
}

/**
 * Minimal filter set for employee loans:
 * - Search
 * - Approval status
 * - Payment status
 */
export const EmployeeLoansFilters = ({
  filters,
  onFiltersChange,
}: EmployeeLoansFiltersProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || "")) {
        onFiltersChange({
          ...filters,
          search: search || undefined,
          page: 1,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprovalStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      approvalStatus: value === "all" ? undefined : (value as LoanStatus),
      page: 1,
    });
  };

  const handlePaymentStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      paymentStatus: value === "all" ? undefined : value,
      page: 1,
    });
  };

  const handleClear = () => {
    setSearch("");
    onFiltersChange({
      page: 1,
      limit: filters.limit || filters.pageSize || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim()) ||
      filters.approvalStatus ||
      filters.paymentStatus,
  );

  return (
    <FilterBar compact>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {t("payroll.common.actions.filters", { defaultValue: "Filters" })}
          </h3>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t("payroll.common.actions.clear", { defaultValue: "Clear" })}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("payroll.employeeLoans.filters.searchPlaceholder")}
              className="pl-10 rtl:pl-3 rtl:pr-10"
            />
          </div>

          <Select
            value={filters.approvalStatus || "all"}
            onValueChange={handleApprovalStatusChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("payroll.employeeLoans.filters.allStatus")}
              </SelectItem>
              <SelectItem value="PENDING">
                {t("payroll.employeeLoans.status.pending")}
              </SelectItem>
              <SelectItem value="APPROVED">
                {t("payroll.employeeLoans.status.approved")}
              </SelectItem>
              <SelectItem value="REJECTED">
                {t("payroll.employeeLoans.status.rejected")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={handlePaymentStatusChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("payroll.employeeLoans.filters.allPaymentStatus")}
              </SelectItem>
              <SelectItem value="unpaid">
                {t("payroll.employeeLoans.paymentStatus.unpaid")}
              </SelectItem>
              <SelectItem value="partial">
                {t("payroll.employeeLoans.paymentStatus.partial")}
              </SelectItem>
              <SelectItem value="paid">
                {t("payroll.employeeLoans.paymentStatus.paid")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FilterBar>
  );
};
