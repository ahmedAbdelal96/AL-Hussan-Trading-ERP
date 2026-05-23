import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/common/FilterBar";
import type { UserFiltersDto } from "@/types/users.types";

interface UsersFiltersProps {
  filters: UserFiltersDto;
  onFiltersChange: (filters: UserFiltersDto) => void;
  hideStatusFilter?: boolean; // Optional prop to hide status filter
}

export const UsersFilters = ({
  filters,
  onFiltersChange,
  hideStatusFilter = false,
}: UsersFiltersProps) => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced API call
    debounceTimerRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value, page: 1 });
    }, 500); // 500ms delay
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      const { isActive, ...rest } = filters;
      onFiltersChange({ ...rest, page: 1 });
    } else {
      onFiltersChange({ ...filters, isActive: value === "active", page: 1 });
    }
  };

  const handleReset = () => {
    setSearchInput("");
    onFiltersChange({ page: 1, pageSize: filters.pageSize });
  };

  const hasActiveFilters =
    filters.search ||
    filters.isActive !== undefined ||
    filters.roleId ||
    filters.roleName;

  return (
    <FilterBar compact>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                placeholder={t("users.filters.searchPlaceholder", {
                  defaultValue: "ابحث بالاسم أو البريد الإلكتروني...",
                })}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 pr-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          {!hideStatusFilter && (
            <div className="w-full md:w-48">
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
                    {t("users.filters.all", { defaultValue: "الكل" })}
                  </SelectItem>
                  <SelectItem value="active">
                    {t("users.filters.active", { defaultValue: "نشط" })}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t("users.filters.inactive", { defaultValue: "غير نشط" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <X className="h-4 w-4" />
              {t("common.reset", { defaultValue: "إعادة تعيين" })}
            </Button>
          )}
        </div>
      </FilterBar>
  );
};


