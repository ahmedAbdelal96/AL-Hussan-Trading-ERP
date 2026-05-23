/**
 * ============================================================================
 * MAINTENANCE DASHBOARD PAGE
 * ============================================================================
 *
 *
 *
 * Performance Features:
 * - Memoized chart data transformations
 * - React Query caching (5 minutes)
 * - Efficient re-renders
 * - Loading states
 * - Error handling
 *
 * @module MaintenanceDashboardPage
 * @version 2.0.0 (Simplified)
 */

import { useState, useMemo } from "react";
import {
  Wrench,
  Clock,
  CheckCircle2,
  PlayCircle,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaintenanceStatistics } from "@/hooks/useMaintenance";

// ApexCharts Components (New Professional Charts)
import {
  BarChart as ApexBarChart,
  DonutChart as ApexDonutChart,
  LineChart as ApexLineChart,
} from "@/components/charts-apex";
import { useLanguage } from "@/store/languageStore";
import { translations } from "@/i18n/translations";
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  type MaintenanceStatisticsParams,
} from "@/types/maintenance-statistics";

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  colorClass?: string;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  description,
  icon,
  colorClass = "text-[var(--text-secondary)]",
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          {description && <Skeleton className="h-3 w-20" />}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={`${colorClass} opacity-50`}>{icon}</div>
      </div>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MaintenanceDashboardPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === "ar";

  // Filters state
  const [filters] = useState<MaintenanceStatisticsParams | undefined>(
    undefined,
  );

  // Fetch statistics
  const { data, isLoading, error } = useMaintenanceStatistics(filters);
  /**
   * ============================================================================
   * DATA CONVERSION HELPERS - Recharts to ApexCharts Format
   * ============================================================================
   */

  /**
   * Convert bar chart data with comprehensive validation
   * Handles edge cases: empty data, undefined values, null fields
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
    data: Array<Record<string, number | string>>,
    xAxisKey: string,
    lines: Array<{ key: string; name: string; color?: string }>,
  ) => {
    const safeData = data || [];
    const safeLines = lines || [];

    if (safeData.length === 0 || safeLines.length === 0) {
      return { categories: [], series: [] };
    }

    return {
      categories: safeData.map((item) => {
        const value = item[xAxisKey];
        return typeof value === "string" ? value : String(value || "N/A");
      }),
      series: safeLines.map((line) => ({
        name: line.name || "Series",
        data: safeData.map((item) => {
          const value = item[line.key];
          return typeof value === "number" ? value : Number(value) || 0;
        }),
      })),
    };
  };

  // Memoized chart data transformations
  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      // Status Breakdown (with safety check)
      statusData: (data.statusBreakdown || []).map((item) => ({
        name: isRTL
          ? MAINTENANCE_STATUS_LABELS[item.status]?.ar
          : MAINTENANCE_STATUS_LABELS[item.status]?.en,
        value: item.count,
        percentage: item.percentage,
        cost: item.totalCost,
      })),

      // Type Breakdown (with safety check)
      typeData: (data.typeBreakdown || []).map((item) => ({
        name: isRTL
          ? MAINTENANCE_TYPE_LABELS[item.maintenanceType]?.ar
          : MAINTENANCE_TYPE_LABELS[item.maintenanceType]?.en,
        value: item.count,
        percentage: item.percentage,
        cost: item.totalCost,
      })),

      // Priority Breakdown (with safety check)
      priorityData: (data.priorityBreakdown || []).map((item) => ({
        name: isRTL
          ? MAINTENANCE_PRIORITY_LABELS[item.priority]?.ar
          : MAINTENANCE_PRIORITY_LABELS[item.priority]?.en,
        value: item.count,
        percentage: item.percentage,
      })),

      // Monthly Trend (with safety check)
      monthlyTrendData: (data.monthlyTrend || []).map((item) => ({
        name: new Date(item.month).toLocaleDateString(
          isRTL ? "ar-EG" : "en-US",
          {
            month: "short",
            year: "2-digit",
          },
        ),
        new: item.newRequests,
        completed: item.completedRequests,
        cancelled: item.cancelledRequests,
        active: item.totalActiveRequests,
      })),

      // Cost by Type (with safety check)
      costByTypeData: (data.costByType || []).map((item) => ({
        name: isRTL
          ? MAINTENANCE_TYPE_LABELS[item.maintenanceType]?.ar
          : MAINTENANCE_TYPE_LABELS[item.maintenanceType]?.en,
        value: item.totalCost,
        percentage: item.percentage,
      })),
    };
  }, [data, isRTL]);

  // Loading state
  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader
          title={t.maintenance.dashboard.title}
          description={t.maintenance.dashboard.subtitle}
        />

        {/* KPI Cards Loading */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        {/* Charts Loading */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader
          title={t.maintenance.dashboard.title}
          description={t.maintenance.dashboard.subtitle}
        />
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t.maintenance.dashboard.error}:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  // No data state
  if (!data || !chartData) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader
          title={t.maintenance.dashboard.title}
          description={t.maintenance.dashboard.subtitle}
        />
        <Alert>
          <AlertDescription>{t.maintenance.dashboard.noData}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={t.maintenance.dashboard.title}
          description={t.maintenance.dashboard.subtitle}
        />
        <p className="text-sm text-muted-foreground">
          {t.maintenance.dashboard.lastUpdated}:{" "}
          {new Date(data.generatedAt).toLocaleString(
            isRTL ? "ar-EG" : "en-US",
            {
              dateStyle: "medium",
              timeStyle: "short",
            },
          )}
        </p>
      </div>

      {/* KPI Cards - Simplified (8 Cards in 2 rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title={t.maintenance.dashboard.totalRequests}
          value={data.totalRequests.toLocaleString()}
          icon={<Wrench className="h-5 w-5" />}
          colorClass="text-blue-600"
        />
        <KPICard
          title={t.maintenance.dashboard.pendingRequests}
          value={data.pendingRequests.toLocaleString()}
          description={`${((data.pendingRequests / data.totalRequests) * 100).toFixed(1)}%`}
          icon={<Clock className="h-5 w-5" />}
          colorClass="text-yellow-600"
        />
        <KPICard
          title={t.maintenance.dashboard.inProgressRequests}
          value={data.inProgressRequests.toLocaleString()}
          description={`${((data.inProgressRequests / data.totalRequests) * 100).toFixed(1)}%`}
          icon={<PlayCircle className="h-5 w-5" />}
          colorClass="text-blue-600"
        />
        <KPICard
          title={t.maintenance.dashboard.completedRequests}
          value={data.completedRequests.toLocaleString()}
          description={`${((data.completedRequests / data.totalRequests) * 100).toFixed(1)}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          colorClass="text-green-600"
        />
        <KPICard
          title={t.maintenance.dashboard.completionRate}
          value={`${data.completionRate.toFixed(1)}%`}
          description={t.maintenance.dashboard.completionRateDesc}
          icon={<TrendingUp className="h-5 w-5" />}
          colorClass="text-green-600"
        />
        <KPICard
          title={t.maintenance.dashboard.averageResolutionDays}
          value={`${data.averageResolutionDays.toFixed(1)}`}
          description={t.maintenance.dashboard.days}
          icon={<Timer className="h-5 w-5" />}
          colorClass="text-blue-600"
        />
        <KPICard
          title={t.maintenance.dashboard.totalCost}
          value={data.totalCost.toLocaleString(isRTL ? "ar-EG" : "en-US", {
            style: "currency",
            currency: "EGP",
            maximumFractionDigits: 0,
          })}
          icon={<DollarSign className="h-5 w-5" />}
          colorClass="text-purple-600"
        />
        <KPICard
          title={t.maintenance.dashboard.highPriorityRequests}
          value={data.highPriorityRequests.toLocaleString()}
          description={t.maintenance.dashboard.highPriorityDesc}
          icon={<AlertTriangle className="h-5 w-5" />}
          colorClass="text-red-600"
        />
      </div>

      {/* Charts Section - Simplified (5 Charts) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Breakdown - Donut Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t.maintenance.dashboard.charts.statusBreakdown}
          </h3>
          {(() => {
            const apexData = convertToApexDonutFormat(chartData.statusData);

            return (
              <ApexDonutChart
                series={apexData.series}
                labels={apexData.labels}
                height={300}
                centerLabel={{
                  value: data.totalRequests,
                  text: t.maintenance.dashboard.totalRequests,
                }}
              />
            );
          })()}
        </Card>

        {/* Type Breakdown - Donut Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t.maintenance.dashboard.charts.typeBreakdown}
          </h3>
          {(() => {
            const apexData = convertToApexDonutFormat(chartData.typeData);

            return (
              <ApexDonutChart
                series={apexData.series}
                labels={apexData.labels}
                height={300}
              />
            );
          })()}
        </Card>

        {/* Priority Breakdown - Bar Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t.maintenance.dashboard.charts.priorityBreakdown}
          </h3>
          {(() => {
            const apexData = convertToApexBarFormat(chartData.priorityData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="#ef4444" // Red for priority
                height={300}
                borderRadius={8}
              />
            );
          })()}
        </Card>

        {/* Monthly Trend - Multi-Line Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t.maintenance.dashboard.charts.monthlyTrend}
          </h3>
          {(() => {
            const lines = [
              {
                key: "new",
                name: t.maintenance.dashboard.charts.newRequests,
                color: "#3b82f6", // Blue
              },
              {
                key: "completed",
                name: t.maintenance.dashboard.charts.completedRequests,
                color: "#10b981", // Green
              },
              {
                key: "active",
                name: t.maintenance.dashboard.charts.activeRequests,
                color: "#f59e0b", // Amber
              },
            ];

            const apexData = convertToApexLineFormat(
              chartData.monthlyTrendData,
              "name",
              lines,
            );

            return (
              <ApexLineChart
                series={apexData.series}
                categories={apexData.categories}
                colors={lines.map((line) => line.color)}
                height={300}
                showMarkers={true}
                smooth={true}
              />
            );
          })()}
        </Card>

        {/* Cost by Type - Donut Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t.maintenance.dashboard.charts.costByType}
          </h3>
          {(() => {
            const apexData = convertToApexDonutFormat(chartData.costByTypeData);

            return (
              <ApexDonutChart
                series={apexData.series}
                labels={apexData.labels}
                height={300}
              />
            );
          })()}
        </Card>
      </div>
    </PageShell>
  );
}

