/**
 * ============================================================================
 * PROJECTS DASHBOARD PAGE
 * ============================================================================
 *
 *
 * @module ProjectsDashboardPage
 * @version 1.0.0
 */

import { useMemo, useState, useCallback } from "react";
import { useProjectsStatistics } from "@/hooks/useProjects";
import { useLanguage } from "@/store/languageStore";
import { translations } from "@/i18n/translations";
import { CURRENCY } from "@/config/system.constants";
import type { ProjectsStatisticsParams } from "@/types/projects-statistics";
import { PROJECT_STATUS_LABELS } from "@/types/projects-statistics";

// ApexCharts Components (Professional Charts)
import {
  BarChart as ApexBarChart,
  DonutChart as ApexDonutChart,
  LineChart as ApexLineChart,
} from "@/components/charts-apex";
import {
  Briefcase,
  CheckCircle,
  DollarSign,
  Activity,
  AlertTriangle,
  Users,
  MapPin,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";

/**
 * KPI Card Component
 */
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  description,
}) => {
  const { isRTL } = useLanguage();

  return (
    <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
      <div
        className={`flex items-start justify-between ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <div className={isRTL ? "text-right" : ""}>
          <p className="text-sm text-[var(--text-secondary)] mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] mt-1">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-xs text-[var(--text-tertiary)] dark:text-[var(--text-tertiary)] mt-2">
              {description}
            </p>
          )}
        </div>
        <div className="p-3 bg-[var(--bg-surface-secondary)] rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};

/**
 * Projects Dashboard Page Component
 */
export default function ProjectsDashboardPage() {
  const { language } = useLanguage();
  const t = translations[language];

  const [filters] = useState<ProjectsStatisticsParams | undefined>(undefined);

  const { data, isLoading, error, refetch, isFetching } =
    useProjectsStatistics(filters);

  /**
   * Format month from "YYYY-MM" to readable format
   */
  const formatMonth = useCallback(
    (monthStr: string): string => {
      const [year, month] = monthStr.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
        month: "short",
        year: "numeric",
      });
    },
    [language],
  );

  /**
   * ============================================================================
   * DATA CONVERSION HELPERS - Recharts to ApexCharts Format
   * ============================================================================
   */

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
        series: [{ name: "Count", data: [] }],
      };
    }

    return {
      categories: safeData.map((item) => item.name || "N/A"),
      series: [
        {
          name: "Count",
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
    data: Array<Record<string, string | number>>,
    xAxisKey: string,
    lines: Array<{ key: string; name: string; color?: string }>,
  ) => {
    const safeData = data || [];
    const safeLines = lines || [];

    if (safeData.length === 0 || safeLines.length === 0) {
      return { categories: [], series: [] };
    }

    return {
      categories: safeData.map((item) => String(item[xAxisKey] || "N/A")),
      series: safeLines.map((line) => ({
        name: line.name || "Series",
        data: safeData.map((item) => Number(item[line.key]) || 0),
      })),
    };
  };

  // Transform data for charts
  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      // Filter out items with count = 0 (with safety check)
      statusData: (data.statusBreakdown || [])
        .filter((item) => item.count > 0)
        .map((item) => ({
          name: PROJECT_STATUS_LABELS[item.status][language],
          value: item.count,
          percentage: item.percentage,
          budget: item.totalBudget,
          cost: item.totalActualCost,
        })),
      monthlyTrendData: (data.monthlyTrend || []).map((item) => ({
        month: formatMonth(item.month),
        started: item.projectsStarted,
        completed: item.projectsCompleted,
        cancelled: item.projectsCancelled,
        active: item.activeProjectsCount,
        budget: item.totalBudget,
        cost: item.totalActualCost,
      })),
      topByBudgetData: (data.topProjectsByBudget || [])
        .slice(0, 10)
        .map((item) => ({
          name:
            item.projectName.length > 25
              ? item.projectName.substring(0, 25) + "..."
              : item.projectName,
          fullName: item.projectName,
          value: item.budget,
          cost: item.actualCost,
          completion: item.completionPercentage,
        })),
      topByCostData: data.topProjectsByCost.slice(0, 10).map((item) => ({
        name:
          item.projectName.length > 25
            ? item.projectName.substring(0, 25) + "..."
            : item.projectName,
        fullName: item.projectName,
        value: item.actualCost,
        budget: item.budget,
        completion: item.completionPercentage,
      })),
      employeeData: data.employeeDistribution.slice(0, 10).map((item) => ({
        name:
          item.projectName.length > 25
            ? item.projectName.substring(0, 25) + "..."
            : item.projectName,
        fullName: item.projectName,
        value: item.employeeCount,
        cost: item.totalEmployeeCost,
      })),
      siteData: data.siteDistribution.slice(0, 10).map((item) => ({
        name:
          item.siteName.length > 25
            ? item.siteName.substring(0, 25) + "..."
            : item.siteName,
        fullName: item.siteName,
        value: item.projectCount,
        projects: item.projectCount,
        active: item.activeProjectsCount,
        completed: item.completedProjectsCount,
        budget: item.totalBudget,
      })),
    };
  }, [data, language, formatMonth]);

  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex items-center justify-center min-h-[24rem]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-main)] mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">
              {t.projects.dashboard?.loading || "Loading..."}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex items-center justify-center min-h-[24rem]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-[var(--error)] mx-auto mb-4" />
            <p className="text-[var(--error)]">
              {t.projects.dashboard?.error || "Error loading statistics"}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!data || !chartData) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex items-center justify-center min-h-[24rem]">
          <p className="text-[var(--text-secondary)]">
            {t.projects.dashboard?.noData || "No data available"}
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t.projects.dashboard?.title || "Projects Dashboard"}
        subtitle={
          t.projects.dashboard?.subtitle ||
          "Comprehensive projects statistics and analytics"
        }
        icon={<Briefcase className="h-6 w-6" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ltr:mr-2 rtl:ml-2 ${isFetching ? "animate-spin" : ""}`}
            />
            {t.common?.refresh || "Refresh"}
          </Button>
        }
      />

      {/* Overview KPIs (5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          title={t.projects.dashboard?.totalProjects || "Total Projects"}
          value={data.totalProjects}
          icon={<Briefcase className="h-6 w-6 text-blue-600" />}
        />
        <KPICard
          title={t.projects.dashboard?.activeProjects || "Active"}
          value={data.activeProjects}
          icon={<Activity className="h-6 w-6 text-green-600" />}
        />
        <KPICard
          title={t.projects.dashboard?.completedProjects || "Completed"}
          value={data.completedProjects}
          icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
        />
        <KPICard
          title={t.projects.dashboard?.totalBudget || "Total Budget"}
          value={`${(data.totalBudget / 1000000).toFixed(1)}M`}
          subtitle={CURRENCY.SYMBOL}
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
        />
        <KPICard
          title={t.projects.dashboard?.totalActualCost || "Actual Cost"}
          value={`${(data.totalActualCost / 1000000).toFixed(1)}M`}
          subtitle={CURRENCY.SYMBOL}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        />
      </div>

      {/* Charts - Row 1: Status & Employee Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown - Donut Chart */}
        <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {t.projects.dashboard?.charts?.statusBreakdown ||
              "Projects by Status"}
          </h3>
          {chartData.statusData.length > 0 ? (
            (() => {
              const apexData = convertToApexDonutFormat(chartData.statusData);

              return (
                <ApexDonutChart
                  series={apexData.series}
                  labels={apexData.labels}
                  height={300}
                  centerLabel={{
                    value: data.totalProjects,
                    text: t.projects.dashboard?.totalProjects || "Total",
                  }}
                />
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[var(--text-tertiary)]">
              {t.projects.dashboard?.noData || "No data available"}
            </div>
          )}
        </div>

        {/* Employee Distribution - Bar Chart */}
        <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            <Users className="inline h-5 w-5 mr-2" />
            {t.projects.dashboard?.charts?.employeeDistribution ||
              "Employee Distribution"}
          </h3>
          {chartData.employeeData.length > 0 ? (
            (() => {
              const apexData = convertToApexBarFormat(chartData.employeeData);

              return (
                <ApexBarChart
                  series={apexData.series}
                  categories={apexData.categories}
                  color="var(--success)" // Green for employees
                  height={300}
                  borderRadius={8}
                />
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-[300px] text-[var(--text-tertiary)]">
              {t.projects.dashboard?.noData || "No data available"}
            </div>
          )}
        </div>
      </div>

      {/* Charts - Row 2: Monthly Trend (Full Width) */}
      <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {t.projects.dashboard?.charts?.monthlyTrend ||
            "Monthly Trend (Last 12 Months)"}
        </h3>
        {chartData.monthlyTrendData.some(
          (item) => item.started > 0 || item.completed > 0 || item.active > 0,
        ) ? (
          (() => {
            const lines = [
              {
                key: "started",
                name: t.projects.dashboard?.started || "Started",
                color: "var(--info)",
              },
              {
                key: "completed",
                name: t.projects.dashboard?.completed || "Completed",
                color: "var(--success)",
              },
              {
                key: "active",
                name: t.projects.dashboard?.active || "Active",
                color: "var(--warning)",
              },
            ];

            const apexData = convertToApexLineFormat(
              chartData.monthlyTrendData,
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
          <div className="flex items-center justify-center h-[350px] text-[var(--text-tertiary)]">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>
                {t.projects.dashboard?.noMonthlyData ||
                  "No monthly data available yet"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Charts - Row 3: Top Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects by Budget - Bar Chart */}
        <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {t.projects.dashboard?.charts?.topByBudget ||
              "Top 10 Projects by Budget"}
          </h3>
          {(() => {
            const apexData = convertToApexBarFormat(chartData.topByBudgetData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="var(--info)" // Blue for budget
                height={350}
                borderRadius={8}
              />
            );
          })()}
        </div>

        {/* Top Projects by Cost - Bar Chart */}
        <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {t.projects.dashboard?.charts?.topByCost ||
              "Top 10 Projects by Actual Cost"}
          </h3>
          {(() => {
            const apexData = convertToApexBarFormat(chartData.topByCostData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="var(--error)" // Red for cost
                height={350}
                borderRadius={8}
              />
            );
          })()}
        </div>
      </div>

      {/* Charts - Row 4: Site Distribution (Full Width) */}
      <div className="bg-[var(--bg-surface-primary)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          <MapPin className="inline h-5 w-5 mr-2" />
          {t.projects.dashboard?.charts?.siteDistribution ||
            "Project Distribution by Site"}
        </h3>
        {(() => {
          const apexData = convertToApexBarFormat(chartData.siteData);

          return (
            <ApexBarChart
              series={apexData.series}
              categories={apexData.categories}
              color="var(--primary-light)" // Purple for sites
              height={300}
              borderRadius={8}
            />
          );
        })()}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-[var(--text-tertiary)] pt-4">
        {t.projects.dashboard?.lastUpdated || "Last updated"}:{" "}
        {new Date(data.generatedAt).toLocaleString(
          language === "ar" ? "ar-SA" : "en-US",
        )}
      </div>
    </PageShell>
  );
}
