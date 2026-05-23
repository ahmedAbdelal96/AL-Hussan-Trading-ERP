import React, { useCallback, useMemo, useState } from "react";
import { CURRENCY } from "@/config/system.constants";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  ReportChartCard,
  ReportFilters,
  ReportMetricCard,
  ReportPageLayout,
} from "@/components/reports/shared";
import { ReportSummaryStrip } from "@/components/common/ReportSummaryStrip";
import type { SelectFilterConfig } from "@/components/reports/shared";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import AreaChart from "@/components/charts-apex/AreaChart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  usePayrollDeductionsLoans,
  usePayrollOverview,
  usePayrollSalaryComponents,
  usePayrollTrend,
} from "@/hooks/reports/usePayrollReport";
import type { DeductionTypeBreakdown } from "@/types/reports/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";

interface DashboardFilters {
  month?: string;
  year?: string;
  search?: string;
}

const now = new Date();

export const PayrollDashboardReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<DashboardFilters>({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });

  const selectFilters = useMemo<SelectFilterConfig[]>(() => {
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: t(`reports.payroll.months.${i + 1}`),
    }));

    const yearOptions = Array.from({ length: 5 }, (_, i) => {
      const year = now.getFullYear() - 2 + i;
      return { value: String(year), label: String(year) };
    });

    return [
      {
        key: "month",
        label: t("reports.payroll.overview.month"),
        placeholder: t("reports.payroll.overview.month"),
        options: monthOptions,
        width: "w-[160px]",
      },
      {
        key: "year",
        label: t("reports.payroll.overview.year"),
        placeholder: t("reports.payroll.overview.year"),
        options: yearOptions,
        width: "w-[130px]",
      },
    ];
  }, [t]);

  const apiFilters = useMemo(
    () => ({
      month: filters.month ? Number(filters.month) : undefined,
      year: filters.year ? Number(filters.year) : undefined,
    }),
    [filters.month, filters.year],
  );

  const overview = usePayrollOverview(apiFilters);
  const trend = usePayrollTrend({ periodMonths: 12 });
  const salaryComponents = usePayrollSalaryComponents(apiFilters);
  const deductionsLoans = usePayrollDeductionsLoans(apiFilters);

  const isLoading = overview.isLoading || salaryComponents.isLoading;
  const error =
    overview.error ||
    salaryComponents.error ||
    trend.error ||
    deductionsLoans.error ||
    null;

  const handleRefresh = useCallback(() => {
    overview.refetch();
    trend.refetch();
    salaryComponents.refetch();
    deductionsLoans.refetch();
  }, [overview, trend, salaryComponents, deductionsLoans]);

  const trendData = useMemo(() => {
    const points = trend.data?.data ?? [];
    return {
      categories: points.map((point) => point.monthName),
      series: [
        {
          name: t("reports.payroll.trend.netPayroll"),
          data: points.map((point) => point.netPayroll),
        },
      ],
    };
  }, [trend.data, t]);

  const actionRows = useMemo<DeductionTypeBreakdown[]>(() => {
    const items = salaryComponents.data?.deductionTypes ?? [];
    const query = (filters.search ?? "").trim().toLowerCase();
    const filtered = query
      ? items.filter((item) =>
          item.deductionTypeName.toLowerCase().includes(query),
        )
      : items;

    return [...filtered]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
  }, [salaryComponents.data, filters.search]);

  const columns: ColumnConfig<DeductionTypeBreakdown>[] = useMemo(
    () => [
      {
        key: "deductionTypeName",
        label: t("reports.payroll.salary.deductionType"),
        render: (item) => (
          <span className="font-medium text-sm">{item.deductionTypeName}</span>
        ),
        sortable: true,
        sortFn: (a, b) =>
          a.deductionTypeName.localeCompare(b.deductionTypeName),
        exportValue: (item) => item.deductionTypeName,
      },
      {
        key: "totalAmount",
        label: t("reports.payroll.salary.totalAmount"),
        render: (item) => (
          <span className="font-mono text-sm font-semibold" dir="ltr">
            SAR {item.totalAmount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalAmount - b.totalAmount,
        exportValue: (item) => item.totalAmount,
        align: "end" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.payroll.salary.employees"),
        render: (item) => (
          <span className="tabular-nums">
            {item.employeeCount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.employeeCount - b.employeeCount,
        exportValue: (item) => item.employeeCount,
        align: "end" as const,
      },
      {
        key: "percentageOfTotal",
        label: t("reports.payroll.salary.share"),
        render: (item) => (
          <span className="tabular-nums">
            {item.percentageOfTotal.toFixed(1)}%
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.percentageOfTotal - b.percentageOfTotal,
        exportValue: (item) => `${item.percentageOfTotal.toFixed(1)}%`,
        align: "end" as const,
      },
    ],
    [t],
  );

  const data = overview.data;
  const currency = CURRENCY.DEFAULT;
  const hasAlert = (deductionsLoans.data?.loansSummary.overdueCount ?? 0) > 0;

  return (
    <ReportPageLayout
      title={t("reports.payroll.overview.title")}
      description={t("reports.payroll.overview.description")}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      onRefresh={handleRefresh}
      onPrint={() => window.print()}
      generatedAt={data?.generatedAt}
      summaryStrip={
        data && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.payroll.overview.employees"),
                value: data.employeeCount.toLocaleString("en-US"),
              },
              {
                label: t("reports.payroll.overview.netPayroll"),
                value: `SAR ${data.netPayroll.toLocaleString("en-US")}`,
                valueClassName: "text-emerald-600",
              },
              {
                label: t("reports.payroll.overview.growthRate"),
                value: `${(data.monthGrowthRate ?? 0).toFixed(1)}%`,
                valueClassName:
                  (data.monthGrowthRate ?? 0) > 10
                    ? "text-red-600"
                    : "text-emerald-600",
              },
            ]}
          />
        )
      }
      filters={
        <ReportFilters<DashboardFilters>
          filters={filters}
          onFilterChange={setFilters}
          searchKey="search"
          searchPlaceholder={t("reports.payroll.salary.deductionType")}
          selectFilters={selectFilters}
          showReset
        />
      }
      kpiCards={
        data && (
          <div className="space-y-4">
            {hasAlert && (
              <Alert className="border-warning/40 bg-warning/10 text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {t("reports.payroll.deductionsLoans.overdueLoans")}:{" "}
                    {deductionsLoans.data?.loansSummary.overdueCount ?? 0}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/reports/payroll/details"
                      className="inline-flex items-center gap-1.5"
                    >
                      {t("reports.payroll.deductionsLoans.title")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReportMetricCard
                label={t("reports.payroll.overview.netPayroll")}
                value={data.netPayroll}
                currency={currency}
                icon={DollarSign}
                variant="info"
                trend={data.monthGrowthRate ?? 0}
              />
              <ReportMetricCard
                label={t("reports.payroll.overview.employees")}
                value={data.employeeCount}
                icon={Users}
                variant="default"
              />
              <ReportMetricCard
                label={t("reports.payroll.overview.growthRate")}
                value={data.monthGrowthRate ?? 0}
                icon={TrendingUp}
                isPercentage
                variant={
                  (data.monthGrowthRate ?? 0) > 10
                    ? "danger"
                    : (data.monthGrowthRate ?? 0) > 0
                      ? "warning"
                      : "success"
                }
              />
            </div>
          </div>
        )
      }
      charts={
        <div className="grid grid-cols-1 gap-6">
          {trendData.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.payroll.trend.chartTitle")}
              description={t("reports.payroll.trend.trendChartDesc")}
              icon={TrendingUp}
            >
              <AreaChart
                categories={trendData.categories}
                series={trendData.series}
                height={300}
              />
            </ReportChartCard>
          )}
        </div>
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("reports.payroll.deductionsLoans.deductionTypes")}
        </h3>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link
              to="/reports/payroll/by-department"
              className="inline-flex items-center gap-1.5"
            >
              {t("reports.payroll.byDepartment.title")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              to="/reports/payroll/comparison"
              className="inline-flex items-center gap-1.5"
            >
              {t("reports.payroll.comparison.title")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <DataTable<DeductionTypeBreakdown>
        data={actionRows}
        columns={columns}
        keyExtractor={(item) => item.deductionType}
        enableClientSorting
        enableExport
        exportFilename="payroll-dashboard-action-table"
        exportTitle={t("reports.payroll.overview.title")}
        enableCompactMode
        emptyMessage={t("reports.payroll.noData")}
        isLoading={salaryComponents.isFetching && !salaryComponents.data}
      />
    </ReportPageLayout>
  );
};

export default PayrollDashboardReport;
