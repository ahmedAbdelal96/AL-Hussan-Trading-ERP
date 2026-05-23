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
import { ProjectStatus, type ProjectFiltersDto } from "@/types/projects.types";

interface ProjectsFiltersProps {
  filters: ProjectFiltersDto;
  onFiltersChange: (filters: ProjectFiltersDto) => void;
}

/**
 * Minimal project filters for daily usage:
 * - Search
 * - Status
 */
export const ProjectsFilters = ({
  filters,
  onFiltersChange,
}: ProjectsFiltersProps) => {
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
      status: value === "all" ? undefined : (value as ProjectStatus),
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
    (filters.search && filters.search.trim()) || filters.status,
  );

  return (
    <FilterBar compact>
      <div className="space-y-4">
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <X className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t("projects.actions.clearFilters")}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] rtl:left-auto rtl:right-3" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("projects.placeholders.search")}
              className="h-10 pl-10 rtl:pl-3 rtl:pr-10"
            />
          </div>

          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t("projects.filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {Object.values(ProjectStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`projects.status.${status.toLowerCase()}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FilterBar>
  );
};
