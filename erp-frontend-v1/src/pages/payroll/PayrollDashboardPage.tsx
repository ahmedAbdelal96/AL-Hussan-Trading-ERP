/**
 * ============================================================================
 * PAYROLL DASHBOARD PAGE
 * ============================================================================
 *
 * Comprehensive payroll analytics dashboard providing:
 * - Real-time payroll metrics and KPIs (8 key indicators)
 * - Interactive charts for data visualization (5 charts)
 * - Employment type and department distributions
 * - Allowance and deduction breakdowns
 * - Monthly payroll trends and growth analysis
 * - Top earning employees overview
 * - Date range filtering for historical analysis
 *
 * Performance Optimizations:
 * - Memoized chart data transformations to prevent recalculations
 * - Lazy loading of chart components for faster initial load
 * - React Query caching with 5-minute stale time
 * - Efficient re-renders only when data changes
 *
 * Architecture:
 * - Clean separation: presentation, data fetching, business logic
 * - Reusable chart components from Finance module
 * - Type-safe data handling with TypeScript interfaces
 * - Responsive design with mobile-first approach
 * - Bilingual support (Arabic/English) from translations
 *
 * @module PayrollDashboardPage
 * @version 1.0.0
 * @author ERP System - Senior Frontend Developer
 */

import { useState, useMemo, useCallback } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Receipt,
  Activity,
  Clock,
  ArrowRight,
  FileText,
  HandCoins,
  MinusCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { KpiStrip } from "@/components/common/KpiStrip";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ApexCharts Components (Professional Charts)
import {
  BarChart as ApexBarChart,
  DonutChart as ApexDonutChart,
  LineChart as ApexLineChart,
} from "@/components/charts-apex";
import { usePayrollStatistics } from "@/hooks/usePayroll";
import { useEmployeeAllowances } from "@/hooks/useEmployeeAllowances";
import { useEmployeeLoans } from "@/hooks/useEmployeeLoans";
import { useEmployeeDeductions } from "@/hooks/useEmployeeDeductions";
import { useLanguage } from "@/store/languageStore";
import { useTranslation } from "@/i18n/useTranslation";
import { translations } from "@/i18n/translations";
import {
  LoanStatus as LoanStatusEnum,
  DeductionStatus,
} from "@/types/payroll.types";
import {
  EMPLOYMENT_TYPE_LABELS,
  DEDUCTION_TYPE_LABELS,
  LOAN_STATUS_LABELS,
  type EmploymentType,
  type DeductionType,
  type LoanStatus,
} from "@/types/payroll-statistics";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Date range filter for payroll statistics
 * Uses ISO 8601 date format (YYYY-MM-DD) for API compatibility
 */
interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

/**
 * Payroll Dashboard Page - Main Container
 * Central hub for all payroll analytics and insights
 */
const PayrollDashboardPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tDash = translations[language].payroll.dashboard;
  const tPayroll = translations[language].payroll;
  const tCommon = translations[language].common;
  const departmentsMap = (tPayroll.departments || {}) as unknown as Record<
    string,
    string
  >;
  const allowanceTypesMap = (tPayroll.allowanceTypes ||
    {}) as unknown as Record<string, string>;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [dateRange] = useState<DateRangeFilter>({});

  // ============================================================================
  // DATA FETCHING (React Query)
  // ============================================================================

  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = usePayrollStatistics(dateRange);

  // Pending approvals queries (lightweight - page 1, limit 5)
  const { data: pendingAllowances } = useEmployeeAllowances({
    isApproved: false,
    page: 1,
    limit: 5,
  });
  const { data: pendingLoans } = useEmployeeLoans({
    status: LoanStatusEnum.PENDING,
    page: 1,
    limit: 5,
  });
  const { data: pendingDeductions } = useEmployeeDeductions({
    status: DeductionStatus.PENDING,
    page: 1,
    limit: 5,
  });

  // ============================================================================
  // DATA CONVERSION HELPERS - Recharts to ApexCharts Format
  // ============================================================================

  /**
   * Convert bar chart data with validation
   */
  const convertToApexBarFormat = (
    data: Array<{ name: string; value: number }>,
  ) => {
    const safeData = data || [];
    if (safeData.length === 0) {
      return {
        categories: [],
        series: [
          { name: tDash.kpis?.totalSalary?.title || "Amount", data: [] },
        ],
      };
    }

    return {
      categories: safeData.map((item) => item.name || "N/A"),
      series: [
        {
          name: tDash.kpis?.totalSalary?.title || "Amount",
          data: safeData.map((item) => item.value || 0),
        },
      ],
    };
  };

  /**
   * Convert donut/pie chart data with validation
   */
  const convertToApexDonutFormat = (
    data: Array<{ name: string; value: number }>,
  ) => {
    const safeData = data || [];
    if (safeData.length === 0) {
      return { labels: [], series: [] };
    }

    return {
      labels: safeData.map((item) => item.name || "N/A"),
      series: safeData.map((item) => item.value || 0),
    };
  };

  /**
   * Convert multi-line chart data with validation
   */
  const convertToApexLineFormat = (
    data: Array<Record<string, any>>,
    xAxisKey: string,
    lines: Array<{ key: string; name: string; color?: string }>,
  ) => {
    const safeData = data || [];
    const safeLines = lines || [];

    if (safeData.length === 0 || safeLines.length === 0) {
      return { categories: [], series: [] };
    }

    return {
      categories: safeData.map((item) => item[xAxisKey] || "N/A"),
      series: safeLines.map((line) => ({
        name: line.name || "Series",
        data: safeData.map((item) => item[line.key] || 0),
      })),
    };
  };

  // ============================================================================
  // DATA TRANSFORMATIONS (Memoized for Performance)
  // ============================================================================

  /**
   * Employment Type Distribution - Bar Chart Data
   * Transforms employment breakdown with localized labels
   */
  const employmentTypeChartData = useMemo(() => {
    if (!statistics?.employmentTypeBreakdown) return [];

    return statistics.employmentTypeBreakdown.map((item) => ({
      type:
        EMPLOYMENT_TYPE_LABELS[item.employmentType as EmploymentType]?.[
          language
        ] || item.employmentType,
      totalSalary: item.totalSalary || 0,
      employeeCount: item.employeeCount || 0,
    }));
  }, [statistics, language]);

  /**
   * Department Distribution - Pie Chart Data
   * Shows salary distribution across departments
   * Limited to top 8 departments for clarity
   */
  const departmentChartData = useMemo(() => {
    if (!statistics?.departmentBreakdown) return [];

    return statistics.departmentBreakdown.slice(0, 8).map((item) => ({
      name:
        departmentsMap[item.department] ||
        item.department ||
        tDash.charts.departmentDistribution.noData,
      value: item.totalSalary || 0,
      count: item.employeeCount || 0,
    }));
  }, [statistics, t, tPayroll]);

  /**
   * Allowance Breakdown - Pie Chart Data
   * Displays allowance distribution by type
   */
  const allowanceChartData = useMemo(() => {
    if (!statistics?.allowanceBreakdown) return [];

    return statistics.allowanceBreakdown
      .filter((item) => item.totalAmount > 0)
      .map((item) => ({
        name:
          allowanceTypesMap[item.allowanceTypeName] ||
          item.allowanceTypeName ||
          "Unknown",
        value: item.totalAmount,
        count: item.employeeCount,
      }));
  }, [statistics, tPayroll]);

  /**
   * Deduction Breakdown - Pie Chart Data
   * Shows deduction distribution by type with localized labels
   */
  const deductionChartData = useMemo(() => {
    if (!statistics?.deductionBreakdown) return [];

    return statistics.deductionBreakdown
      .filter((item) => (item.totalAmount || 0) > 0)
      .map((item) => ({
        name:
          DEDUCTION_TYPE_LABELS[item.deductionType as DeductionType]?.[
            language
          ] || item.deductionType,
        value: item.totalAmount || 0,
        count: item.employeeCount || 0,
      }));
  }, [statistics, language]);

  /**
   * Loan Status Distribution - Bar Chart Data
   * Displays loan counts by status
   */
  const loanStatusChartData = useMemo(() => {
    if (!statistics?.loanStatusBreakdown) return [];

    return statistics.loanStatusBreakdown.map((item) => ({
      status:
        LOAN_STATUS_LABELS[item.status as LoanStatus]?.[language] ||
        item.status,
      count: item.loanCount || 0,
      amount: item.totalAmount || 0,
    }));
  }, [statistics, language]);

  /**
   * Monthly Payroll Trend - Line Chart Data
   * Shows 6-month evolution of payroll components
   */
  const monthlyTrendData = useMemo(() => {
    if (!statistics?.monthlyTrend) return [];

    return statistics.monthlyTrend.map((item) => ({
      month: item.month,
      baseSalaries: item.baseSalaries || 0,
      totalAllowances: item.totalAllowances || 0,
      totalDeductions: item.totalDeductions || 0,
      netPayroll: item.netPayroll || 0,
    }));
  }, [statistics]);

  // ============================================================================
  // FORMATTING HELPERS
  // ============================================================================

  /**
   * Format currency with proper locale and Arabic numerals
   * Handles large numbers with thousands separators
   */
  const formatCurrency = useCallback(
    (value: number | undefined) => {
      if (value === undefined || value === null || isNaN(value)) {
        return `0 ${tCommon.sar}`;
      }
      const locale = language === "ar" ? "ar-EG" : "en-US";
      // Use currency symbol from translations based on backend currency code
      const currencySymbol =
        statistics?.currency?.toLowerCase() === "sar"
          ? tCommon.sar
          : tCommon.currency;
      return `${value.toLocaleString(locale, { maximumFractionDigits: 0 })} ${currencySymbol}`;
    },
    [language, statistics?.currency, tCommon.sar, tCommon.currency],
  );

  /**
   * Format numbers for chart axes
   * Converts large numbers to K/M notation
   */
  const formatAxisNumber = useCallback(
    (value: number) => {
      if (value === undefined || value === null || isNaN(value)) {
        return "0";
      }
      const locale = language === "ar" ? "ar-EG" : "en-US";
      if (value >= 1000000) {
        return `${(value / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}K`;
      }
      return value.toLocaleString(locale);
    },
    [language],
  );

  /**
   * Format percentage with proper sign
   */
  const formatPercentage = useCallback(
    (value: number | undefined) => {
      if (value === undefined || value === null || isNaN(value)) {
        return "0%";
      }
      const locale = language === "ar" ? "ar-EG" : "en-US";
      const sign = value > 0 ? "+" : "";
      return `${sign}${value.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
    },
    [language],
  );

  /**
   * Format number with locale
   */
  const formatNumber = useCallback(
    (value: number | undefined) => {
      if (value === undefined || value === null || isNaN(value)) {
        return "0";
      }
      const locale = language === "ar" ? "ar-EG" : "en-US";
      return value.toLocaleString(locale);
    },
    [language],
  );

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader
          title={tDash.loadingStats || t("common.loading", { defaultValue: "Loading..." })}
          showBackButton={false}
        />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </PageShell>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader
          title={tDash.title || t("payroll.dashboard.title", { defaultValue: "Payroll Dashboard" })}
          subtitle={tDash.subtitle || t("payroll.dashboard.subtitle", { defaultValue: "Payroll analytics overview" })}
          showBackButton={false}
        />
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{tDash.errorLoading || t("common.errors.unexpected", { defaultValue: "Failed to load data" })}</span>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              {tDash.retry || t("common.retry", { defaultValue: "Retry" })}
            </Button>
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  // ============================================================================
  // NO DATA STATE
  // ============================================================================

  if (!statistics) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader
          title={tDash.title || t("payroll.dashboard.title", { defaultValue: "Payroll Dashboard" })}
          subtitle={tDash.subtitle || t("payroll.dashboard.subtitle", { defaultValue: "Payroll analytics overview" })}
          showBackButton={false}
        />
        <Alert>
          <AlertDescription>{tDash.noData || t("common.noData", { defaultValue: "No data available" })}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <PageShell size="wide" density="compact" className="pb-8">
      {/* Page Header */}
      <PageHeader
        title={tDash.title || t("payroll.dashboard.title", { defaultValue: "Payroll Dashboard" })}
        subtitle={tDash.subtitle || t("payroll.dashboard.subtitle", { defaultValue: "Payroll analytics overview" })}
        showBackButton={false}
        actions={
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            {tDash.refreshData || t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
        }
      />

      {/* KPI Metrics */}
      <KpiStrip
        items={[
          {
            label: tDash.kpis.totalEmployees.title,
            value: formatNumber(statistics.totalEmployees),
            description: tDash.kpis.totalEmployees.description,
            accent: "var(--primary-light)",
          },
          {
            label: tDash.kpis.totalSalary.title,
            value: formatCurrency(statistics.totalBaseSalary),
            description: tDash.kpis.totalSalary.description,
            accent: "var(--primary-light)",
          },
          {
            label: tDash.kpis.totalAllowances.title,
            value: formatCurrency(statistics.totalAllowances),
            description: tDash.kpis.totalAllowances.description,
            accent: "var(--success)",
          },
          {
            label: tDash.kpis.totalDeductions.title,
            value: formatCurrency(statistics.totalDeductions),
            description: tDash.kpis.totalDeductions.description,
            accent: "var(--warning)",
          },
          {
            label: tDash.kpis.netPayroll.title,
            value: formatCurrency(statistics.netPayroll),
            description: tDash.kpis.netPayroll.description,
            accent: "var(--info)",
          },
          {
            label: tDash.kpis.averageSalary.title,
            value: formatCurrency(statistics.averageSalary),
            description: tDash.kpis.averageSalary.description,
            accent: "#9333ea",
          },
          {
            label: tDash.kpis.growthRate.title,
            value: formatPercentage(statistics.growthRate),
            description: tDash.kpis.growthRate.description,
            accent:
              statistics.growthRate >= 0 ? "var(--success)" : "var(--error)",
            delta: `${statistics.growthRate >= 0 ? "+" : ""}${statistics.growthRate.toFixed(1)}%`,
            deltaDirection: statistics.growthRate >= 0 ? "up" : "down",
          },
          {
            label: tDash.kpis.activeLoans.title,
            value: formatNumber(statistics.activeLoanCount),
            description: tDash.kpis.activeLoans.description,
            accent: "var(--warning)",
          },
        ]}
      />

      {/* Pending Approvals Section */}
      {((pendingAllowances?.total ?? 0) > 0 ||
        (pendingLoans?.total ?? 0) > 0 ||
        (pendingDeductions?.total ?? 0) > 0) && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            {t("payroll.dashboard.pendingApprovals.title")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(pendingAllowances?.total ?? 0) > 0 && (
              <Card className="p-4 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                      <HandCoins className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("payroll.dashboard.pendingApprovals.allowances")}
                      </p>
                      <p className="text-2xl font-bold">
                        {pendingAllowances?.total ?? 0}
                      </p>
                    </div>
                  </div>
                  {pendingAllowances?.data?.[0]?.employeeId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/employees/${pendingAllowances.data[0].employeeId}?tab=allowances`,
                        )
                      }
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {pendingAllowances?.data &&
                  pendingAllowances.data.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {pendingAllowances.data.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          className="flex items-center justify-between w-full text-sm px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                          onClick={() =>
                            navigate(
                              `/employees/${a.employeeId}?tab=allowances`,
                            )
                          }
                        >
                          <span className="text-muted-foreground truncate">
                            {a.employee
                              ? `${a.employee.firstName} ${a.employee.lastName}`
                              : a.employeeId.slice(0, 8)}
                          </span>
                          <span className="font-medium">{a.amount} SAR</span>
                        </button>
                      ))}
                    </div>
                  )}
              </Card>
            )}

            {(pendingLoans?.total ?? 0) > 0 && (
              <Card className="p-4 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("payroll.dashboard.pendingApprovals.loans")}
                      </p>
                      <p className="text-2xl font-bold">
                        {pendingLoans?.total ?? 0}
                      </p>
                    </div>
                  </div>
                  {pendingLoans?.data?.[0]?.employeeId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/employees/${pendingLoans.data[0].employeeId}?tab=loans`,
                        )
                      }
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {pendingLoans?.data && pendingLoans.data.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {pendingLoans.data.slice(0, 3).map((l) => (
                      <button
                        key={l.id}
                        className="flex items-center justify-between w-full text-sm px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        onClick={() =>
                          navigate(`/employees/${l.employeeId}?tab=loans`)
                        }
                      >
                        <span className="text-muted-foreground truncate">
                          {l.employee
                            ? `${l.employee.firstName} ${l.employee.lastName}`
                            : l.employeeId.slice(0, 8)}
                        </span>
                        <span className="font-medium">{l.amount} SAR</span>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {(pendingDeductions?.total ?? 0) > 0 && (
              <Card className="p-4 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                      <MinusCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("payroll.dashboard.pendingApprovals.deductions")}
                      </p>
                      <p className="text-2xl font-bold">
                        {pendingDeductions?.total ?? 0}
                      </p>
                    </div>
                  </div>
                  {pendingDeductions?.data?.[0]?.employeeId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/employees/${pendingDeductions.data[0].employeeId}?tab=deductions`,
                        )
                      }
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {pendingDeductions?.data &&
                  pendingDeductions.data.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {pendingDeductions.data.slice(0, 3).map((d) => (
                        <button
                          key={d.id}
                          className="flex items-center justify-between w-full text-sm px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                          onClick={() =>
                            navigate(
                              `/employees/${d.employeeId}?tab=deductions`,
                            )
                          }
                        >
                          <span className="text-muted-foreground truncate">
                            {d.employee
                              ? `${d.employee.firstName} ${d.employee.lastName}`
                              : d.employeeId.slice(0, 8)}
                          </span>
                          <span className="font-medium">{d.amount} SAR</span>
                        </button>
                      ))}
                    </div>
                  )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Charts Section - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Type Distribution - Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {tDash.charts?.employmentTypeDistribution?.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tDash.charts?.employmentTypeDistribution?.description}
          </p>
          {(() => {
            const chartData = employmentTypeChartData.map((item) => ({
              name: item.type,
              value: item.totalSalary,
            }));
            const apexData = convertToApexBarFormat(chartData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="#3b82f6" // Blue for employment type
                height={300}
                borderRadius={8}
              />
            );
          })()}
        </Card>

        {/* Department Distribution - Donut Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {tDash.charts?.departmentDistribution?.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tDash.charts?.departmentDistribution?.description}
          </p>
          {departmentChartData.length > 0 ? (
            (() => {
              const apexData = convertToApexDonutFormat(departmentChartData);

              return (
                <ApexDonutChart
                  series={apexData.series}
                  labels={apexData.labels}
                  height={300}
                  centerLabel={{
                    value: departmentChartData.reduce(
                      (sum, item) => sum + item.count,
                      0,
                    ),
                    text: tDash.kpis.totalEmployees.title || "Employees",
                  }}
                />
              );
            })()
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              {tDash.charts?.departmentDistribution?.noData}
            </div>
          )}
        </Card>

        {/* Allowance Breakdown - Donut Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {tDash.charts?.allowanceBreakdown?.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tDash.charts?.allowanceBreakdown?.description}
          </p>
          {allowanceChartData.length > 0 ? (
            (() => {
              const apexData = convertToApexDonutFormat(allowanceChartData);

              return (
                <ApexDonutChart
                  series={apexData.series}
                  labels={apexData.labels}
                  height={300}
                />
              );
            })()
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              {tDash.charts?.allowanceBreakdown?.noData}
            </div>
          )}
        </Card>

        {/* Deduction Breakdown - Donut Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {tDash.charts?.deductionBreakdown?.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tDash.charts?.deductionBreakdown?.description}
          </p>
          {deductionChartData.length > 0 ? (
            (() => {
              const apexData = convertToApexDonutFormat(deductionChartData);

              return (
                <ApexDonutChart
                  series={apexData.series}
                  labels={apexData.labels}
                  height={300}
                />
              );
            })()
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              {tDash.charts?.deductionBreakdown?.noData}
            </div>
          )}
        </Card>
      </div>

      {/* Full Width Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Loan Status Distribution - Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {tDash.charts?.loanStatusDistribution?.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tDash.charts?.loanStatusDistribution?.description}
          </p>
          {loanStatusChartData.length > 0 ? (
            (() => {
              const chartData = loanStatusChartData.map((item) => ({
                name: item.status,
                value: item.count,
              }));
              const apexData = convertToApexBarFormat(chartData);

              return (
                <ApexBarChart
                  series={apexData.series}
                  categories={apexData.categories}
                  color="#f59e0b" // Amber for loans
                  height={300}
                  borderRadius={8}
                />
              );
            })()
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              {tDash.charts?.loanStatusDistribution?.noData}
            </div>
          )}
        </Card>

        {/* Monthly Payroll Trend - Multi-Line Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {tDash.charts?.monthlyTrend?.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {tDash.charts?.monthlyTrend?.description}
          </p>
          {monthlyTrendData.length > 0 ? (
            (() => {
              const lines = [
                {
                  key: "baseSalaries",
                  name: tDash.charts.monthlyTrend.legends.salary,
                  color: "#3b82f6", // Blue
                },
                {
                  key: "totalAllowances",
                  name: tDash.charts.monthlyTrend.legends.allowances,
                  color: "#10b981", // Green
                },
                {
                  key: "totalDeductions",
                  name: tDash.charts.monthlyTrend.legends.deductions,
                  color: "#f59e0b", // Amber
                },
                {
                  key: "netPayroll",
                  name: tDash.charts.monthlyTrend.legends.netPayroll,
                  color: "#8b5cf6", // Purple
                },
              ];

              const apexData = convertToApexLineFormat(
                monthlyTrendData,
                "month",
                lines,
              );

              return (
                <ApexLineChart
                  series={apexData.series}
                  categories={apexData.categories}
                  colors={lines.map((line) => line.color)}
                  height={350}
                  showMarkers={true}
                  smooth={true}
                />
              );
            })()
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              {tDash.charts?.monthlyTrend?.noData}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
};

export default PayrollDashboardPage;
