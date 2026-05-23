/**
 * ============================================================================
 * EMPLOYEES DASHBOARD PAGE
 * ============================================================================
 *
 * Simplified employee analytics dashboard providing:
 * - Real-time workforce metrics (4 key indicators)
 * - Interactive charts for data visualization (4 essential charts)
 * - Employment type and status distributions
 * - Department workforce breakdown
 * - Gender demographics analysis
 *
 * Performance Optimizations:
 * - Memoized chart data transformations to prevent recalculations
 * - React Query caching with 5-minute stale time
 * - Efficient re-renders only when data changes
 *
 * Architecture:
 * - Clean separation: presentation, data fetching, business logic
 * - Reusable chart components from shared library
 * - Type-safe data handling with TypeScript interfaces
 * - Responsive design with mobile-first approach
 * - Bilingual support (Arabic/English) from translations
 *
 * @module EmployeesDashboardPage
 * @version 2.0.0
 * @author ERP System - Senior Frontend Developer
 */

import { useState, useMemo, useCallback } from "react";
import { Users, UserCheck, UserX, UserMinus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ApexCharts Components
import {
  BarChart as ApexBarChart,
  DonutChart as ApexDonutChart,
} from "@/components/charts-apex";
import { useEmployeesStatistics } from "@/hooks/useEmployees";
import { useLanguage } from "@/store/languageStore";
import { translations } from "@/i18n/translations";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYEE_STATUS_LABELS,
  GENDER_LABELS,
} from "@/types/employees-statistics";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Date range filter for employee statistics
 * Uses ISO 8601 date format (YYYY-MM-DD) for API compatibility
 */
interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

/**
 * KPI Card Props - Reusable metric display component
 */
interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  loading?: boolean;
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

/**
 * KPI Metric Card - Displays single metric with icon and trend
 * Reusable component for consistent metric presentation
 */
const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  loading,
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-[var(--text-tertiary)]">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            {value}
          </h3>
          <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

/**
 * Employees Dashboard Page - Main Container
 * Central hub for all employee analytics and insights
 */
const EmployeesDashboardPage = () => {
  const { language } = useLanguage();
  const t = translations[language].employees.dashboard;
  const tCommon = translations[language].common;

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
  } = useEmployeesStatistics(dateRange);
  // ============================================================================
  // DATA TRANSFORMATIONS (Memoized for Performance)
  // ============================================================================

  /**
   * Employment Type Distribution - Bar Chart Data
   * Shows workforce composition by employment type
   */
  const employmentTypeChartData = useMemo(() => {
    if (!statistics?.employmentTypeBreakdown) return [];

    return statistics.employmentTypeBreakdown.map((item) => ({
      type:
        EMPLOYMENT_TYPE_LABELS[item.employmentType]?.[language] ||
        item.employmentType,
      count: item.employeeCount || 0,
      percentage: item.percentage || 0,
    }));
  }, [statistics, language]);

  /**
   * Employee Status Distribution - Pie Chart Data
   * Visualizes different employee statuses
   */
  const statusChartData = useMemo(() => {
    if (!statistics?.statusBreakdown) return [];

    return statistics.statusBreakdown.map((item) => ({
      name: EMPLOYEE_STATUS_LABELS[item.status]?.[language] || item.status,
      value: item.employeeCount || 0,
      percentage: item.percentage || 0,
    }));
  }, [statistics, language]);

  /**
   * Department Distribution - Pie Chart Data
   * Shows employee distribution across departments
   * Limited to top 8 departments with employees for clarity
   */
  const departmentChartData = useMemo(() => {
    if (!statistics?.departmentBreakdown) return [];

    return statistics.departmentBreakdown
      .filter((item) => item.employeeCount > 0) // Filter out empty departments
      .slice(0, 8) // Limit to top 8
      .map((item) => ({
        name: item.department || t.charts.departmentDistribution.noData,
        value: item.employeeCount || 0,
        percentage: item.percentage || 0,
        activeCount: item.activeCount || 0,
      }));
  }, [statistics, t]);

  /**
   * Gender Distribution - Pie Chart Data
   * Displays gender diversity metrics
   */
  const genderChartData = useMemo(() => {
    if (!statistics?.genderBreakdown) return [];

    return statistics.genderBreakdown.map((item) => ({
      name: GENDER_LABELS[item.gender]?.[language] || item.gender,
      value: item.employeeCount || 0,
      percentage: item.percentage || 0,
    }));
  }, [statistics, language]);

  // ============================================================================
  // FORMATTING FUNCTIONS
  // ============================================================================

  /**
   * Format number with locale-specific thousands separator
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
  // ERROR STATE
  // ============================================================================

  if (error && !statistics) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{t.errorLoading}</AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          {t.retry}
        </Button>
      </PageShell>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageShell size="wide" density="compact">
      {/* Page Header */}
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <KPICard
          title={t.kpis.totalEmployees.title}
          value={formatNumber(statistics?.totalEmployees)}
          description={t.kpis.totalEmployees.description}
          icon={<Users className="w-6 h-6 text-primary" />}
          loading={isLoading}
        />

        {/* Active Employees */}
        <KPICard
          title={t.kpis.activeEmployees.title}
          value={formatNumber(statistics?.activeEmployees)}
          description={t.kpis.activeEmployees.description}
          icon={<UserCheck className="w-6 h-6 text-green-600" />}
          loading={isLoading}
        />

        {/* Inactive Employees */}
        <KPICard
          title={t.kpis.inactiveEmployees.title}
          value={formatNumber(statistics?.inactiveEmployees)}
          description={t.kpis.inactiveEmployees.description}
          icon={<UserX className="w-6 h-6 text-[var(--text-secondary)]" />}
          loading={isLoading}
        />

        {/* On Leave Employees */}
        <KPICard
          title={t.kpis.onLeaveEmployees.title}
          value={formatNumber(statistics?.onLeaveEmployees)}
          description={t.kpis.onLeaveEmployees.description}
          icon={<UserMinus className="w-6 h-6 text-orange-600" />}
          loading={isLoading}
        />

        {/* Male Count */}
        <KPICard
          title={t.kpis.maleCount.title}
          value={formatNumber(statistics?.maleCount)}
          description={t.kpis.maleCount.description}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          loading={isLoading}
        />

        {/* Female Count */}
        <KPICard
          title={t.kpis.femaleCount.title}
          value={formatNumber(statistics?.femaleCount)}
          description={t.kpis.femaleCount.description}
          icon={<Users className="w-6 h-6 text-pink-600" />}
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Type Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t.charts.employmentTypeDistribution.title}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            {t.charts.employmentTypeDistribution.description}
          </p>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : employmentTypeChartData.length > 0 ? (
            <ApexBarChart
              series={[
                {
                  name: t.charts.employmentTypeDistribution.title,
                  data: employmentTypeChartData.map((item) => item.count),
                },
              ]}
              categories={employmentTypeChartData.map((item) => item.type)}
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              {t.charts.employmentTypeDistribution.noData}
            </div>
          )}
        </Card>

        {/* Status Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t.charts.statusBreakdown.title}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            {t.charts.statusBreakdown.description}
          </p>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : statusChartData.length > 0 ? (
            <ApexDonutChart
              series={statusChartData.map((item) => item.value)}
              labels={statusChartData.map((item) => item.name)}
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              {t.charts.statusBreakdown.noData}
            </div>
          )}
        </Card>

        {/* Department Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t.charts.departmentDistribution.title}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            {t.charts.departmentDistribution.description}
          </p>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : departmentChartData.length > 0 ? (
            <ApexDonutChart
              series={departmentChartData.map((item) => item.value)}
              labels={departmentChartData.map((item) => item.name)}
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              {t.charts.departmentDistribution.noData}
            </div>
          )}
        </Card>

        {/* Gender Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t.charts.genderDistribution.title}
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            {t.charts.genderDistribution.description}
          </p>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : genderChartData.length > 0 ? (
            <ApexDonutChart
              series={genderChartData.map((item) => item.value)}
              labels={genderChartData.map((item) => item.name)}
              height={300}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              {t.charts.genderDistribution.noData}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
};

export default EmployeesDashboardPage;
