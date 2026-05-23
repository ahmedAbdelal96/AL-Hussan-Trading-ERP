import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/common/FilterBar";
import {
  CostType,
  PaymentStatus,
  type ProjectCostFiltersDto,
} from "@/types/finance.types";

interface CostFiltersProps {
  filters: ProjectCostFiltersDto;
  onFiltersChange: (filters: ProjectCostFiltersDto) => void;
  onReset: () => void;
}

const useDebounce = <T,>(value: T, delay = 400): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Simplified cost filters for daily work:
 * - Search
 * - Cost type
 * - Payment status
 */
export const CostFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: CostFiltersProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const debouncedSearch = useDebounce(searchTerm);

  useEffect(() => {
    if (debouncedSearch !== (filters.search || "")) {
      onFiltersChange({
        ...filters,
        search: debouncedSearch || undefined,
        page: 1,
      });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const costTypes = useMemo(
    () => [
      CostType.MAINTENANCE,
      CostType.PURCHASE,
      CostType.SALARY,
      CostType.ALLOWANCE,
      CostType.FUEL,
      CostType.MATERIAL,
      CostType.EQUIPMENT_RENTAL,
      CostType.SUBCONTRACTOR,
      CostType.UTILITY,
      CostType.TRANSPORTATION,
      CostType.INSURANCE,
      CostType.TAX,
      CostType.OTHER,
    ],
    [],
  );

  const paymentStatuses = useMemo(
    () => [
      PaymentStatus.PENDING,
      PaymentStatus.APPROVED,
      PaymentStatus.PAID,
      PaymentStatus.REJECTED,
      PaymentStatus.PARTIALLY_PAID,
      PaymentStatus.OVERDUE,
    ],
    [],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.costType) count++;
    if (filters.paymentStatus) count++;
    return count;
  }, [filters.search, filters.costType, filters.paymentStatus]);

  const handleFilterChange = (
    key: keyof ProjectCostFiltersDto,
    value: unknown,
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  const handleReset = () => {
    setSearchTerm("");
    onReset();
  };

  return (
    <FilterBar>
      <div className="space-y-4">
        {activeFiltersCount > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {t("finance.costs.filters.reset")}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input
              type="text"
              placeholder={t("finance.costs.filters.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10"
            />
          </div>

          <Select
            value={filters.costType || "all"}
            onValueChange={(value) =>
              handleFilterChange(
                "costType",
                value === "all" ? undefined : value,
              )
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("finance.costs.filters.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("finance.costs.filters.allTypes")}
              </SelectItem>
              {costTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`finance.costs.costTypes.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentStatus || "all"}
            onValueChange={(value) =>
              handleFilterChange(
                "paymentStatus",
                value === "all" ? undefined : value,
              )
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue
                placeholder={t("finance.costs.filters.allStatuses")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("finance.costs.filters.allStatuses")}
              </SelectItem>
              {paymentStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`finance.costs.paymentStatus.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[var(--text-tertiary)]">
              {t("finance.costs.filters.activeFilters")}:
            </span>
            {filters.costType && (
              <Badge variant="secondary" className="gap-1">
                {t(`finance.costs.costTypes.${filters.costType}`)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("costType", undefined)}
                />
              </Badge>
            )}
            {filters.paymentStatus && (
              <Badge variant="secondary" className="gap-1">
                {t(`finance.costs.paymentStatus.${filters.paymentStatus}`)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("paymentStatus", undefined)}
                />
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                {filters.search}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setSearchTerm("");
                    handleFilterChange("search", undefined);
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </FilterBar>
  );
};
