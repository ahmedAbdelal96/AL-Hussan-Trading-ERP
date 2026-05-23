/**
 * ============================================================================
 * PAYROLL BY DEPARTMENT REPORT
 * ============================================================================
 *
 * Consolidates: ByDepartment + BySite
 *
 * Layout:
 *   1. Filters bar  (month/year selectors)
 *   3. Charts       (BarChart: net payroll per dept / site)
 *   4. 2 Tabs       (Department table / Site table)
 *
 * @page PayrollByDepartmentReport
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from "react";
import { Building2, DollarSign, Users, BarChart3 } from "lucide-react";

import {
  ReportPageLayout,
  ReportFilters,
  ReportMetricCard,
  ReportChartCard,
} from "@/components/reports/shared";
import type { SelectFilterConfig } from "@/components/reports/shared";

import { DataTable } from "@/components/common/DataTable";
import type { ColumnConfig } from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import BarChart from "@/components/charts-apex/BarChart";

import {
  usePayrollByDepartment,
  usePayrollBySite,
} from "@/hooks/reports/usePayrollReport";

import type {
  DepartmentPayrollItem,
  SitePayrollItem,
} from "@/types/reports/payroll.types";

import { useTranslation } from "@/i18n/useTranslation";

interface Filters {
  month?: string;
  year?: string;
}

export const PayrollByDepartmentReport: React.FC = () => {
  const { t } = useTranslation();

  const now = new Date();
  const [filters, setFilters] = useState<Filters>({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const MONTH_OPTIONS = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: t(`reports.payroll.months.${i + 1}`),
      })),
    [t],
  );

  const YEAR_OPTIONS = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        value: String(now.getFullYear() - 2 + i),
        label: String(now.getFullYear() - 2 + i),
      })),
    [],
  );

  const SELECT_FILTERS: SelectFilterConfig[] = useMemo(
    () => [
      {
        key: "month",
        label: t("reports.payroll.overview.month"),
        options: MONTH_OPTIONS,
      },
      {
        key: "year",
        label: t("reports.payroll.overview.year"),
        options: YEAR_OPTIONS,
      },
    ],
    [t, MONTH_OPTIONS, YEAR_OPTIONS],
  );

  const apiFilters = useMemo(
    () => ({
      month: filters.month ? Number(filters.month) : undefined,
      year: filters.year ? Number(filters.year) : undefined,
    }),
    [filters],
  );

  const byDept = usePayrollByDepartment(apiFilters);
  const bySite = usePayrollBySite(apiFilters);

  const isLoading = byDept.isLoading || bySite.isLoading;
  const error = byDept.error || bySite.error;
  const hasData = !!(byDept.data || bySite.data);

  const handleRefresh = useCallback(() => {
    byDept.refetch();
    bySite.refetch();
  }, [byDept, bySite]);

  const deptColumns: ColumnConfig<DepartmentPayrollItem>[] = useMemo(
    () => [
      {
        key: "departmentName",
        label: t("reports.payroll.byDepartment.department"),
        sortable: true,
        sortFn: (a, b) => a.departmentName.localeCompare(b.departmentName),
        exportValue: (row) => row.departmentName,
        align: "start" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.payroll.byDepartment.employees"),
        sortable: true,
        sortFn: (a, b) => a.employeeCount - b.employeeCount,
        render: (row) => row.employeeCount.toLocaleString(),
        exportValue: (row) => row.employeeCount,
        align: "end" as const,
      },
      {
        key: "netPayroll",
        label: t("reports.payroll.byDepartment.netPayroll"),
        sortable: true,
        sortFn: (a, b) => a.netPayroll - b.netPayroll,
        render: (row) => row.netPayroll.toLocaleString(),
        exportValue: (row) => row.netPayroll,
        align: "end" as const,
      },
      {
        key: "totalBaseSalaries",
        label: t("reports.payroll.overview.baseSalaries"),
        sortable: true,
        sortFn: (a, b) => a.totalBaseSalaries - b.totalBaseSalaries,
        render: (row) => row.totalBaseSalaries.toLocaleString(),
        exportValue: (row) => row.totalBaseSalaries,
        align: "end" as const,
      },
      {
        key: "totalAllowances",
        label: t("reports.payroll.overview.allowances"),
        sortable: true,
        sortFn: (a, b) => a.totalAllowances - b.totalAllowances,
        render: (row) => row.totalAllowances.toLocaleString(),
        exportValue: (row) => row.totalAllowances,
        align: "end" as const,
      },
      {
        key: "totalDeductions",
        label: t("reports.payroll.overview.deductions"),
        sortable: true,
        sortFn: (a, b) => a.totalDeductions - b.totalDeductions,
        render: (row) => row.totalDeductions.toLocaleString(),
        exportValue: (row) => row.totalDeductions,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "percentageOfTotal",
        label: t("reports.payroll.byDepartment.share"),
        sortable: true,
        sortFn: (a, b) => a.percentageOfTotal - b.percentageOfTotal,
        render: (row) => `${row.percentageOfTotal.toFixed(1)}%`,
        exportValue: (row) => row.percentageOfTotal,
        align: "end" as const,
      },
      {
        key: "avgSalaryPerEmployee",
        label: t("reports.payroll.byDepartment.avgSalary"),
        sortable: true,
        sortFn: (a, b) => a.avgSalaryPerEmployee - b.avgSalaryPerEmployee,
        render: (row) => row.avgSalaryPerEmployee.toLocaleString(),
        exportValue: (row) => row.avgSalaryPerEmployee,
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  const siteColumns: ColumnConfig<SitePayrollItem>[] = useMemo(
    () => [
      {
        key: "siteName",
        label: t("reports.payroll.bySite.site"),
        sortable: true,
        sortFn: (a, b) => a.siteName.localeCompare(b.siteName),
        exportValue: (row) => row.siteName,
        align: "start" as const,
      },
      {
        key: "siteCode",
        label: t("reports.payroll.bySite.code"),
        sortable: true,
        sortFn: (a, b) => a.siteCode.localeCompare(b.siteCode),
        exportValue: (row) => row.siteCode,
        align: "start" as const,
      },
      {
        key: "employeeCount",
        label: t("reports.payroll.bySite.employees"),
        sortable: true,
        sortFn: (a, b) => a.employeeCount - b.employeeCount,
        render: (row) => row.employeeCount.toLocaleString(),
        exportValue: (row) => row.employeeCount,
        align: "end" as const,
      },
      {
        key: "netPayroll",
        label: t("reports.payroll.bySite.netPayroll"),
        sortable: true,
        sortFn: (a, b) => a.netPayroll - b.netPayroll,
        render: (row) => row.netPayroll.toLocaleString(),
        exportValue: (row) => row.netPayroll,
        align: "end" as const,
      },
      {
        key: "totalAllowances",
        label: t("reports.payroll.overview.allowances"),
        sortable: true,
        sortFn: (a, b) => a.totalAllowances - b.totalAllowances,
        render: (row) => row.totalAllowances.toLocaleString(),
        exportValue: (row) => row.totalAllowances,
        align: "end" as const,
      },
      {
        key: "totalDeductions",
        label: t("reports.payroll.overview.deductions"),
        sortable: true,
        sortFn: (a, b) => a.totalDeductions - b.totalDeductions,
        render: (row) => row.totalDeductions.toLocaleString(),
        exportValue: (row) => row.totalDeductions,
        align: "end" as const,
        hideMobile: true,
      },
      {
        key: "percentageOfTotal",
        label: t("reports.payroll.bySite.share"),
        sortable: true,
        sortFn: (a, b) => a.percentageOfTotal - b.percentageOfTotal,
        render: (row) => `${row.percentageOfTotal.toFixed(1)}%`,
        exportValue: (row) => row.percentageOfTotal,
        align: "end" as const,
      },
      {
        key: "avgSalaryPerEmployee",
        label: t("reports.payroll.bySite.avgSalary"),
        sortable: true,
        sortFn: (a, b) => a.avgSalaryPerEmployee - b.avgSalaryPerEmployee,
        render: (row) => row.avgSalaryPerEmployee.toLocaleString(),
        exportValue: (row) => row.avgSalaryPerEmployee,
        align: "end" as const,
        hideMobile: true,
      },
    ],
    [t],
  );

  const deptChartData = useMemo(() => {
    const depts = (byDept.data?.departments || [])
      .slice()
      .sort((a, b) => b.netPayroll - a.netPayroll)
      .slice(0, 15);
    return {
      categories: depts.map((d) => d.departmentName),
      series: [
        {
          name: t("reports.payroll.byDepartment.netPayroll"),
          data: depts.map((d) => d.netPayroll),
        },
      ],
    };
  }, [byDept.data, t]);

  const siteChartData = useMemo(() => {
    const sites = (bySite.data?.sites || [])
      .slice()
      .sort((a, b) => b.netPayroll - a.netPayroll)
      .slice(0, 15);
    return {
      categories: sites.map((s) => s.siteName),
      series: [
        {
          name: t("reports.payroll.bySite.netPayroll"),
          data: sites.map((s) => s.netPayroll),
        },
      ],
    };
  }, [bySite.data, t]);

  return (
    <ReportPageLayout
      title={t("reports.payroll.byDepartment.title")}
      description={t("reports.payroll.byDepartment.description")}
      borderColor="info"
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      onRefresh={handleRefresh}
      generatedAt={byDept.data?.generatedAt}
      filters={
        <ReportFilters<Filters>
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          selectFilters={SELECT_FILTERS}
          showReset
        />
      }
      kpiCards={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportMetricCard
            label={t("reports.payroll.byDepartment.totalPayroll")}
            value={(byDept.data?.totalPayroll ?? 0).toLocaleString()}
            icon={DollarSign}
            variant="default"
          />
          <ReportMetricCard
            label={t("reports.payroll.byDepartment.totalEmployees")}
            value={byDept.data?.totalEmployees ?? 0}
            icon={Users}
            variant="info"
          />
          <ReportMetricCard
            label={t("reports.payroll.byDepartment.deptCount")}
            value={byDept.data?.departments?.length ?? 0}
            icon={Building2}
            variant="success"
          />
          <ReportMetricCard
            label={t("reports.payroll.bySite.siteCount")}
            value={bySite.data?.sites?.length ?? 0}
            icon={BarChart3}
            variant="purple"
          />
        </div>
      }
      charts={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReportChartCard title={t("reports.payroll.byDepartment.chartTitle")}>
            {deptChartData.categories.length > 0 ? (
              <BarChart
                categories={deptChartData.categories}
                series={deptChartData.series}
                height={300}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>

          <ReportChartCard title={t("reports.payroll.bySite.chartTitle")}>
            {siteChartData.categories.length > 0 ? (
              <BarChart
                categories={siteChartData.categories}
                series={siteChartData.series}
                height={300}
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("reports.common.noData")}
              </p>
            )}
          </ReportChartCard>
        </div>
      }
    >
      <Tabs defaultValue="byDepartment" className="w-full">
        <TabsList>
          <TabsTrigger value="byDepartment">
            <Building2 className="h-4 w-4 me-1" />
            {t("reports.payroll.byDepartment.tab")}
          </TabsTrigger>
          <TabsTrigger value="bySite">
            <BarChart3 className="h-4 w-4 me-1" />
            {t("reports.payroll.bySite.tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="byDepartment">
          <DataTable<DepartmentPayrollItem>
            data={byDept.data?.departments || []}
            columns={deptColumns}
            keyExtractor={(item) => item.departmentId}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              totalItems: byDept.data?.departments?.length || 0,
              totalPages: Math.ceil(
                (byDept.data?.departments?.length || 0) / pageSize,
              ),
            }}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            isLoading={byDept.isLoading}
            enableExport
            exportFilename="payroll-by-department"
          />
        </TabsContent>

        <TabsContent value="bySite">
          <DataTable<SitePayrollItem>
            data={bySite.data?.sites || []}
            columns={siteColumns}
            keyExtractor={(item) => item.siteId}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              totalItems: bySite.data?.sites?.length || 0,
              totalPages: Math.ceil(
                (bySite.data?.sites?.length || 0) / pageSize,
              ),
            }}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            isLoading={bySite.isLoading}
            enableExport
            exportFilename="payroll-by-site"
          />
        </TabsContent>
      </Tabs>
    </ReportPageLayout>
  );
};

export default PayrollByDepartmentReport;
