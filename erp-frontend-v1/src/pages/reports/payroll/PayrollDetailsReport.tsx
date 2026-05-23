import React, { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  ReportChartCard,
  ReportFilters,
  ReportMetricCard,
  ReportPageLayout,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import DonutChart from "@/components/charts-apex/DonutChart";
import BarChart from "@/components/charts-apex/BarChart";

import {
  usePayrollAllowances,
  usePayrollDeductionsLoans,
} from "@/hooks/reports/usePayrollReport";
import type {
  AllowanceSummaryItem,
  DeductionSummaryItem,
  LoansByStatus,
  PayrollReportFilters,
} from "@/types/reports/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";

interface DetailsFilters {
  month?: string;
  year?: string;
}

const now = new Date();

const fmt = (value: number | undefined | null): string => {
  if (value == null || Number.isNaN(value)) return "-";
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

const PayrollDetailsReport: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<DetailsFilters>({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });

  const [allowancePage, setAllowancePage] = useState(1);
  const [allowancePageSize, setAllowancePageSize] = useState(20);
  const [deductionPage, setDeductionPage] = useState(1);
  const [deductionPageSize, setDeductionPageSize] = useState(20);

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

  const apiFilters = useMemo<PayrollReportFilters>(
    () => ({
      month: filters.month ? Number(filters.month) : undefined,
      year: filters.year ? Number(filters.year) : undefined,
    }),
    [filters.month, filters.year],
  );

  const allowances = usePayrollAllowances(apiFilters);
  const deductions = usePayrollDeductionsLoans(apiFilters);

  const isLoading = allowances.isLoading || deductions.isLoading;
  const error = allowances.error || deductions.error || null;
  const hasData = Boolean(allowances.data || deductions.data);

  const handleRefresh = useCallback(() => {
    allowances.refetch();
    deductions.refetch();
  }, [allowances, deductions]);

  const allowanceTypeCols = useMemo<ColumnConfig<AllowanceSummaryItem>[]>(
    () => [
      {
        key: "allowanceTypeName",
        label: t("reports.payroll.allowances.type"),
        sortable: true,
        sortFn: (a, b) => a.allowanceTypeName.localeCompare(b.allowanceTypeName),
      },
      {
        key: "totalMonthlyAmount",
        label: t("reports.payroll.allowances.monthlyAmount"),
        render: (r) => <span className="font-mono">{fmt(r.totalMonthlyAmount)}</span>,
        sortable: true,
        sortFn: (a, b) => a.totalMonthlyAmount - b.totalMonthlyAmount,
        align: "end" as const,
      },
      {
        key: "activeCount",
        label: t("reports.payroll.allowances.active"),
        render: (r) => fmt(r.activeCount),
        sortable: true,
        sortFn: (a, b) => a.activeCount - b.activeCount,
        align: "end" as const,
      },
      {
        key: "pendingCount",
        label: t("reports.payroll.allowances.pending"),
        render: (r) => fmt(r.pendingCount),
        sortable: true,
        sortFn: (a, b) => a.pendingCount - b.pendingCount,
        align: "end" as const,
      },
      {
        key: "percentageOfTotal",
        label: t("reports.payroll.allowances.share"),
        render: (r) => `${r.percentageOfTotal.toFixed(1)}%`,
        sortable: true,
        sortFn: (a, b) => a.percentageOfTotal - b.percentageOfTotal,
        align: "end" as const,
      },
    ],
    [t],
  );

  const loanStatusCols = useMemo<ColumnConfig<LoansByStatus>[]>(
    () => [
      {
        key: "statusName",
        label: t("reports.payroll.deductionsLoans.status"),
        sortable: true,
        sortFn: (a, b) => a.statusName.localeCompare(b.statusName),
      },
      {
        key: "count",
        label: t("reports.payroll.deductionsLoans.count"),
        render: (r) => fmt(r.count),
        sortable: true,
        sortFn: (a, b) => a.count - b.count,
        align: "end" as const,
      },
      {
        key: "totalAmount",
        label: t("reports.payroll.deductionsLoans.totalAmount"),
        render: (r) => <span className="font-mono">{fmt(r.totalAmount)}</span>,
        sortable: true,
        sortFn: (a, b) => a.totalAmount - b.totalAmount,
        align: "end" as const,
      },
      {
        key: "totalRemaining",
        label: t("reports.payroll.deductionsLoans.totalRemaining"),
        render: (r) => <span className="font-mono">{fmt(r.totalRemaining)}</span>,
        sortable: true,
        sortFn: (a, b) => a.totalRemaining - b.totalRemaining,
        align: "end" as const,
      },
    ],
    [t],
  );

  const deductionTypeCols = useMemo<ColumnConfig<DeductionSummaryItem>[]>(
    () => [
      {
        key: "deductionTypeName",
        label: t("reports.payroll.deductionsLoans.deductionType"),
        sortable: true,
        sortFn: (a, b) => a.deductionTypeName.localeCompare(b.deductionTypeName),
      },
      {
        key: "totalAmount",
        label: t("reports.payroll.deductionsLoans.totalAmount"),
        render: (r) => <span className="font-mono">{fmt(r.totalAmount)}</span>,
        sortable: true,
        sortFn: (a, b) => a.totalAmount - b.totalAmount,
        align: "end" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.payroll.deductionsLoans.employees"),
        render: (r) => fmt(r.employeeCount),
        sortable: true,
        sortFn: (a, b) => a.employeeCount - b.employeeCount,
        align: "end" as const,
      },
      {
        key: "percentageOfTotal",
        label: t("reports.payroll.deductionsLoans.share"),
        render: (r) => `${r.percentageOfTotal.toFixed(1)}%`,
        sortable: true,
        sortFn: (a, b) => a.percentageOfTotal - b.percentageOfTotal,
        align: "end" as const,
      },
    ],
    [t],
  );

  const allowanceDonut = useMemo(() => {
    const items = allowances.data?.byAllowanceType ?? [];
    return {
      labels: items.map((i) => i.allowanceTypeName),
      series: items.map((i) => i.totalMonthlyAmount),
    };
  }, [allowances.data]);

  const frequencyBar = useMemo(() => {
    const items = allowances.data?.byFrequency ?? [];
    return {
      categories: items.map((i) => i.frequency),
      series: [
        {
          name: t("reports.payroll.deductionsLoans.totalAmount"),
          data: items.map((i) => i.totalAmount),
        },
      ],
    };
  }, [allowances.data, t]);

  const loanDonut = useMemo(() => {
    const items = deductions.data?.loansByStatus ?? [];
    return {
      labels: items.map((i) => i.statusName),
      series: items.map((i) => i.totalAmount),
    };
  }, [deductions.data]);

  const allowanceRows = useMemo(() => {
    const items = allowances.data?.byAllowanceType ?? [];
    const start = (allowancePage - 1) * allowancePageSize;
    return items.slice(start, start + allowancePageSize);
  }, [allowances.data, allowancePage, allowancePageSize]);

  const deductionRows = useMemo(() => {
    const items = deductions.data?.deductionsByType ?? [];
    const start = (deductionPage - 1) * deductionPageSize;
    return items.slice(start, start + deductionPageSize);
  }, [deductions.data, deductionPage, deductionPageSize]);

  return (
    <ReportPageLayout
      title={t("reports.payroll.details.title")}
      description={t("reports.payroll.details.description")}
      borderColor="warning"
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      generatedAt={allowances.data?.generatedAt ?? deductions.data?.generatedAt}
      filters={
        <ReportFilters<DetailsFilters>
          filters={filters}
          onFilterChange={(next) => {
            setFilters(next);
            setAllowancePage(1);
            setDeductionPage(1);
          }}
          selectFilters={selectFilters}
          showReset
        />
      }
    >
      <Alert className="mb-4 border-info/40 bg-info/10 text-foreground">
        <AlertTriangle className="h-4 w-4 text-info" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
          <span>{t("reports.payroll.comparison.description")}</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/reports/payroll/comparison" className="inline-flex items-center gap-1.5">
              {t("reports.payroll.comparison.title")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="allowances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allowances" className="gap-1.5">
            <Award className="h-4 w-4" />
            {t("reports.payroll.allowances.title")}
          </TabsTrigger>
          <TabsTrigger value="deductions" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            {t("reports.payroll.deductionsLoans.title")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allowances" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.payroll.allowances.totalAmount")}
              value={fmt(allowances.data?.totalAmount)}
              icon={DollarSign}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.payroll.allowances.totalActive")}
              value={fmt(allowances.data?.totalActive)}
              icon={CheckCircle2}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.payroll.allowances.totalInactive")}
              value={fmt(allowances.data?.totalInactive)}
              icon={Clock}
              variant="warning"
            />
            <ReportMetricCard
              label={t("reports.payroll.allowances.totalPending")}
              value={fmt(allowances.data?.totalPending)}
              icon={AlertTriangle}
              variant="info"
            />
          </div>

          {allowanceDonut.labels.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ReportChartCard title={t("reports.payroll.allowances.byTypeChart")}>
                <DonutChart labels={allowanceDonut.labels} series={allowanceDonut.series} height={320} />
              </ReportChartCard>
              <ReportChartCard title={t("reports.payroll.allowances.byFrequencyChart")}>
                <BarChart categories={frequencyBar.categories} series={frequencyBar.series} height={320} />
              </ReportChartCard>
            </div>
          )}

          <DataTable<AllowanceSummaryItem>
            data={allowanceRows}
            columns={allowanceTypeCols}
            keyExtractor={(r) => r.allowanceTypeName}
            enableClientSorting
            enableExport
            exportFilename="payroll-allowances"
            exportTitle={t("reports.payroll.allowances.title")}
            pagination={{
              currentPage: allowancePage,
              pageSize: allowancePageSize,
              totalItems: allowances.data?.byAllowanceType.length ?? 0,
              totalPages: Math.ceil((allowances.data?.byAllowanceType.length ?? 0) / allowancePageSize),
            }}
            onPageChange={setAllowancePage}
            onPageSizeChange={setAllowancePageSize}
            emptyMessage={t("reports.payroll.noData")}
          />
        </TabsContent>

        <TabsContent value="deductions" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMetricCard
              label={t("reports.payroll.deductionsLoans.totalOutstanding")}
              value={fmt(deductions.data?.loansSummary.totalOutstanding)}
              icon={DollarSign}
              variant="danger"
            />
            <ReportMetricCard
              label={t("reports.payroll.deductionsLoans.paidThisMonth")}
              value={fmt(deductions.data?.loansSummary.totalPaidThisMonth)}
              icon={CheckCircle2}
              variant="success"
            />
            <ReportMetricCard
              label={t("reports.payroll.deductionsLoans.activeLoans")}
              value={fmt(deductions.data?.loansSummary.activeLoanCount)}
              icon={CreditCard}
              variant="default"
            />
            <ReportMetricCard
              label={t("reports.payroll.deductionsLoans.overdueLoans")}
              value={fmt(deductions.data?.loansSummary.overdueCount)}
              icon={AlertTriangle}
              variant="warning"
            />
          </div>

          {loanDonut.labels.length > 0 && (
            <ReportChartCard title={t("reports.payroll.deductionsLoans.loansByStatusChart")}>
              <DonutChart labels={loanDonut.labels} series={loanDonut.series} height={320} />
            </ReportChartCard>
          )}

          <DataTable<LoansByStatus>
            data={deductions.data?.loansByStatus ?? []}
            columns={loanStatusCols}
            keyExtractor={(r) => r.statusName}
            enableClientSorting
            enableExport
            exportFilename="payroll-loans-by-status"
            exportTitle={t("reports.payroll.deductionsLoans.loansSectionTitle")}
            emptyMessage={t("reports.payroll.noData")}
          />

          <DataTable<DeductionSummaryItem>
            data={deductionRows}
            columns={deductionTypeCols}
            keyExtractor={(r) => r.deductionTypeName}
            enableClientSorting
            enableExport
            exportFilename="payroll-deductions"
            exportTitle={t("reports.payroll.deductionsLoans.deductionsSectionTitle")}
            pagination={{
              currentPage: deductionPage,
              pageSize: deductionPageSize,
              totalItems: deductions.data?.deductionsByType.length ?? 0,
              totalPages: Math.ceil((deductions.data?.deductionsByType.length ?? 0) / deductionPageSize),
            }}
            onPageChange={setDeductionPage}
            onPageSizeChange={setDeductionPageSize}
            emptyMessage={t("reports.payroll.noData")}
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default PayrollDetailsReport;
