/**
 * MixedChart Component
 *
 * Advanced chart component that combines multiple chart types (bar, line, area) in one visualization.
 * Perfect for comparing different metrics with different scales or showing correlations.
 *
 * @module charts-apex/MixedChart
 * @example
 * ```tsx
 * <MixedChart
 *   series={[
 *     { name: 'Revenue', type: 'column', data: [100, 200, 300] },
 *     { name: 'Profit %', type: 'line', data: [10, 15, 20] }
 *   ]}
 *   categories={['Jan', 'Feb', 'Mar']}
 * />
 * ```
 */

import React from "react";
import type { MixedChartProps } from "./types";
import { getBaseChartConfig, DEFAULT_COLORS } from "./config";
import LazyApexChart from "./LazyApexChart";

/**
 * MixedChart functional component
 *
 * Design decisions:
 * - Supports column, line, and area types in one chart
 * - Auto-scales Y-axis for different data ranges
 * - Color-codes different series automatically
 * - Shared tooltip shows all values at once
 *
 * Use cases:
 * - Revenue (bars) vs Profit Margin (line)
 * - Sales Volume (bars) vs Growth Rate (line)
 * - Multiple KPIs with different units
 *
 * Performance optimizations:
 * - React.memo prevents unnecessary re-renders
 * - Efficient rendering of mixed chart types
 * - Hardware-accelerated animations
 */
const MixedChart: React.FC<MixedChartProps> = React.memo(
  ({ series, categories, colors, height = 300, className = "" }) => {
    /**
     * Determine color palette
     * Assigns unique color to each series
     */
    const chartColors = React.useMemo(() => {
      if (colors && colors.length > 0) return colors;

      // Ensure we have enough colors for all series
      if (series.length > DEFAULT_COLORS.length) {
        const repeatedColors: string[] = [];
        for (let i = 0; i < series.length; i++) {
          repeatedColors.push(DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
        }
        return repeatedColors;
      }

      return DEFAULT_COLORS;
    }, [colors, series.length]);

    /**
     * Detect if we need dual Y-axes
     * If data ranges are very different (>10x), use two axes
     */
    const needsDualAxis = React.useMemo(() => {
      if (series.length < 2) return false;

      // Calculate min and max for each series
      const ranges = series.map((s) => {
        const values = s.data.filter((v) => v !== null && v !== undefined);
        return {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      });

      // Check if any two series have very different ranges
      for (let i = 0; i < ranges.length - 1; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
          const ratio = ranges[i].max / ranges[j].max;
          if (ratio > 10 || ratio < 0.1) {
            return true;
          }
        }
      }

      return false;
    }, [series]);

    /**
     * Build chart configuration
     * Handles mixed chart types and dual axes if needed
     */
    const chartOptions = React.useMemo(
      () => ({
        ...getBaseChartConfig(),
        colors: chartColors,
        chart: {
          ...getBaseChartConfig().chart,
          type: "line" as const, // Base type (mixed types defined in series)
          stacked: false,
        },
        stroke: {
          width: series.map((s) => (s.type === "column" ? 0 : 2)), // No stroke for columns
          curve: "smooth" as const,
          lineCap: "round" as const,
        },
        plotOptions: {
          bar: {
            columnWidth: "50%",
            borderRadius: 5,
            borderRadiusApplication: "end" as const,
          },
        },
        fill: {
          opacity: series.map((s) => (s.type === "area" ? 0.5 : 1)),
          type: series.map((s) => (s.type === "area" ? "gradient" : "solid")),
          gradient: {
            opacityFrom: 0.55,
            opacityTo: 0,
          },
        },
        xaxis: {
          categories,
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            style: {
              fontSize: "12px",
              colors: "var(--text-tertiary)",
            },
          },
        },
        // Y-axis configuration
        yaxis: needsDualAxis
          ? [
              // Primary Y-axis (left)
              {
                seriesName: series[0]?.name,
                labels: {
                  style: {
                    fontSize: "12px",
                    colors: chartColors[0],
                  },
                  formatter: (val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
                    return val.toFixed(0);
                  },
                },
                title: {
                  text: series[0]?.name,
                  style: {
                    color: chartColors[0],
                    fontSize: "12px",
                    fontWeight: 600,
                  },
                },
              },
              // Secondary Y-axis (right)
              {
                opposite: true,
                seriesName: series[1]?.name,
                labels: {
                  style: {
                    fontSize: "12px",
                    colors: chartColors[1],
                  },
                  formatter: (val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
                    return val.toFixed(0);
                  },
                },
                title: {
                  text: series[1]?.name,
                  style: {
                    color: chartColors[1],
                    fontSize: "12px",
                    fontWeight: 600,
                  },
                },
              },
            ]
          : // Single Y-axis
            {
              labels: {
                style: {
                  fontSize: "12px",
                  colors: "var(--text-tertiary)",
                },
                formatter: (val: number) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
                  return val.toFixed(0);
                },
              },
            },
        // Enhanced tooltip for mixed charts
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: (val: number) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
              if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
              return val.toLocaleString();
            },
          },
        },
        legend: {
          show: true,
          position: "top" as const,
          horizontalAlign: "left" as const,
          markers: {
            size: 12,
          },
          itemMargin: {
            horizontal: 10,
          },
        },
        markers: {
          size: series.map((s) => (s.type === "line" ? 0 : 0)), // Hidden by default
          hover: {
            size: 6,
          },
        },
      }),
      [categories, chartColors, series, needsDualAxis],
    );

    /**
     * Validate series data
     */
    if (!series || series.length === 0) {
      return (
        <div
          className={`flex items-center justify-center bg-[var(--surface-secondary)] rounded-lg ${className}`}
          style={{ height }}
        >
          <p className="text-sm text-[var(--text-tertiary)]">No data available</p>
        </div>
      );
    }

    /**
     * Validate chart types
     * Only 'column', 'line', and 'area' are supported
     */
    const validTypes = ["column", "line", "area"];
    const invalidSeries = series.filter((s) => !validTypes.includes(s.type));

    if (invalidSeries.length > 0) {
      console.error("MixedChart: Invalid chart type(s) detected", {
        invalidSeries: invalidSeries.map((s) => ({
          name: s.name,
          type: s.type,
        })),
        validTypes,
      });
    }

    /**
     * Validate data length consistency
     */
    const expectedLength = categories.length;
    const inconsistentSeries = series.filter(
      (s) => s.data.length !== expectedLength,
    );

    if (inconsistentSeries.length > 0) {
      console.error("MixedChart: Some series have inconsistent data length", {
        expectedLength,
        inconsistentSeries: inconsistentSeries.map((s) => ({
          name: s.name,
          length: s.data.length,
        })),
      });
    }

    /**
     * Info message about dual axis
     */
    if (needsDualAxis) {
      console.info(
        "MixedChart: Using dual Y-axes due to different data ranges",
      );
    }

    return (
      <div className={`w-full ${className}`}>
        {/* 
          ApexCharts mixed chart
          - type="line" as base (actual types in series)
          - Each series specifies its own type
          - Can combine column, line, and area
        */}
        <LazyApexChart
          options={chartOptions}
          series={series}
          type="line"
          height={height}
        />
      </div>
    );
  },
);

// Display name for React DevTools
MixedChart.displayName = "MixedChart";

export default MixedChart;

