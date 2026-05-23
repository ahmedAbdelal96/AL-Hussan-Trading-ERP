import React, { useCallback, useMemo, useState } from "react";
import { CURRENCY } from "@/config/system.constants";
import { Calculator, Percent, Receipt, ShieldCheck } from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
} from "@/components/reports/shared";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { ReportSummaryStrip } from "@/components/common/ReportSummaryStrip";
import AreaChart from "@/components/charts-apex/AreaChart";

import { useFinanceReport } from "@/hooks/reports/useFinanceReport";
import type { TaxMonthlyBreakdownItem } from "@/types/reports/finance.types";
import { useTranslation } from "@/i18n/useTranslation";

interface TaxFilters {
  startDate?: string;
  endDate?: string;
}

export const FinanceTaxReport: React.FC = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<TaxFilters>({});

  const apiFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    [filters.startDate, filters.endDate],
  );

  const { data, isLoading, isFetching, error, refetch } =
    useFinanceReport<"tax-summary">({
      endpoint: "tax-summary",
      filters: apiFilters,
    });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const dateFilters = useMemo(
    () => [
      { key: "startDate", label: t("reports.finance.filters.dateFrom") },
      { key: "endDate", label: t("reports.finance.filters.dateTo") },
    ],
    [t],
  );

  const chartData = useMemo(() => {
    const rows = data?.monthlyBreakdown ?? [];
    return {
      categories: rows.map((r) => r.monthName),
      series: [
        {
          name: t("reports.finance.tax.kpi.taxAmount"),
          data: rows.map((r) => r.taxAmount),
        },
        {
          name: t("reports.finance.tax.kpi.beforeTax"),
          data: rows.map((r) => r.amountBeforeTax),
        },
      ],
    };
  }, [data, t]);

  const columns: ColumnConfig<TaxMonthlyBreakdownItem>[] = useMemo(
    () => [
      {
        key: "monthName",
        label: t("reports.finance.tax.table.month"),
        render: (row) => <span className="font-medium text-sm">{row.monthName}</span>,
        sortable: true,
        sortFn: (a, b) => a.month.localeCompare(b.month),
        exportValue: (row) => row.monthName,
      },
      {
        key: "amountBeforeTax",
        label: t("reports.finance.tax.table.beforeTax"),
        render: (row) => (
          <span className="font-mono text-sm" dir="ltr">
            {CURRENCY.DEFAULT} {row.amountBeforeTax.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.amountBeforeTax - b.amountBeforeTax,
        exportValue: (row) => row.amountBeforeTax,
        align: "end" as const,
      },
      {
        key: "taxAmount",
        label: t("reports.finance.tax.table.taxAmount"),
        render: (row) => (
          <span className="font-mono text-sm font-semibold text-amber-600" dir="ltr">
            {CURRENCY.DEFAULT} {row.taxAmount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.taxAmount - b.taxAmount,
        exportValue: (row) => row.taxAmount,
        align: "end" as const,
      },
      {
        key: "totalAmount",
        label: t("reports.finance.tax.table.withTax"),
        render: (row) => (
          <span className="font-mono text-sm font-semibold" dir="ltr">
            {CURRENCY.DEFAULT} {row.totalAmount.toLocaleString("en-US")}
          </span>
        ),
        sortable: true,
        sortFn: (a, b) => a.totalAmount - b.totalAmount,
        exportValue: (row) => row.totalAmount,
        align: "end" as const,
      },
      {
        key: "taxedCount",
        label: t("reports.finance.tax.table.taxedCount"),
        render: (row) => <span className="tabular-nums text-sm">{row.taxedCount}</span>,
        sortable: true,
        sortFn: (a, b) => a.taxedCount - b.taxedCount,
        exportValue: (row) => row.taxedCount,
        align: "end" as const,
      },
    ],
    [t],
  );

  return (
    <ReportPageLayout
      title={t("reports.finance.tax.title")}
      description={t("reports.finance.tax.description")}
      borderColor="warning"
      isLoading={isLoading}
      error={error as Error | null}
      hasData={!!data}
      onRefresh={handleRefresh}
      generatedAt={data?.generatedAt}
      summaryStrip={
        data && (
          <ReportSummaryStrip
            metrics={[
              {
                label: t("reports.finance.tax.kpi.beforeTax"),
                value: `${CURRENCY.DEFAULT} ${data.totalAmountBeforeTax.toLocaleString("en-US")}`,
              },
              {
                label: t("reports.finance.tax.kpi.taxAmount"),
                value: `${CURRENCY.DEFAULT} ${data.totalTaxAmount.toLocaleString("en-US")}`,
                valueClassName: data.totalTaxAmount > 0 ? "text-amber-600" : undefined,
              },
              {
                label: t("reports.finance.tax.kpi.withTax"),
                value: `${CURRENCY.DEFAULT} ${data.totalAmountWithTax.toLocaleString("en-US")}`,
                valueClassName: "text-blue-600",
              },
              {
                label: t("reports.finance.tax.kpi.effectiveRate"),
                value: `${data.effectiveTaxRate.toFixed(2)}%`,
              },
            ]}
          />
        )
      }
      filters={
        <ReportFilters
          filters={filters}
          onFilterChange={setFilters}
          dateFilters={dateFilters}
        />
      }
      kpiCards={
        data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.finance.tax.kpi.beforeTax")}
              value={data.totalAmountBeforeTax}
              currency={CURRENCY.DEFAULT}
              icon={Receipt}
              variant="info"
            />
            <ReportMetricCard
              label={t("reports.finance.tax.kpi.taxAmount")}
              value={data.totalTaxAmount}
              currency={CURRENCY.DEFAULT}
              icon={Calculator}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.finance.tax.kpi.effectiveRate")}
              value={data.effectiveTaxRate}
              isPercentage
              icon={Percent}
              variant="purple"
            />
            <ReportMetricCard
              label={t("reports.finance.tax.kpi.taxedEntries")}
              value={data.taxedEntriesCount}
              icon={ShieldCheck}
              variant="success"
            />
          </div>
        )
      }
      charts={
        chartData.categories.length > 0 ? (
          <AreaChart
            series={chartData.series}
            categories={chartData.categories}
            height={280}
          />
        ) : null
      }
    >
      <DataTable<TaxMonthlyBreakdownItem>
        data={data?.monthlyBreakdown ?? []}
        columns={columns}
        keyExtractor={(row) => row.month}
        enableClientSorting
        enableExport
        exportFilename="finance_tax_report"
        exportTitle={t("reports.finance.tax.title")}
        enableCompactMode
        emptyMessage={t("reports.finance.table.empty")}
        isLoading={isFetching && !data}
      />
    </ReportPageLayout>
  );
};

export default FinanceTaxReport;
