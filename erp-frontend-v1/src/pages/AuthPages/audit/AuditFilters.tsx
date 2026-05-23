/**
 * Audit Filters — Collapsible filter panel for audit logs
 *
 * Features:
 * - Date range picker with quick-date buttons (24h / 7d / 30d)
 * - User dropdown
 * - Resource type dropdown (with all known types)
 * - Action checkboxes (multi-select)
 * - Status dropdown (single-select — backend limitation)
 * - Active filters summary with click-to-remove badges
 */

import { format, subDays } from "date-fns";
import { X, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuditAction, AuditStatus } from "@/types/audit.types";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";
import {
  getActionIcon,
  RESOURCE_TYPES,
  FILTERABLE_ACTIONS,
  type AuditTranslations,
} from "./audit-helpers";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditFiltersState {
  selectedUserId?: string;
  selectedActions: AuditAction[];
  selectedStatus?: AuditStatus;
  selectedResourceType?: string;
  dateRange: { startDate?: Date; endDate?: Date };
}

interface AuditFiltersProps {
  filters: AuditFiltersState;
  onFiltersChange: (filters: AuditFiltersState) => void;
  onPageReset: () => void;
  users: User[];
  isRTL: boolean;
  t: AuditTranslations;
}

export default function AuditFilters({
  filters,
  onFiltersChange,
  onPageReset,
  users,
  isRTL,
  t,
}: AuditFiltersProps) {
  const {
    selectedUserId,
    selectedActions,
    selectedStatus,
    selectedResourceType,
    dateRange,
  } = filters;

  const hasActiveFilters =
    !!selectedUserId ||
    selectedActions.length > 0 ||
    !!selectedStatus ||
    !!selectedResourceType ||
    !!dateRange.startDate ||
    !!dateRange.endDate;

  // ── Helpers ──

  function update(patch: Partial<AuditFiltersState>) {
    onFiltersChange({ ...filters, ...patch });
    onPageReset();
  }

  function clearAll() {
    onFiltersChange({
      selectedUserId: undefined,
      selectedActions: [],
      selectedStatus: undefined,
      selectedResourceType: undefined,
      dateRange: {},
    });
    onPageReset();
  }

  function toggleAction(action: AuditAction, checked: boolean) {
    const next = checked
      ? [...selectedActions, action]
      : selectedActions.filter((a) => a !== action);
    update({ selectedActions: next });
  }

  // ── Active filter count ──
  const activeFilterCount =
    selectedActions.length +
    (selectedUserId ? 1 : 0) +
    (selectedStatus ? 1 : 0) +
    (selectedResourceType ? 1 : 0) +
    (dateRange.startDate ? 1 : 0) +
    (dateRange.endDate ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-end">
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
                  {activeFilterCount}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="h-4 w-4 mr-2" />
                {t.clearFilters}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.startDate}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={
                  dateRange.startDate
                    ? format(dateRange.startDate, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) =>
                  update({
                    dateRange: {
                      ...dateRange,
                      startDate: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    },
                  })
                }
                className="pl-10"
                max={
                  dateRange.endDate
                    ? format(dateRange.endDate, "yyyy-MM-dd")
                    : undefined
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.endDate}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={
                  dateRange.endDate
                    ? format(dateRange.endDate, "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) =>
                  update({
                    dateRange: {
                      ...dateRange,
                      endDate: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    },
                  })
                }
                className="pl-10"
                min={
                  dateRange.startDate
                    ? format(dateRange.startDate, "yyyy-MM-dd")
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: t.last24Hours, days: 1 },
            { label: t.last7Days, days: 7 },
            { label: t.last30Days, days: 30 },
          ].map(({ label, days }) => (
            <Button
              key={days}
              variant="outline"
              size="sm"
              onClick={() =>
                update({
                  dateRange: {
                    startDate: subDays(new Date(), days),
                    endDate: new Date(),
                  },
                })
              }
            >
              {label}
            </Button>
          ))}
        </div>

        {/* User Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.filterByUser}</label>
          <select
            value={selectedUserId || ""}
            onChange={(e) =>
              update({ selectedUserId: e.target.value || undefined })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{t.allUsers}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t.filterByResourceType}
          </label>
          <select
            value={selectedResourceType || ""}
            onChange={(e) =>
              update({ selectedResourceType: e.target.value || undefined })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{t.allResourceTypes}</option>
            {RESOURCE_TYPES.map(({ value, labelAr, labelEn }) => (
              <option key={value} value={value}>
                {isRTL ? labelAr : labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter (multi-select checkboxes) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.filterByAction}</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {FILTERABLE_ACTIONS.map((action) => (
              <label
                key={action}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedActions.includes(action)}
                  onChange={(e) => toggleAction(action, e.target.checked)}
                  className="rounded border-[var(--input-border)]"
                />
                <span className="text-sm flex items-center gap-1">
                  {getActionIcon(action)}
                  {t.actions[action]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter (single-select dropdown) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t.filterByStatus}</label>
          <select
            value={selectedStatus || ""}
            onChange={(e) =>
              update({
                selectedStatus: (e.target.value as AuditStatus) || undefined,
              })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{t.allStatuses}</option>
            {(Object.values(AuditStatus) as AuditStatus[]).map((status) => (
              <option key={status} value={status}>
                {t.statuses[status]}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{t.activeFilters}:</span>

              {selectedUserId && (
                <Badge
                  className={getStatusBadgeClass(
                    "neutral",
                    "gap-1 cursor-pointer",
                  )}
                  onClick={() => update({ selectedUserId: undefined })}
                >
                  {t.user}:{" "}
                  {users.find((u) => u.id === selectedUserId)?.firstName ||
                    "N/A"}
                  <X className="h-3 w-3" />
                </Badge>
              )}

              {selectedResourceType && (
                <Badge
                  className={getStatusBadgeClass(
                    "neutral",
                    "gap-1 cursor-pointer",
                  )}
                  onClick={() => update({ selectedResourceType: undefined })}
                >
                  {isRTL ? "النوع" : "Type"}: {selectedResourceType}
                  <X className="h-3 w-3" />
                </Badge>
              )}

              {selectedStatus && (
                <Badge
                  className={getStatusBadgeClass(
                    "neutral",
                    "gap-1 cursor-pointer",
                  )}
                  onClick={() => update({ selectedStatus: undefined })}
                >
                  {t.statuses[selectedStatus]}
                  <X className="h-3 w-3" />
                </Badge>
              )}

              {dateRange.startDate && (
                <Badge
                  className={getStatusBadgeClass(
                    "neutral",
                    "gap-1 cursor-pointer",
                  )}
                  onClick={() =>
                    update({
                      dateRange: { ...dateRange, startDate: undefined },
                    })
                  }
                >
                  {t.from}: {format(dateRange.startDate, "yyyy-MM-dd")}
                  <X className="h-3 w-3" />
                </Badge>
              )}

              {dateRange.endDate && (
                <Badge
                  className={getStatusBadgeClass(
                    "neutral",
                    "gap-1 cursor-pointer",
                  )}
                  onClick={() =>
                    update({
                      dateRange: { ...dateRange, endDate: undefined },
                    })
                  }
                >
                  {t.to}: {format(dateRange.endDate, "yyyy-MM-dd")}
                  <X className="h-3 w-3" />
                </Badge>
              )}

              {selectedActions.map((action) => (
                <Badge
                  key={action}
                  className={getStatusBadgeClass(
                    "neutral",
                    "gap-1 cursor-pointer",
                  )}
                  onClick={() => toggleAction(action, false)}
                >
                  {t.actions[action]}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
