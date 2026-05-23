import { useEffect, useState } from "react";
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
import { EmployeeFiltersDto, EmployeeStatus } from "@/types/employees.types";
import { useActiveDepartments } from "@/hooks/useDepartments";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";

interface EmployeesFiltersProps {
  filters: EmployeeFiltersDto;
  onFiltersChange: (filters: EmployeeFiltersDto) => void;
}

/**
 * Simplified filters for daily operations:
 * - Search
 * - Status
 * - Department
 */
export const EmployeesFilters = ({
  filters,
  onFiltersChange,
}: EmployeesFiltersProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canReadDepartments = hasPermission(PERMISSIONS.DEPARTMENT_READ);
  const { data: departments = [] } = useActiveDepartments({
    enabled: canReadDepartments,
  });
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

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as EmployeeStatus),
      page: 1,
    });
  };

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({
      ...filters,
      departmentId: value === "all" ? undefined : value,
      positionId: undefined,
      page: 1,
    });
  };

  const handleReset = () => {
    setSearch("");
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.departmentId,
  );

  return (
    <FilterBar compact>
      <div className="space-y-4">
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-[var(--text-secondary)]"
            >
              <X className="h-4 w-4 mr-2" />
              {t("employees.filters.reset")}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                placeholder={t("employees.filters.search")}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 pl-10 bg-[var(--bg-surface-primary)] rtl:pl-3 rtl:pr-10"
              />
            </div>
          </div>

          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-10 bg-[var(--bg-surface-primary)]">
              <SelectValue placeholder={t("employees.filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("employees.filters.allStatuses")}
              </SelectItem>
              <SelectItem value={EmployeeStatus.ACTIVE}>
                {t("employees.status.ACTIVE")}
              </SelectItem>
              <SelectItem value={EmployeeStatus.INACTIVE}>
                {t("employees.status.INACTIVE")}
              </SelectItem>
              <SelectItem value={EmployeeStatus.ON_LEAVE}>
                {t("employees.status.ON_LEAVE")}
              </SelectItem>
              <SelectItem value={EmployeeStatus.SUSPENDED}>
                {t("employees.status.SUSPENDED")}
              </SelectItem>
              <SelectItem value={EmployeeStatus.TERMINATED}>
                {t("employees.status.TERMINATED")}
              </SelectItem>
            </SelectContent>
          </Select>

          {canReadDepartments && (
            <Select
              value={filters.departmentId || "all"}
              onValueChange={handleDepartmentChange}
            >
              <SelectTrigger className="h-10 bg-[var(--bg-surface-primary)]">
                <SelectValue placeholder={t("employees.filters.department")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("employees.filters.allDepartments", {
                    defaultValue: "كل الأقسام",
                  })}
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </FilterBar>
  );
};

