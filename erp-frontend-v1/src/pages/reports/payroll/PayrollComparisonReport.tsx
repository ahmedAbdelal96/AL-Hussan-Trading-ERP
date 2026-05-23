import React, { useCallback, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, TrendingDown, TrendingUp, Users } from "lucide-react";

import {
  ReportChartCard,
  ReportFilters,
  ReportMetricCard,
  ReportPageLayout,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import BarChart from "@/components/charts-apex/BarChart";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { usePayrollComparison } from "@/hooks/reports/usePayrollReport";
import type { PayrollReportFilters } from "@/types/reports/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";

interface ComparisonFilters {
  month?: string;
  year?: string;
}

interface VarianceRow {
  id: string;
  metric: string;
  changePercent: number;
  diff: number;
}

const now = new Date();

const PayrollComparisonReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<ComparisonFilters>({
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

  const comparisonFilters = useMemo<PayrollReportFilters>(() => {
    const month = filters.month ? Number(filters.month) : now.getMonth() + 1;
    const year = filters.year ? Number(filters.year) : now.getFullYear();

    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;

    return {
      period1Month: previousMonth,
      period1Year: previousYear,
      period2Month: month,
      period2Year: year,
    };
  }, [filters.month, filters.year]);

  const comparison = usePayrollComparison(comparisonFilters);

  const handleRefresh = useCallback(() => {
    comparison.refetch();
  }, [comparison]);

  const data = comparison.data;
  const variance = data?.variance;

  const chartData = useMemo(() => {
    if (!data) {
      return { categories: [] as string[], series: [] as Array<{ name: string; data: number[] }> };
    }

    return {
      categories: [data.period1.periodLabel, data.period2.periodLabel],
      series: [
        {
          name: t("reports.payroll.comparison.netPayroll"),
          data: [data.period1.netPayroll, data.period2.netPayroll],
        },
        {
          name: t("reports.payroll.comparison.deductions"),
          data: [data.period1.totalDeductions, data.period2.totalDeductions],
        },
      ],
    };
  }, [data, t]);

  const varianceRows = useMemo<VarianceRow[]>(() => {
    if (!variance) {
      return [];
    }

    return [
      {
        id: "net",
        metric: t("reports.payroll.comparison.netPayroll"),
        changePercent: variance.netPayrollChangePercent,
        diff: variance.netPayrollDiff,
      },
      {
        id: "base",
        metric: t("reports.payroll.comparison.baseSalaries"),
        changePercent: variance.baseSalariesChangePercent,
        diff: variance.baseSalariesDiff,
      },
      {
        id: "allowances",
        metric: t("reports.payroll.comparison.allowances"),
        changePercent: variance.allowancesChangePercent,
        diff: variance.allowancesDiff,
      },
      {
        id: "deductions",
        metric: t("reports.payroll.comparison.deductions"),
        changePercent: variance.deductionsChangePercent,
        diff: variance.deductionsDiff,
      },
      {
        id: "employees",
        metric: t("reports.payroll.comparison.employees"),
        changePercent: variance.employeeCountChangePercent,
        diff: variance.employeeCountDiff,
      },
    ];
  }, [variance, t]);

  const columns: ColumnConfig<VarianceRow>[] = useMemo(
    () => [
      {
        key: "metric",
        label: t("reports.payroll.comparison.varianceTitle"),
        render: (row) => <span className="font-medium text-sm">{row.metric}</span>,
      },
      {
        key: "changePercent",
        label: t("reports.payroll.overview.growthRate"),
        render: (row) => {
          const isUp = row.changePercent >= 0;
          return (
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isUp ? "text-success" : "text-danger"}`}>
              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {row.changePercent >= 0 ? "+" : ""}
              {row.changePercent.toFixed(1)}%
            </span>
          );
        },
        sortable: true,
        sortFn: (a, b) => a.changePercent - b.changePercent,
        exportValue: (row) => `${row.changePercent.toFixed(1)}%`,
        align: "end" as const,
      },
      {
        key: "diff",
        label: t("reports.payroll.comparison.netPayrollChange"),
        render: (row) => (
          <span className="font-mono text-sm" dir="ltr">
            {row.diff.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.diff - b.diff,
        exportValue: (row) => row.diff,
        align: "end" as const,
      },
    ],
    [t],
  );

  const growth = variance?.netPayrollChangePercent ?? 0;
  const highRisk = Math.abs(growth) >= 10;

  return (
    <ReportPageLayout
      title={t("reports.payroll.comparison.title")}
      description={t("reports.payroll.comparison.description")}
      borderColor="warning"
      isLoading={comparison.isLoading}
      error={comparison.error || null}
      hasData={!!data}
      onRefresh={handleRefresh}
      generatedAt={data?.generatedAt}
      filters={
        <ReportFilters<ComparisonFilters>
          filters={filters}
          onFilterChange={setFilters}
          selectFilters={selectFilters}
          showReset
        />
      }
      kpiCards={
        variance && (
          <div className="space-y-4">
            {highRisk && (
              <Alert className="border-warning/40 bg-warning/10 text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm font-medium">
                  {t("reports.payroll.comparison.netPayrollChange")}: {growth.toFixed(1)}%
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReportMetricCard
                label={t("reports.payroll.comparison.netPayrollChange")}
                value={variance.netPayrollChangePercent}
                isPercentage
                icon={TrendingUp}
                variant={Math.abs(variance.netPayrollChangePercent) >= 10 ? "danger" : "success"}
              />
              <ReportMetricCard
                label={t("reports.payroll.comparison.employeeCountChange")}
                value={variance.employeeCountChangePercent}
                isPercentage
                icon={Users}
                variant={Math.abs(variance.employeeCountChangePercent) >= 8 ? "warning" : "info"}
              />
              <ReportMetricCard
                label={t("reports.payroll.comparison.employeeChangesTitle")}
                value={data?.employeeChanges?.netChange ?? 0}
                icon={BarChart3}
                variant="default"
              />
            </div>
          </div>
        )
      }
      charts={
        <div className="grid grid-cols-1 gap-6">
          {chartData.categories.length > 0 && (
            <ReportChartCard
              title={t("reports.payroll.comparison.comparisonChart")}
              description={t("reports.payroll.comparison.varianceTitle")}
              icon={BarChart3}
            >
              <BarChart categories={chartData.categories} series={chartData.series} height={320} />
            </ReportChartCard>
          )}
        </div>
      }
    >
      <DataTable<VarianceRow>
        data={varianceRows}
        columns={columns}
        keyExtractor={(row) => row.id}
        enableClientSorting
        enableExport
        exportFilename="payroll-comparison-report"
        exportTitle={t("reports.payroll.comparison.title")}
        enableCompactMode
        emptyMessage={t("reports.payroll.noData")}
      />
    </ReportPageLayout>
  );
};

export default PayrollComparisonReport;
