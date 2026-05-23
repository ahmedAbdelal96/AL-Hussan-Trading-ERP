/**
 * Assets Filters Component
 *
 * Advanced filtering sidebar for assets list
 * Supports search, type, status, category, and location filters
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import { AssetType, AssetStatus, AssetFiltersDto } from "@/types/assets.types";
import { Search, X } from "lucide-react";
import { FilterBar } from "@/components/common/FilterBar";

interface AssetsFiltersProps {
  filters: AssetFiltersDto;
  onFiltersChange: (filters: AssetFiltersDto) => void;
  onClear: () => void;
}

export const AssetsFilters = ({
  filters,
  onFiltersChange,
  onClear,
}: AssetsFiltersProps) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<AssetFiltersDto>(filters);

  // Update local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (
    key: keyof AssetFiltersDto,
    value: AssetFiltersDto[keyof AssetFiltersDto],
  ) => {
    const newFilters = {
      ...localFilters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleFilterChange("search", value || undefined);
  };

  const handleClear = () => {
    setLocalFilters({
      page: 1,
      limit: filters.limit || 20,
    });
    onClear();
  };

  // Check if any filters are active (excluding pagination)
  const hasActiveFilters =
    localFilters.search ||
    localFilters.assetType ||
    localFilters.status ||
    localFilters.category ||
    localFilters.manufacturer ||
    localFilters.currentLocation;

  return (
    <FilterBar compact>
      <div className="space-y-4">
        {/* Clear Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8 px-2 text-xs text-[var(--text-secondary)]"
            >
              <X className="mr-1 h-3 w-3" />
              {t("assets.actions.clearFilters", { defaultValue: "Clear" })}
            </Button>
          </div>
        )}
        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <Label htmlFor="search" className="text-xs">
              {t("assets.filters.search", { defaultValue: "Search" })}
            </Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                id="search"
                placeholder={t("assets.placeholders.searchAssets", {
                  defaultValue: "Search...",
                })}
                value={localFilters.search || ""}
                onChange={handleSearchChange}
                className="pl-8 h-10"
              />
            </div>
          </div>

          {/* Asset Type */}
          <div>
            <Label htmlFor="assetType" className="text-xs">
              {t("assets.filters.type", { defaultValue: "Type" })}
            </Label>
            <Select
              value={localFilters.assetType || "ALL"}
              onValueChange={(value) =>
                handleFilterChange(
                  "assetType",
                  value === "ALL" ? undefined : value,
                )
              }
            >
              <SelectTrigger id="assetType" className="h-10 mt-1.5">
                <SelectValue
                  placeholder={t("assets.placeholders.selectType", {
                    defaultValue: "All Types",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("common.all", { defaultValue: "All" })}
                </SelectItem>
                {Object.values(AssetType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`assets.types.${type}`, { defaultValue: type })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-xs">
              {t("assets.filters.status", { defaultValue: "Status" })}
            </Label>
            <Select
              value={localFilters.status || "ALL"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "ALL" ? undefined : value)
              }
            >
              <SelectTrigger id="status" className="h-10 mt-1.5">
                <SelectValue
                  placeholder={t("assets.placeholders.selectStatus", {
                    defaultValue: "All Statuses",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("common.all", { defaultValue: "All" })}
                </SelectItem>
                {Object.values(AssetStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`assets.status.${status}`, { defaultValue: status })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-xs">
              {t("assets.filters.category", { defaultValue: "Category" })}
            </Label>
            <Input
              id="category"
              placeholder={t("assets.placeholders.selectCategory", {
                defaultValue: "Category...",
              })}
              value={localFilters.category || ""}
              onChange={(e) =>
                handleFilterChange("category", e.target.value || undefined)
              }
              className="h-10 mt-1.5"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-xs">
              {t("assets.filters.location", { defaultValue: "Location" })}
            </Label>
            <Input
              id="location"
              placeholder={t("assets.placeholders.location", {
                defaultValue: "Location...",
              })}
              value={localFilters.currentLocation || ""}
              onChange={(e) =>
                handleFilterChange("currentLocation", e.target.value || undefined)
              }
              className="h-10 mt-1.5"
            />
          </div>
        </div>
      </div>
    </FilterBar>
  );
};
