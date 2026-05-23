/**
 * BarChart Component
 *
 * Professional bar chart component using ApexCharts.
 * Supports single/multiple series, horizontal/vertical orientation, and stacking.
 * Optimized for performance and responsive across all devices.
 *
 * @module charts-apex/BarChart
 * @example
 * ```tsx
 * <BarChart
 *   series={[{ name: 'Sales', data: [100, 200, 300] }]}
 *   categories={['Jan', 'Feb', 'Mar']}
 *   color="#465fff"
 *   height={300}
 * />
 * ```
 */

import React from "react";
import type { BarChartProps } from "./types";
import { getBarChartConfig, DEFAULT_COLORS } from "./config";
import LazyApexChart from "./LazyApexChart";

/**
 * BarChart functional component
 *
 * Design decisions:
 * - Auto-calculates optimal bar width based on data count (prevents too thin/wide bars)
 * - Supports both single color and multi-color modes
 * - Responsive by default through config
 * - Hardware-accelerated animations for smooth rendering
 *
 * Performance optimizations:
 * - React.memo prevents unnecessary re-renders
 * - Border radius only on top (better GPU performance)
 * - Lazy loading of chart library (code splitting)
 */
const BarChart: React.FC<BarChartProps> = React.memo(
  ({
    series,
    categories,
    color,
    colors,
    horizontal = false,
    stacked = false,
    borderRadius = 5,
    columnWidth = "auto",
    height = 300,
    className = "",
  }) => {
    /**
     * Calculate optimal column width based on data count
     * Prevents bars from being too thin or too wide
     *
     * Algorithm:
     * - Few bars (≤5): Wider bars (60%) for better visibility
     * - Medium (6-15): Standard width (39%)
     * - Many (>15): Thinner bars (25%) to fit all
     */
    const calculateColumnWidth = React.useMemo(() => {
      if (columnWidth !== "auto") return columnWidth;

      const dataCount = categories.length;
      if (dataCount <= 5) return "60%";
      if (dataCount <= 15) return "39%";
      return "25%";
    }, [categories.length, columnWidth]);

    /**
     * Determine color palette
     * Priority: colors prop > color prop > default colors
     */
    const chartColors = React.useMemo(() => {
      if (colors && colors.length > 0) return colors;
      if (color) return [color];
      return DEFAULT_COLORS;
    }, [color, colors]);

    /**
     * Compute max value across all series for integer-tick enforcement
     */
    const maxDataValue = React.useMemo(() => {
      return Math.max(
        1,
        ...series.flatMap((s) =>
          s.data.map((v) => (typeof v === "number" ? v : 0)),
        ),
      );
    }, [series]);

    /**
     * Build complete chart configuration
     * Merges base config with component-specific options
     */
    const chartOptions = React.useMemo(() => {
      const baseConfig = getBarChartConfig(categories);
      const baseYAxis = Array.isArray(baseConfig.yaxis)
        ? baseConfig.yaxis[0]
        : baseConfig.yaxis;

      return {
        ...baseConfig,
        colors: chartColors,
        plotOptions: {
          ...baseConfig.plotOptions,
          bar: {
            ...baseConfig.plotOptions?.bar,
            horizontal,
            columnWidth: calculateColumnWidth,
            borderRadius,
            borderRadiusApplication: "end" as const,
          },
        },
        chart: {
          ...baseConfig.chart,
          stacked,
          // Add custom animations for stacked bars
          animations: stacked
            ? {
                enabled: true,
                speed: 800,
                animateGradually: {
                  enabled: true,
                  delay: 150,
                },
              }
            : baseConfig.chart?.animations,
        },
        // Adjust X/Y axis for horizontal mode
        ...(horizontal && {
          xaxis: {
            ...baseConfig.xaxis,
            min: 0,
            // Force only integer tick marks — prevents duplicate labels when values are small
            tickAmount: Math.min(maxDataValue, 10),
            labels: {
              ...baseConfig.xaxis?.labels,
              formatter: (val: string) => {
                // Show only integers — suppress fractional ticks
                const num = parseFloat(val);
                if (!isNaN(num)) {
                  if (num !== Math.floor(num)) return "";
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
                  return num.toFixed(0);
                }
                return val;
              },
            },
          },
          yaxis: {
            ...baseConfig.yaxis,
            labels: {
              ...baseYAxis?.labels,
              style: {
                fontSize: "12px",
                colors: "var(--text-tertiary)",
              },
            },
          },
        }),
      };
    }, [
      categories,
      chartColors,
      horizontal,
      stacked,
      borderRadius,
      calculateColumnWidth,
      maxDataValue,
    ]);

    /**
     * Validate series data
     * Ensures data integrity and prevents rendering errors
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
     * Validate categories match data length
     * Prevents misalignment between labels and data
     */
    const dataLength = series[0]?.data?.length || 0;
    if (categories.length !== dataLength) {
      console.warn(
        `BarChart: Categories length (${categories.length}) does not match data length (${dataLength})`,
      );
    }

    return (
      <div className={`w-full ${className}`}>
        {/* 
          Chart component from react-apexcharts
          - type="bar" for bar chart rendering
          - height prop for responsive sizing
          - options/series for data and configuration
        */}
        <LazyApexChart
          options={chartOptions}
          series={series}
          type="bar"
          height={height}
        />
      </div>
    );
  },
);

// Display name for React DevTools
BarChart.displayName = "BarChart";

export default BarChart;

