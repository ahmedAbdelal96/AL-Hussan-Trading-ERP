import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
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
import { SiteStatus, type SiteFiltersDto } from "@/types/sites.types";

interface SitesFiltersProps {
  filters: SiteFiltersDto;
  onFiltersChange: (filters: SiteFiltersDto) => void;
}

/**
 * Simplified filters for daily site operations:
 * - Search
 * - Status
 */
export const SitesFilters = ({
  filters,
  onFiltersChange,
}: SitesFiltersProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        onFiltersChange({
          ...filters,
          search: searchTerm || undefined,
          page: 1,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as SiteStatus),
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize || 10,
    });
  };

  const hasActiveFilters = Boolean(filters.search || filters.status);

  return (
    <FilterBar compact>
      <div className="space-y-4">
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t("sites.filters.clear")}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none rtl:left-auto rtl:right-3" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("sites.placeholders.search")}
              className="h-10 pl-10 pr-3 rtl:pr-10 rtl:pl-3"
            />
          </div>

          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("sites.placeholders.selectStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {Object.values(SiteStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`sites.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FilterBar>
  );
};
