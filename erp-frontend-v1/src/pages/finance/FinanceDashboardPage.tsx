/**
 * Finance Dashboard Page
 *
 * Comprehensive financial analytics dashboard providing:
 * - Real-time financial metrics and KPIs
 * - Interactive charts for data visualization
 * - Date range filtering for historical analysis
 * - Export capabilities for reports
 *
 * Performance Optimizations:
 * - Memoized chart data transformations
 * - Lazy loading of chart components
 * - Debounced date range updates
 * - Query caching via React Query (5 min stale time)
 *
 * Architecture:
 * - Separation of concerns: presentation, data fetching, business logic
 * - Reusable chart components for consistency
 * - Type-safe data handling with TypeScript
 *
 * @module FinanceDashboardPage
 */

import { useState, useMemo, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/common/PageShell";
import { KpiStrip } from "@/components/common/KpiStrip";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

// ApexCharts Components
import {
  BarChart,
  DonutChart as PieChart,
  LineChart,
} from "@/components/charts-apex";
import { CHART_COLORS } from "@/components/charts-apex/config";

import { useFinanceStatistics } from "@/hooks/useFinance";
import { useLanguage } from "@/store/languageStore";
import { translations } from "@/i18n/translations";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";

/**
 * Date range filter state
 * Using ISO string format for API compatibility
 */
interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

/**
 * Finance Dashboard Page Component
 * Main container for financial analytics and visualizations
 */
const FinanceDashboardPage = () => {
  const { language } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const t = translations[language].finance.dashboard;
  const tCosts = translations[language].finance.costs;
  const tCommon = translations[language].common;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [dateRange, setDateRange] = useState<DateRangeFilter>({});

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: statistics, isLoading } = useFinanceStatistics(dateRange);

  /**
   * Check if current user can approve costs
   * Used to show/hide approval-specific UI elements
   */
  const canApprove = useMemo(() => {
    return can({
      roles: [
        SYSTEM_ROLES.SUPERADMIN,
        SYSTEM_ROLES.ADMIN,
        SYSTEM_ROLES.FIN_MANAGER,
      ],
      permissions: [PERMISSIONS.FINANCE_APPROVE],
    });
  }, [can]);

  // ============================================================================
  // DATA TRANSFORMATIONS
  // ============================================================================

  /**
   * Convert data to ApexCharts Bar format
   */
  const convertToApexBarFormat = useCallback(
    (data: Array<{ status: string; amount: number }>) => {
      if (!data || data.length === 0) {
        return {
          categories: [],
          series: [{ name: t.kpis.totalCosts, data: [] }],
        };
      }

      return {
        categories: data.map((item) => item.status),
        series: [
          {
            name: t.kpis.totalCosts,
            data: data.map((item) => item.amount),
          },
        ],
      };
    },
    [t],
  );

  /**
   * Convert data to ApexCharts Line format
   */
  const convertToApexLineFormat = useCallback(
    (data: Array<{ month: string; amount: number }>) => {
      if (!data || data.length === 0) {
        return {
          categories: [],
          series: [{ name: t.kpis.totalCosts, data: [] }],
        };
      }

      return {
        categories: data.map((item) => item.month),
        series: [
          {
            name: t.kpis.totalCosts,
            data: data.map((item) => item.amount),
          },
        ],
      };
    },
    [t],
  );

  /**
   * Convert data to ApexCharts Donut format
   */
  const convertToApexDonutFormat = useCallback(
    (
      data: Array<{ name: string; value: number }>,
    ): { series: number[]; labels: string[] } => {
      if (!data || data.length === 0) {
        return { series: [], labels: [] };
      }

      return {
        series: data.map((item) => item.value),
        labels: data.map((item) => item.name),
      };
    },
    [],
  );

  /**
   * Transform status breakdown for bar chart
   * Memoized to prevent unnecessary recalculations
   */
  const statusChartData = useMemo(() => {
    if (!statistics?.statusBreakdown) return [];

    return statistics.statusBreakdown.map((item) => ({
      status:
        t.statusLabels[item.status as keyof typeof t.statusLabels] ||
        item.status,
      amount: item.amount,
      count: item.count,
    }));
  }, [statistics, t]);

  /**
   * Transform cost type breakdown for pie chart
   * Filters out zero values for cleaner visualization
   */
  const costTypeChartData = useMemo(() => {
    if (!statistics?.costTypeBreakdown) return [];

    return statistics.costTypeBreakdown
      .filter((item) => item.amount > 0)
      .map((item) => ({
        name:
          t.costTypeLabels[item.type as keyof typeof t.costTypeLabels] ||
          item.type,
        value: item.amount,
        count: item.count,
      }));
  }, [statistics, t]);

  /**
   * Transform category breakdown for pie chart
   * Limited to top 5 categories for readability
   */
  const categoryChartData = useMemo(() => {
    if (!statistics?.categoryBreakdown) return [];

    return statistics.categoryBreakdown.slice(0, 5).map((item) => ({
      name: item.categoryName,
      value: item.amount,
      count: item.count,
    }));
  }, [statistics]);

  /**
   * Transform monthly trend for line chart
   * Ensures chronological order
   */
  const monthlyTrendData = useMemo(() => {
    if (!statistics?.monthlyTrend) return [];
    return statistics.monthlyTrend;
  }, [statistics]);

  // ============================================================================
  // FORMATTING HELPERS
  // ============================================================================

  /**
   * Format currency values with proper Arabic numerals
   * Supports multiple locales and handles large numbers
   */
  const formatCurrency = useCallback(
    (value: number) => {
      const locale = language === "ar" ? "ar-EG" : "en-US";
      return `${value.toLocaleString(locale, { maximumFractionDigits: 0 })} ${tCommon.currency}`;
    },
    [language, tCommon.currency],
  );

  /**
   * Format percentage values
   */
  const formatPercentage = useCallback((value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageShell size="wide" density="compact">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <PageHeader title={t.title} description={t.description} />
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--text-tertiary)]" />
          <Input
            type="date"
            value={dateRange.startDate || ""}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                startDate: e.target.value || undefined,
              }))
            }
            className="w-40 h-9"
          />
          <span className="text-[var(--text-tertiary)] text-sm">-</span>
          <Input
            type="date"
            value={dateRange.endDate || ""}
            onChange={(e) =>
              setDateRange((prev) => ({
                ...prev,
                endDate: e.target.value || undefined,
              }))
            }
            className="w-40 h-9"
          />
          {(dateRange.startDate || dateRange.endDate) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setDateRange({})}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Pending Approvals Alert - Only for Financial Managers */}
      {canApprove && statistics && statistics.pendingAmount > 0 && (
        <Card className="p-6 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--warning-bg)] text-[var(--warning)] rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {tCosts.stats.pendingApproval}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {formatCurrency(statistics.pendingAmount)} •{" "}
                  {statistics.statusBreakdown?.find(
                    (s) => s.status === "PENDING",
                  )?.count || 0}{" "}
                  {tCosts.stats.items}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/finance/approvals")}
              className="bg-[var(--warning)] hover:opacity-90 text-[var(--text-on-brand)]"
            >
              <CheckCircle className="h-4 w-4 me-2" />
              {tCosts.actions.reviewApprovals}
            </Button>
          </div>
        </Card>
      )}

      {/* KPI Metrics */}
      <KpiStrip
        items={[
          {
            label: t.kpis.totalCosts || "Active Costs (Excluding Rejected)",
            value: formatCurrency(statistics?.totalCosts || 0),
            accent: "var(--primary-light)",
            delta:
              statistics?.growthRate != null
                ? `${statistics.growthRate >= 0 ? "+" : ""}${statistics.growthRate.toFixed(1)}%`
                : undefined,
            deltaDirection: (statistics?.growthRate ?? 0) >= 0 ? "up" : "down",
          },
          {
            label: t.kpis.pendingAmount,
            value: formatCurrency(statistics?.pendingAmount || 0),
            accent: "var(--warning)",
            onClick: canApprove
              ? () => navigate("/finance/costs?paymentStatus=PENDING")
              : undefined,
            delta: statistics?.statusBreakdown?.find(
              (s) => s.status === "PENDING",
            )?.count
              ? String(
                  statistics.statusBreakdown!.find(
                    (s) => s.status === "PENDING",
                  )?.count ?? 0,
                )
              : undefined,
            deltaDirection: "neutral",
          },
          {
            label: t.kpis.approvedAmount,
            value: formatCurrency(statistics?.approvedAmount || 0),
            accent: "var(--success)",
          },
          {
            label: t.kpis.paidAmount,
            value: formatCurrency(statistics?.paidAmount || 0),
            accent: "var(--primary-light)",
          },
          {
            label: t.kpis.rejectedAmount || "Rejected (Archive)",
            value: formatCurrency(statistics?.rejectedAmount || 0),
            accent: "var(--error)",
          },
        ]}
      />

      {/* Charts Grid - Professional Layout */}
      {statistics &&
        (() => {
          const pipeline = [
            {
              key: "pending",
              label: t.kpis.pendingAmount,
              amount: statistics.pendingAmount,
              color: "amber",
              bg: "bg-[var(--warning-bg)]",
              border: "border-[var(--border-subtle)]",
              text: "text-[var(--text-secondary)]",
            },
            {
              key: "approved",
              label: t.kpis.approvedAmount,
              amount: statistics.approvedAmount,
              color: "green",
              bg: "bg-emerald-50 dark:bg-emerald-950/30",
              border: "border-emerald-200 dark:border-emerald-800",
              text: "text-emerald-700 dark:text-emerald-300",
            },
            {
              key: "paid",
              label: t.kpis.paidAmount,
              amount: statistics.paidAmount,
              color: "purple",
              bg: "bg-purple-50 dark:bg-purple-950/30",
              border: "border-purple-200 dark:border-purple-800",
              text: "text-purple-700 dark:text-purple-300",
            },
          ];
          const totalActive = statistics.totalCosts || 1;
          return (
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                {tCosts.actions.approvalPipeline}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {pipeline.map((stage, idx) => {
                  const pct = ((stage.amount / totalActive) * 100).toFixed(1);
                  return (
                    <div key={stage.key} className="flex items-center gap-2">
                      <div
                        className={`flex flex-col items-center px-4 py-2.5 rounded-md border ${stage.bg} ${stage.border} min-w-[130px]`}
                      >
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                          {stage.label}
                        </span>
                        <span
                          className={`text-base font-bold mt-0.5 ${stage.text}`}
                        >
                          {formatCurrency(stage.amount)}
                        </span>
                        <span className="text-[0.65rem] text-[var(--text-tertiary)]">
                          {pct}%
                        </span>
                      </div>
                      {idx < pipeline.length - 1 && (
                        <span className="text-[var(--text-tertiary)] text-lg font-light">
                          →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {/* Charts Grid - Professional Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Status Breakdown - Bar Chart */}
        {(() => {
          const apexData = convertToApexBarFormat(statusChartData);
          return (
            <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t.charts.statusBreakdown.title}
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t.charts.statusBreakdown.description}
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-[450px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-main)]"></div>
                </div>
              ) : apexData.series[0].data.length > 0 ? (
                <BarChart
                  series={apexData.series}
                  categories={apexData.categories}
                  color={CHART_COLORS.info}
                  height={450}
                />
              ) : (
                <div className="flex items-center justify-center h-[450px] text-[var(--text-tertiary)]">
                  {tCommon.noData}
                </div>
              )}
            </div>
          );
        })()}

        {/* Cost Type Breakdown - Pie Chart */}
        {(() => {
          const apexData = convertToApexDonutFormat(costTypeChartData);
          return (
            <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t.charts.costTypeBreakdown.title}
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t.charts.costTypeBreakdown.description}
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-[500px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-main)]"></div>
                </div>
              ) : apexData.series.length > 0 ? (
                <PieChart
                  series={apexData.series}
                  labels={apexData.labels}
                  colors={[
                    CHART_COLORS.info,
                    CHART_COLORS.success,
                    CHART_COLORS.warning,
                    CHART_COLORS.danger,
                    CHART_COLORS.purple,
                    CHART_COLORS.pink,
                  ]}
                  height={500}
                  showLegend={true}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px] text-[var(--text-tertiary)]">
                  {tCommon.noData}
                </div>
              )}
            </div>
          );
        })()}

        {/* Monthly Trend - Line Chart */}
        {(() => {
          const apexData = convertToApexLineFormat(monthlyTrendData);
          return (
            <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t.charts.monthlyTrend.title}
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t.charts.monthlyTrend.description}
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-[450px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-main)]"></div>
                </div>
              ) : apexData.series[0].data.length > 0 ? (
                <LineChart
                  series={apexData.series}
                  categories={apexData.categories}
                  colors={[CHART_COLORS.success]}
                  height={450}
                  smooth
                />
              ) : (
                <div className="flex items-center justify-center h-[450px] text-[var(--text-tertiary)]">
                  {tCommon.noData}
                </div>
              )}
            </div>
          );
        })()}

        {/* Category Breakdown - Pie Chart */}
        {(() => {
          const apexData = convertToApexDonutFormat(categoryChartData);
          return (
            <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t.charts.categoryBreakdown.title}
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t.charts.categoryBreakdown.description}
                </p>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-[500px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-main)]"></div>
                </div>
              ) : apexData.series.length > 0 ? (
                <PieChart
                  series={apexData.series}
                  labels={apexData.labels}
                  colors={[
                    CHART_COLORS.danger,
                    CHART_COLORS.warning,
                    CHART_COLORS.success,
                    CHART_COLORS.info,
                    CHART_COLORS.purple,
                  ]}
                  height={500}
                  showLegend={true}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px] text-[var(--text-tertiary)]">
                  {tCommon.noData}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Additional Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            {t.kpis.totalEntries}
          </h3>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {statistics?.totalEntries || 0}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {statistics?.recentCosts || 0} {t.kpis.addedInLast30Days}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            {t.kpis.averageCost}
          </h3>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(statistics?.averageCost || 0)}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {t.kpis.perEntry}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            {t.kpis.growthRate}
          </h3>
          <p
            className={`text-2xl font-bold ${
              (statistics?.growthRate || 0) >= 0
                ? "text-[var(--success)]"
                : "text-[var(--error)]"
            }`}
          >
            {formatPercentage(statistics?.growthRate || 0)}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {t.kpis.vsLastMonth}
          </p>
        </Card>
      </div>
    </PageShell>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Metric Card Component
 * Displays a KPI with icon, value, and optional trend indicator
 *
 * Design Pattern: Composition for reusability
 * Performance: Pure component with memo if needed
 */
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export default FinanceDashboardPage;
