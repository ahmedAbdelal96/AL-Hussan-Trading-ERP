/**
 * ============================================================================
 * SITE PROFITABILITY REPORT
 * ============================================================================
 *
 * Report 7: Revenue (project budgets) vs total costs per site.
 *
 * @page SiteProfitabilityReport
 * @version 1.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MapPin,
} from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusBadgeClass, type StatusTone } from "@/components/common/statusBadgeStyles";

import { useSiteProfitability } from "@/hooks/reports/useSitesReport";

import type {
  SiteProfitabilityFilters,
  SiteProfitabilityItem,
} from "@/types/reports/sites.types";

import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router";

// ============ FILTER TYPES ============

interface LocalFilters {
  search?: string;
  profitabilityRating?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ============ HELPERS ============

const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString()}`;

const ratingTone = (
  rating: SiteProfitabilityItem["profitabilityRating"],
): StatusTone => {
  if (rating === "HIGH") return "success";
  if (rating === "MEDIUM") return "info";
  if (rating === "LOW") return "warning";
  return "danger"; // LOSS
};

// ============ PAGE COMPONENT ============

export const SiteProfitabilityReport: React.FC = () => {
  const { t } = useTranslation();

  const RATING_LABEL = useMemo(
    () => ({
      HIGH: t("reports.sites.profitability.high"),
      MEDIUM: t("reports.sites.profitability.medium"),
      LOW: t("reports.sites.profitability.low"),
      LOSS: t("reports.sites.profitability.loss"),
    }),
    [t],
  );

  const RATING_OPTIONS = useMemo(
    () => [
      {
        value: "HIGH",
        label: t("reports.sites.profitability.high"),
      },
      {
        value: "MEDIUM",
        label: t("reports.sites.profitability.medium"),
      },
      {
        value: "LOW",
        label: t("reports.sites.profitability.low"),
      },
      {
        value: "LOSS",
        label: t("reports.sites.profitability.loss"),
      },
    ],
    [t],
  );

  const SORT_OPTIONS = useMemo(
    () => [
      {
        value: "profit",
        label: t("reports.sites.sort.profit"),
      },
      {
        value: "margin",
        label: t("reports.sites.sort.margin"),
      },
      {
        value: "revenue",
        label: t("reports.sites.sort.revenue"),
      },
      {
        value: "siteName",
        label: t("reports.sites.sort.siteName"),
      },
    ],
    [t],
  );

  const ORDER_OPTIONS = useMemo(
    () => [
      {
        value: "desc",
        label: t("common.descending"),
      },
      {
        value: "asc",
        label: t("common.ascending"),
      },
    ],
    [t],
  );

  // ---- State ----
  const [localFilters, setLocalFilters] = useState<LocalFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---- API filters ----
  const apiFilters = useMemo<SiteProfitabilityFilters>(
    () => ({
      ...(localFilters.profitabilityRating && {
        profitabilityRating:
          localFilters.profitabilityRating as SiteProfitabilityFilters["profitabilityRating"],
      }),
      ...(localFilters.sortBy && {
        sortBy: localFilters.sortBy as SiteProfitabilityFilters["sortBy"],
      }),
      ...(localFilters.sortOrder && {
        sortOrder: localFilters.sortOrder as "asc" | "desc",
      }),
    }),
    [localFilters],
  );

  // ---- Data ----
  const { data, isLoading, error, refetch } = useSiteProfitability(apiFilters);

  // ---- Filter config ----
  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "profitabilityRating",
        label: t("reports.sites.filters.rating"),
        placeholder: t("common.all"),
        options: RATING_OPTIONS,
      },
      {
        key: "sortBy",
        label: t("reports.sites.filters.sortBy"),
        placeholder: t("common.default"),
        options: SORT_OPTIONS,
      },
      {
        key: "sortOrder",
        label: t("reports.sites.filters.sortOrder"),
        placeholder: t("common.default"),
        options: ORDER_OPTIONS,
      },
    ],
    [t, RATING_OPTIONS, SORT_OPTIONS, ORDER_OPTIONS],
  );

  // ---- Client-side search ----
  const filteredData = useMemo(() => {
    let items = data?.sites || [];
    if (localFilters.search) {
      const q = localFilters.search.toLowerCase();
      items = items.filter((s) => s.siteName.toLowerCase().includes(q));
    }
    return items;
  }, [data, localFilters.search]);

  // ---- Pagination ----
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleFilterChange = useCallback((f: LocalFilters) => {
    setLocalFilters(f);
    setPage(1);
  }, []);

  const currency = CURRENCY.DEFAULT;
  const summary = data?.summary;
  const alerts = useMemo(() => {
    if (!summary) return [];
    const items: Array<{ key: string; tone: "warning" | "danger"; message: string }> = [];
    if (summary.lossCount > 0) {
      items.push({
        key: "loss-sites",
        tone: "danger",
        message: `${summary.lossCount} ${t("reports.sites.kpi.lossCount")}`,
      });
    }
    if ((summary.avgProfitMargin ?? 0) < 5) {
      items.push({
        key: "low-margin",
        tone: "warning",
        message: t("reports.sites.kpi.avgMargin"),
      });
    }
    return items;
  }, [summary, t]);

  // ---- Columns ----
  const columns: ColumnConfig<SiteProfitabilityItem>[] = useMemo(
    () => [
      {
        key: "siteName",
        label: t("reports.sites.table.site"),
        render: (s) => (
          <div>
            <p className="font-medium text-sm">{s.siteName}</p>
            <p className="text-xs text-muted-foreground">
              {t(`reports.sites.status.${s.siteStatus}`, {
                defaultValue: s.siteStatus,
              })}
            </p>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.siteName.localeCompare(b.siteName),
        exportValue: (s) => s.siteName,
      },
      {
        key: "projectCount",
        label: t("reports.sites.table.projects"),
        render: (s) => (
          <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
            {s.projectCount}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) => a.projectCount - b.projectCount,
        exportValue: (s) => s.projectCount,
        align: "center" as const,
      },
      {
        key: "totalRevenue",
        label: t("reports.sites.table.revenue"),
        render: (s) => (
          <span className="text-sm" dir="ltr">
            {fmtCurrency(s.totalRevenue, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalRevenue - b.totalRevenue,
        exportValue: (s) => s.totalRevenue,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "totalCosts",
        label: t("reports.sites.table.costs"),
        render: (s) => (
          <span className="text-sm font-semibold" dir="ltr">
            {fmtCurrency(s.totalCosts, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalCosts - b.totalCosts,
        exportValue: (s) => s.totalCosts,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "profit",
        label: t("reports.sites.table.profit"),
        render: (s) => (
          <span
            className={`text-sm font-medium ${
              s.profit >= 0 ? "text-green-600" : "text-red-600"
            }`}
            dir="ltr"
          >
            {s.profit >= 0 ? "+" : ""}
            {fmtCurrency(s.profit, currency)}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.profit - b.profit,
        exportValue: (s) => s.profit,
        align: "end" as const,
      },
      {
        key: "profitMargin",
        label: t("reports.sites.table.margin"),
        render: (s) => (
          <span
            className={`text-sm font-medium ${
              s.profitMargin === null
                ? "text-muted-foreground"
                : s.profitMargin >= 20
                  ? "text-green-600"
                  : s.profitMargin >= 0
                    ? "text-blue-600"
                    : "text-red-600"
            }`}
          >
            {s.profitMargin !== null
              ? `${s.profitMargin >= 0 ? "+" : ""}${s.profitMargin.toFixed(1)}%`
              : "—"}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          (a.profitMargin ?? -Infinity) - (b.profitMargin ?? -Infinity),
        exportValue: (s) =>
          s.profitMargin !== null ? `${s.profitMargin.toFixed(1)}%` : "",
        align: "center" as const,
        hideMobile: true,
      },
      {
        key: "profitabilityRating",
        label: t("reports.sites.table.rating"),
        render: (s) => (
          <Badge className={getStatusBadgeClass(ratingTone(s.profitabilityRating))}>
            {RATING_LABEL[s.profitabilityRating]}
          </Badge>
        ),
        sortable: true,
        sortFn: (a, b) =>
          a.profitabilityRating.localeCompare(b.profitabilityRating),
        exportValue: (s) => s.profitabilityRating,
        align: "center" as const,
      },
    ],
    [t, currency, RATING_LABEL],
  );

  return (
    <ReportPageLayout
      title={t("reports.sites.profitability.title")}
      description={t("reports.sites.profitability.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={refetch}
      generatedAt={data?.generatedAt}
      kpiCards={
        summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ReportMetricCard
              label={t("reports.sites.kpi.totalRevenue")}
              value={summary.totalRevenue}
              currency={currency}
              icon={DollarSign}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.sites.kpi.totalCosts")}
              value={summary.totalCosts}
              currency={currency}
              icon={TrendingUp}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.sites.kpi.totalProfit")}
              value={summary.totalProfit}
              currency={currency}
              icon={summary.totalProfit >= 0 ? TrendingDown : TrendingUp}
              variant={summary.totalProfit >= 0 ? "success" : "danger"}
            />
            <ReportMetricCard
              label={t("reports.sites.kpi.avgMargin")}
              value={
                summary.avgProfitMargin !== null
                  ? `${summary.avgProfitMargin.toFixed(1)}%`
                  : "—"
              }
              icon={MapPin}
              variant={
                summary.avgProfitMargin !== null &&
                summary.avgProfitMargin >= 20
                  ? "success"
                  : summary.avgProfitMargin !== null &&
                      summary.avgProfitMargin >= 0
                    ? "info"
                    : "danger"
              }
            />
            <ReportMetricCard
              label={t("reports.sites.kpi.highCount")}
              value={summary.highCount}
              icon={CheckCircle2}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.sites.kpi.lossCount")}
              value={summary.lossCount}
              icon={AlertTriangle}
              variant={summary.lossCount > 0 ? "danger" : "success"}
            />
          </div>
        )
      }
      filters={
        <ReportFilters<LocalFilters>
          filters={localFilters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.sites.searchSite")}
          selectFilters={selectFilters}
        />
      }
    >
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.key}
              className={
                alert.tone === "danger"
                  ? "rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
                  : "rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
              }
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border/70 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t("reports.sites.profitability.description")}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/reports/sites/dashboard">
                {t("reports.sites.overview.title")}
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/reports/sites/performance">
                {t("reports.sites.performance.title")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <DataTable<SiteProfitabilityItem>
        data={paginatedData}
        columns={columns}
        keyExtractor={(s) => s.siteId}
        enableClientSorting
        enableExport
        exportFilename="site_profitability_report"
        exportTitle={t("reports.sites.profitability.title")}
        enableCompactMode
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: filteredData.length,
          pageSize,
        }}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        emptyMessage={t("reports.sites.table.empty")}
      />
    </ReportPageLayout>
  );
};

export default SiteProfitabilityReport;


