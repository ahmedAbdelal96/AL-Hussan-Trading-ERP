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
import type {
  AllowanceStatus,
  EmployeeAllowanceFiltersDto,
} from "@/types/payroll.types";

interface EmployeeAllowancesFiltersProps {
  filters: EmployeeAllowanceFiltersDto;
  onFiltersChange: (filters: EmployeeAllowanceFiltersDto) => void;
}

/**
 * Minimal filter set for employee allowances:
 * - Search
 * - Approval status
 */
export const EmployeeAllowancesFilters = ({
  filters,
  onFiltersChange,
}: EmployeeAllowancesFiltersProps) => {
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

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      approvalStatus:
        value === "all" ? undefined : (value as AllowanceStatus),
      page: 1,
    });
  };

  const handleClear = () => {
    setSearch("");
    onFiltersChange({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim()) || filters.approvalStatus,
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("payroll.employeeAllowances.filters.searchPlaceholder")}
              className="pl-10 rtl:pl-3 rtl:pr-10"
            />
          </div>

          <Select
            value={filters.approvalStatus || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("payroll.employeeAllowances.filters.allStatus")}
              </SelectItem>
              <SelectItem value="PENDING">
                {t("payroll.employeeAllowances.status.pending")}
              </SelectItem>
              <SelectItem value="APPROVED">
                {t("payroll.employeeAllowances.status.approved")}
              </SelectItem>
              <SelectItem value="REJECTED">
                {t("payroll.employeeAllowances.status.rejected")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FilterBar>
  );
};
