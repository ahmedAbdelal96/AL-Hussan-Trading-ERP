/**
 * ============================================================================
 * ASSETS DASHBOARD PAGE
 * ============================================================================
 *
 * Comprehensive asset management dashboard providing:
 * - Real-time asset inventory and valuation metrics (14 KPIs)
 * - Interactive charts for data visualization (8 charts)
 * - Asset type and status distributions
 * - Location and category breakdowns
 * - Age group and value range analytics
 * - Manufacturer distribution overview
 * - Monthly acquisition and retirement trends
 *
 * Performance Optimizations:
 * - Memoized chart data transformations
 * - React Query caching with 5-minute stale time
 * - Efficient re-renders only when data changes
 * - Responsive design with mobile-first approach
 *
 * Architecture:
 * - Clean separation: presentation, data fetching, business logic
 * - Reusable chart components from shared library
 * - Type-safe data handling with TypeScript interfaces
 * - Bilingual support (Arabic/English)
 *
 * @module AssetsDashboardPage
 * @version 1.0.0
 */

import { useState, useMemo } from "react";
import {
  Package,
  DollarSign,
  CheckCircle2,
  PlayCircle,
  Wrench,
  XCircle,
  Plus,
  Minus,
  Gauge,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  Gem,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { KpiStrip } from "@/components/common/KpiStrip";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssetsStatistics } from "@/hooks/useAssets";

// ApexCharts Components (New Professional Charts)
import {
  BarChart as ApexBarChart,
  DonutChart as ApexDonutChart,
  LineChart as ApexLineChart,
} from "@/components/charts-apex";
import { useLanguage } from "@/store/languageStore";
import { translations } from "@/i18n/translations";
import { CURRENCY } from "@/config/system.constants";
import {
  ASSET_TYPE_LABELS,
  ASSET_STATUS_LABELS,
  type AssetType,
  type AssetStatus,
} from "@/types/assets-statistics";
import type { AssetsStatisticsParams } from "@/types/assets-statistics";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AssetsDashboardPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const dashboardT = t.assets.dashboard as any;
  const commonT = t.common as any;
  const isRTL = language === "ar";

  // Statistics filters
  const [filters] = useState<AssetsStatisticsParams | undefined>(undefined);

  // Fetch statistics with caching
  const { data, isLoading, error } = useAssetsStatistics(filters);
  /**
   * ============================================================================
   * DATA CONVERSION HELPERS - Recharts to ApexCharts Format
   * ============================================================================
   *
   * Old Recharts format: { data: [{ name, value }], dataKey, xAxisKey }
   * New ApexCharts format: { series: [{ name, data: [] }], categories: [] }
   *
   * Benefits of new format:
   * - Better performance with large datasets
   * - More flexible styling options
   * - Built-in responsive behavior
   * - Professional animations out-of-the-box
   */

  /**
   * Convert simple bar/donut chart data with validation
   * @param data - Array of { name, value, percentage }
   * @returns ApexCharts compatible format with safety checks
   */
  const convertToApexBarFormat = (
    data: Array<{ name: string; value: number; percentage?: number }>,
  ) => {
    // Safety check: handle empty or undefined data
    const safeData = data || [];
    if (safeData.length === 0) {
      return {
        categories: [],
        series: [{ name: dashboardT.count || "Count", data: [] }],
      };
    }

    return {
      categories: safeData.map((item) => item.name || "N/A"),
      series: [
        {
          name: dashboardT.count || "Count",
          data: safeData.map((item) => item.value || 0),
        },
      ],
    };
  };

  /**
   * Convert donut/pie chart data with validation
   * @param data - Array of { name, value, percentage }
   * @returns ApexCharts compatible format with safety checks
   */
  const convertToApexDonutFormat = (
    data: Array<{ name: string; value: number; percentage?: number }>,
  ) => {
    // Safety check: handle empty or undefined data
    const safeData = data || [];
    if (safeData.length === 0) {
      return {
        labels: [],
        series: [],
      };
    }

    return {
      labels: safeData.map((item) => item.name || "N/A"),
      series: safeData.map((item) => item.value || 0),
    };
  };

  /**
   * Convert multi-line chart data with validation
   * @param data - Array of objects with multiple numeric keys
   * @param lines - Array of line configurations { key, name, color }
   * @returns ApexCharts compatible format with safety checks
   */
  const convertToApexLineFormat = (
    data: Array<Record<string, any>>,
    xAxisKey: string,
    lines: Array<{ key: string; name: string; color?: string }>,
  ) => {
    // Safety checks
    const safeData = data || [];
    const safeLines = lines || [];

    if (safeData.length === 0 || safeLines.length === 0) {
      return {
        categories: [],
        series: [],
      };
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
  // Memoized chart data transformations
  // ============================================================================
  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      // Asset Type Distribution (with safety check)
      assetTypeData: (data.assetTypeBreakdown || []).map((item) => ({
        name: isRTL
          ? ASSET_TYPE_LABELS[item.assetType]?.ar || item.assetType
          : ASSET_TYPE_LABELS[item.assetType]?.en || item.assetType,
        value: item.assetCount,
        percentage: item.percentage,
      })),

      // Status Breakdown (with safety check)
      statusData: (data.statusBreakdown || []).map((item) => ({
        name: isRTL
          ? ASSET_STATUS_LABELS[item.status]?.ar || item.status
          : ASSET_STATUS_LABELS[item.status]?.en || item.status,
        value: item.assetCount,
        percentage: item.percentage,
      })),

      // Category Distribution (top 8) (with safety check)
      categoryData: (data.categoryBreakdown || []).slice(0, 8).map((item) => ({
        name: item.category || t.assets.dashboard.uncategorized,
        value: item.assetCount,
        percentage: item.percentage,
      })),

      // Location Distribution (with safety check)
      locationData: (data.locationBreakdown || []).map((item) => ({
        name: item.location || t.assets.dashboard.unassigned,
        value: item.assetCount,
        percentage: item.percentage,
      })),

      // Age Group Distribution (with safety check)
      ageGroupData: (data.ageGroupBreakdown || []).map((item) => {
        // Map backend ageGroup format to translation key
        // Backend: "0-1 years" -> Key: "0-1"
        const ageGroupKey = item.ageGroup.replace(" years", "");
        return {
          name:
            (dashboardT.ageGroups as Record<string, string>)[ageGroupKey] ||
            item.ageGroup,
          value: item.assetCount,
          percentage: item.percentage,
        };
      }),

      // Value Range Distribution (with safety check)
      valueRangeData: (data.valueRangeBreakdown || []).map((item) => ({
        name:
          (dashboardT.valueRanges as Record<string, string>)[item.valueRange] ||
          item.valueRange,
        value: item.assetCount,
        percentage: item.percentage,
      })),

      // Manufacturer Distribution (with safety check)
      manufacturerData: (data.manufacturerBreakdown || []).map((item) => ({
        name: item.manufacturer || t.assets.dashboard.unknown,
        value: item.assetCount,
        percentage: item.percentage,
      })),

      // Monthly Trend (last 12 months) (with safety check)
      monthlyTrendData: (data.monthlyTrend || []).map((item) => ({
        name: new Date(item.month).toLocaleDateString(
          isRTL ? "ar-EG" : "en-US",
          {
            month: "short",
            year: "2-digit",
          },
        ),
        acquired: item.assetsPurchased,
        retired: item.assetsRetired,
        total: item.totalActiveAssets,
      })),
    };
  }, [data, isRTL, t]);

  // Loading state
  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <PageHeader
          title={t.assets.dashboard.title}
          description={t.assets.dashboard.subtitle}
        />

        {/* KPI Metrics Loading */}
        <Skeleton className="h-28 w-full rounded-xl" />

        {/* Charts Loading */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
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
          title={t.assets.dashboard.title}
          description={t.assets.dashboard.subtitle}
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t.assets.dashboard.error}:{" "}
            {error instanceof Error ? error.message : commonT.unknownError}
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
          title={t.assets.dashboard.title}
          description={t.assets.dashboard.subtitle}
        />
        <Alert>
          <AlertDescription>{t.assets.dashboard.noData}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={t.assets.dashboard.title}
          description={t.assets.dashboard.subtitle}
        />
        <p className="text-sm text-[var(--text-tertiary)]">
          {t.assets.dashboard.lastUpdated}:{" "}
          {new Date(data.generatedAt).toLocaleString(
            isRTL ? "ar-EG" : "en-US",
            {
              dateStyle: "medium",
              timeStyle: "short",
            },
          )}
        </p>
      </div>

      {/* KPI Metrics */}
      <KpiStrip
        items={[
          {
            label: t.assets.dashboard.totalAssets,
            value: data.totalAssets.toLocaleString(),
            accent: "var(--primary-light)",
          },
          {
            label: t.assets.dashboard.totalValue,
            value: data.totalValue.toLocaleString(isRTL ? "ar-EG" : "en-US", {
              style: "currency",
              currency: CURRENCY.DEFAULT,
              maximumFractionDigits: 0,
            }),
            accent: "var(--primary-light)",
          },
          {
            label: t.assets.dashboard.availableAssets,
            value: data.availableAssets.toLocaleString(),
            description: `${((data.availableAssets / data.totalAssets) * 100).toFixed(1)}%`,
            accent: "var(--success)",
          },
          {
            label: t.assets.dashboard.inUseAssets,
            value: data.inUseAssets.toLocaleString(),
            description: `${((data.inUseAssets / data.totalAssets) * 100).toFixed(1)}%`,
            accent: "var(--info)",
          },
          {
            label: t.assets.dashboard.underMaintenance,
            value: data.underMaintenanceAssets.toLocaleString(),
            description: `${((data.underMaintenanceAssets / data.totalAssets) * 100).toFixed(1)}%`,
            accent: "var(--warning)",
          },
          {
            label: t.assets.dashboard.utilizationRate,
            value: `${data.utilizationRate.toFixed(1)}%`,
            description: t.assets.dashboard.utilizationDesc,
            accent: "var(--primary-light)",
          },
          {
            label: t.assets.dashboard.expiredWarranties,
            value: data.expiredWarrantyCount.toLocaleString(),
            description: t.assets.dashboard.needsAttention,
            accent: "var(--error)",
          },
          {
            label: t.assets.dashboard.maintenanceRequests,
            value: data.totalMaintenanceRequests.toLocaleString(),
            description: t.assets.dashboard.totalRequests,
            accent: "var(--primary-light)",
          },
        ]}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Asset Type Distribution - Bar Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.assetType}
          </h3>
          {(() => {
            // Convert data to ApexCharts format
            const apexData = convertToApexBarFormat(chartData.assetTypeData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="var(--primary-main)" // Primary brand color
                height={300}
                borderRadius={8}
              />
            );
          })()}
        </Card>

        {/* Status Breakdown - Donut Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.statusBreakdown}
          </h3>
          {(() => {
            // Convert data to ApexCharts donut format
            const apexData = convertToApexDonutFormat(chartData.statusData);

            return (
              <ApexDonutChart
                series={apexData.series}
                labels={apexData.labels}
                height={300}
                // Show total in center for better context
                centerLabel={{
                  value: data.totalAssets,
                  text: t.assets.dashboard.totalAssets,
                }}
              />
            );
          })()}
        </Card>

        {/* Category Distribution - Donut Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.categoryDistribution}
          </h3>
          {(() => {
            const apexData = convertToApexDonutFormat(chartData.categoryData);

            return (
              <ApexDonutChart
                series={apexData.series}
                labels={apexData.labels}
                height={300}
                // Top 8 categories - show count in center
                centerLabel={{
                  value: chartData.categoryData.reduce(
                    (sum, item) => sum + item.value,
                    0,
                  ),
                  text: t.assets.dashboard.charts.categoryDistribution,
                }}
              />
            );
          })()}
        </Card>

        {/* Location Distribution - Donut Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.locationDistribution}
          </h3>
          {(() => {
            const apexData = convertToApexDonutFormat(chartData.locationData);

            return (
              <ApexDonutChart
                series={apexData.series}
                labels={apexData.labels}
                height={300}
              />
            );
          })()}
        </Card>

        {/* Age Group Distribution - Bar Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.ageGroupDistribution}
          </h3>
          {(() => {
            const apexData = convertToApexBarFormat(chartData.ageGroupData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="var(--success)" // Green for age groups
                height={300}
                borderRadius={8}
              />
            );
          })()}
        </Card>

        {/* Value Range Distribution - Bar Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.valueRangeDistribution}
          </h3>
          {(() => {
            const apexData = convertToApexBarFormat(chartData.valueRangeData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="var(--primary-light)" // Purple for value ranges
                height={300}
                borderRadius={8}
              />
            );
          })()}
        </Card>

        {/* Manufacturer Distribution - Bar Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.manufacturerDistribution}
          </h3>
          {(() => {
            const apexData = convertToApexBarFormat(chartData.manufacturerData);

            return (
              <ApexBarChart
                series={apexData.series}
                categories={apexData.categories}
                color="var(--warning)" // Orange for manufacturers
                height={300}
                borderRadius={8}
              />
            );
          })()}
        </Card>

        {/* Monthly Trend - Multi-Line Chart */}
        <Card className="p-5 bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <h3 className="mb-4 text-lg font-semibold">
            {t.assets.dashboard.charts.monthlyTrend}
          </h3>
          {(() => {
            // Define line configurations
            const lines = [
              {
                key: "acquired",
                name: t.assets.dashboard.charts.acquired,
                color: "var(--success)", // Green for acquired
              },
              {
                key: "retired",
                name: t.assets.dashboard.charts.retired,
                color: "var(--error)", // Red for retired
              },
              {
                key: "total",
                name: t.assets.dashboard.charts.total,
                color: "var(--info)", // Blue for total
              },
            ];

            // Convert to ApexCharts format
            const apexData = convertToApexLineFormat(
              chartData.monthlyTrendData,
              "name", // X-axis key (month names)
              lines,
            );

            return (
              <ApexLineChart
                series={apexData.series}
                categories={apexData.categories}
                colors={lines.map((line) => line.color)}
                height={300}
                showMarkers={true} // Show data points for monthly data
                smooth={true} // Smooth curves for better visualization
              />
            );
          })()}
        </Card>
      </div>
    </PageShell>
  );
}
