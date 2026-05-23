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
import type { AllowanceTypeFiltersDto } from "@/types/payroll.types";

interface AllowanceTypesFiltersProps {
  filters: AllowanceTypeFiltersDto;
  onFiltersChange: (filters: AllowanceTypeFiltersDto) => void;
}

/**
 * Minimal filter set for allowance types to keep daily workflows fast:
 * - Search
 * - Active status
 */
export const AllowanceTypesFilters = ({
  filters,
  onFiltersChange,
}: AllowanceTypesFiltersProps) => {
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
      isActive: value === "all" ? undefined : value === "active",
      page: 1,
    });
  };

  const handleClear = () => {
    setSearch("");
    onFiltersChange({
      page: 1,
      limit: filters.limit || 10,
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim()) || filters.isActive !== undefined,
  );

  return (
    <FilterBar compact>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--font-card-title-size)] leading-[var(--font-card-title-line)] font-semibold text-[var(--text-primary)]">
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] rtl:left-auto rtl:right-3" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("payroll.allowanceTypes.filters.searchPlaceholder")}
              className="h-10 pl-10 rtl:pl-3 rtl:pr-10"
            />
          </div>

          <Select
            value={
              filters.isActive === undefined
                ? "all"
                : filters.isActive
                  ? "active"
                  : "inactive"
            }
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("payroll.allowanceTypes.filters.allStatus")}
              </SelectItem>
              <SelectItem value="active">
                {t("payroll.common.status.active")}
              </SelectItem>
              <SelectItem value="inactive">
                {t("payroll.common.status.inactive")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FilterBar>
  );
};
