import React, { useState, useMemo, useCallback } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";
import { ReportSummaryStrip } from "@/components/common/ReportSummaryStrip";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import AreaChart from "@/components/charts-apex/AreaChart";

import { useFinanceReport } from "@/hooks/reports/useFinanceReport";
import type { CostTypeBreakdownItem } from "@/types/reports/finance.types";

import { useTranslation } from "@/i18n/useTranslation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  search?: string;
}

export const FinanceDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<DashboardFilters>({});

  const paymentStatusOptions = useMemo(
    () => [
      { value: "PENDING", label: t("reports.finance.status.pending") },
      { value: "APPROVED", label: t("reports.finance.status.approved") },
      { value: "PAID", label: t("reports.finance.status.paid") },
      { value: "OVERDUE", label: t("reports.finance.status.overdue") },
      { value: "REJECTED", label: t("reports.finance.status.rejected") },
      {
        value: "PARTIALLY_PAID",
        label: t("reports.finance.status.partiallyPaid"),
      },
    ],
    [t],
  );

  const apiFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      paymentStatus: filters.paymentStatus,
    }),
    [filters.startDate, filters.endDate, filters.paymentStatus],
  );

  const overview = useFinanceReport<"overview">({
    endpoint: "overview",
    filters: apiFilters,
  });

  const byType = useFinanceReport<"by-cost-type">({
    endpoint: "by-cost-type",
    filters: apiFilters,
  });

  const trend = useFinanceReport<"monthly-trend">({
    endpoint: "monthly-trend",
    filters: apiFilters,
  });

  const isLoading = overview.isLoading || byType.isLoading;
  const error = overview.error || byType.error || trend.error || null;

  const handleRefresh = useCallback(() => {
    overview.refetch();
    byType.refetch();
    trend.refetch();
  }, [overview, byType, trend]);

  const selectFilters: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "paymentStatus",
        label: t("reports.finance.filters.paymentStatus"),
        placeholder: t("reports.finance.filters.allStatuses"),
        options: paymentStatusOptions,
        width: "w-[180px]",
      },
    ],
    [t, paymentStatusOptions],
  );

  const dateFilters = useMemo(
    () => [
      { key: "startDate", label: t("reports.finance.filters.dateFrom") },
      { key: "endDate", label: t("reports.finance.filters.dateTo") },
    ],
    [t],
  );

  const trendData = useMemo(() => {
    const points = trend.data?.data;
    if (!points?.length) {
      return {
        categories: [] as string[],
        series: [] as Array<{ name: string; data: number[] }>,
      };
    }

    return {
      categories: points.map((p) => p.monthName),
      series: [
        {
          name: t("reports.finance.kpi.activeCosts"),
          data: points.map((p) => p.totalAmount),
        },
      ],
    };
  }, [trend.data, t]);

  const topCostTypes = useMemo(() => {
    const items = byType.data?.breakdown ?? [];
    const query = (filters.search ?? "").trim().toLowerCase();
    const filtered = query
      ? items.filter((i) => i.costTypeName.toLowerCase().includes(query))
      : items;

    return [...filtered].sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [byType.data, filters.search]);

  const columns: ColumnConfig<CostTypeBreakdownItem>[] = useMemo(
    () => [
      {
        key: "costTypeName",
        label: t("reports.finance.costType"),
        render: (item) => (
          <span className="font-medium text-sm">{item.costTypeName}</span>
        ),
        sortable: true,
        sortFn: (a, b) => a.costTypeName.localeCompare(b.costTypeName),
        exportValue: (item) => item.costTypeName,
      },
      {
        key: "amount",
        label: t("reports.finance.amount"),
        render: (item) => (
          <span className="font-mono text-sm font-semibold" dir="ltr">
            SAR {item.amount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.amount - b.amount,
        exportValue: (item) => item.amount,
        align: "end" as const,
      },
      {
        key: "percentage",
        label: t("reports.finance.table.percentage"),
        render: (item) => (
          <span className="tabular-nums text-sm font-medium">
            {item.percentage.toFixed(1)}%
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.percentage - b.percentage,
        exportValue: (item) => `${item.percentage.toFixed(1)}%`,
        align: "end" as const,
      },
    ],
    [t],
  );

  const handleFilterChange = useCallback((next: DashboardFilters) => {
    setFilters(next);
  }, []);

  const overviewData = overview.data;
  const currency = CURRENCY.DEFAULT;
  const hasOverdueAlert = (overviewData?.overdueAmount ?? 0) > 0;

  return (
    <ReportPageLayout
      title={t("reports.finance.dashboard.title")}
      description={t("reports.finance.dashboard.description")}
      isLoading={isLoading}
      error={error as Error | null}
      hasData={!!overviewData}
      onRefresh={handleRefresh}
      onPrint={() => window.print()}
      splitLayout
      generatedAt={overviewData?.generatedAt}
      summaryStrip={
        overviewData && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.finance.kpi.activeCosts"),
                value: `${currency} ${overviewData.totalCosts.toLocaleString("en-US")}`,
                valueClassName: "text-blue-600",
              },
              {
                label: t("reports.finance.kpi.pendingAmount"),
                value: `${currency} ${overviewData.pendingAmount.toLocaleString("en-US")}`,
                valueClassName:
                  overviewData.pendingAmount > 0 ? "text-amber-600" : undefined,
              },
              {
                label: t("reports.finance.kpi.paidAmount"),
                value: `${currency} ${overviewData.paidAmount.toLocaleString("en-US")}`,
                valueClassName: "text-emerald-600",
              },
              {
                label: t("reports.finance.kpi.overdueAmount"),
                value: `${currency} ${overviewData.overdueAmount.toLocaleString("en-US")}`,
                valueClassName:
                  overviewData.overdueAmount > 0 ? "text-red-600" : undefined,
              },
            ]}
          />
        )
      }
      filters={
        <ReportFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          searchKey="search"
          searchPlaceholder={t("reports.finance.searchPlaceholder")}
          selectFilters={selectFilters}
          dateFilters={dateFilters}
        />
      }
      kpiCards={
        overviewData && (
          <div className="space-y-4">
            {hasOverdueAlert && (
              <Alert className="border-warning/40 bg-warning/10 text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {t("reports.finance.kpi.overdueAmount")}: {currency}{" "}
                    {overviewData.overdueAmount.toLocaleString("en-US")}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/reports/finance/pending-overdue"
                      className="inline-flex items-center gap-1.5"
                    >
                      {t("reports.finance.pendingOverdue.title")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <ReportMetricCard
                label={t("reports.finance.kpi.activeCosts")}
                value={overviewData.totalCosts}
                currency={currency}
                icon={DollarSign}
                variant="info"
                trend={overviewData.monthGrowthRate}
              />

              <ReportMetricCard
                label={t("reports.finance.kpi.pendingAmount")}
                value={overviewData.pendingAmount}
                currency={currency}
                icon={Clock}
                variant="warning"
              />

              <ReportMetricCard
                label={t("reports.finance.kpi.paidAmount")}
                value={overviewData.paidAmount}
                currency={currency}
                icon={TrendingUp}
                variant="success"
              />

              <ReportMetricCard
                label={t("reports.finance.kpi.rejectedArchive")}
                value={overviewData.rejectedAmount}
                currency={currency}
                icon={AlertTriangle}
                variant="danger"
              />
            </div>
          </div>
        )
      }
      charts={
        <div className="grid grid-cols-1 gap-6">
          {trendData.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.finance.monthlyTrend.title")}
              description={t("reports.finance.monthlyTrend.description")}
              icon={TrendingUp}
            >
              <AreaChart
                series={trendData.series}
                categories={trendData.categories}
                height={280}
              />
            </ReportChartCard>
          )}
        </div>
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("reports.finance.byCostType.title")}
        </h3>
        <Button asChild size="sm" variant="outline">
          <Link
            to="/reports/finance/by-project"
            className="inline-flex items-center gap-1.5"
          >
            {t("reports.finance.byProject.title")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <DataTable<CostTypeBreakdownItem>
        data={topCostTypes}
        columns={columns}
        keyExtractor={(item) => item.costType}
        enableClientSorting
        enableExport
        exportFilename="finance_dashboard_report"
        exportTitle={t("reports.finance.dashboard.title")}
        enableCompactMode
        emptyMessage={t("reports.finance.table.empty")}
        isLoading={byType.isFetching && !byType.data}
      />
    </ReportPageLayout>
  );
};

export default FinanceDashboardReport;

