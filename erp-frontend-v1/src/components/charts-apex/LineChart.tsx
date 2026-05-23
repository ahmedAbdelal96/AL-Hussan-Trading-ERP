/**
 * LineChart Component
 *
 * Professional line chart component using ApexCharts.
 * Perfect for displaying trends over time with smooth curves and optional area fills.
 * Supports multiple data series with automatic color assignment.
 *
 * @module charts-apex/LineChart
 * @example
 * ```tsx
 * <LineChart
 *   series={[
 *     { name: 'Sales', data: [100, 200, 300] },
 *     { name: 'Revenue', data: [80, 180, 250] }
 *   ]}
 *   categories={['Jan', 'Feb', 'Mar']}
 *   smooth
 *   showArea
 * />
 * ```
 */

import React from "react";
import type { LineChartProps } from "./types";
import { getLineChartConfig, DEFAULT_COLORS } from "./config";
import LazyApexChart from "./LazyApexChart";

/**
 * LineChart functional component
 *
 * Design decisions:
 * - Smooth curves by default (more aesthetically pleasing)
 * - Markers hidden until hover (reduces visual clutter)
 * - Optional area fill with gradient (improves data visualization)
 * - Auto-scaling Y-axis based on data range
 *
 * Performance optimizations:
 * - React.memo prevents re-renders when props unchanged
 * - useMemo for expensive calculations
 * - Hardware-accelerated animations
 * - Efficient SVG rendering by ApexCharts
 */
const LineChart: React.FC<LineChartProps> = React.memo(
  ({
    series,
    categories,
    colors,
    smooth = true,
    showMarkers = false,
    showArea = false,
    height = 300,
    className = "",
  }) => {
    /**
     * Determine color palette for lines
     * Uses default colors if none provided
     */
    const chartColors = React.useMemo(() => {
      return colors && colors.length > 0 ? colors : DEFAULT_COLORS;
    }, [colors]);

    /**
     * Calculate line stroke width based on series count
     * More series = thinner lines to reduce visual clutter
     */
    const strokeWidth = React.useMemo(() => {
      if (series.length === 1) return 2.5; // Single line can be thicker
      if (series.length <= 3) return 2; // Standard width for 2-3 lines
      return 1.5; // Thinner for many lines
    }, [series.length]);

    /**
     * Build chart configuration
     * Dynamically adjusts based on props
     */
    const chartOptions = React.useMemo(
      () =>
        getLineChartConfig(categories, {
          colors: chartColors,
          stroke: {
            curve: smooth ? "smooth" : "straight",
            width: strokeWidth,
            lineCap: "round", // Rounded line ends for better aesthetics
          },
          markers: {
            size: showMarkers ? 4 : 0, // Show or hide markers
            strokeColors: "var(--surface)",
            strokeWidth: 2,
            hover: {
              size: 6, // Always show on hover
              sizeOffset: 3,
            },
            discrete: [], // Can be used for highlighting specific points
          },
          // Area fill configuration (only if showArea is true)
          fill: showArea
            ? {
                type: "gradient",
                gradient: {
                  opacityFrom: 0.55,
                  opacityTo: 0,
                  shadeIntensity: 1,
                  type: "vertical",
                  stops: [0, 90, 100],
                },
              }
            : {
                type: "solid",
                opacity: 1,
              },
          // Enhanced tooltip for better UX
          tooltip: {
            shared: true, // Show all series values in one tooltip
            intersect: false, // Tooltip follows cursor
            y: {
              formatter: (val: number) => {
                if (val >= 1000000) {
                  return `${(val / 1000000).toFixed(2)}M`;
                }
                if (val >= 1000) {
                  return `${(val / 1000).toFixed(2)}K`;
                }
                return val.toLocaleString();
              },
            },
          },
          // Y-axis configuration with smart min/max
          yaxis: {
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
            // Auto-scale with padding for better visualization
            min: undefined, // Let ApexCharts calculate
            max: undefined,
          },
        }),
      [categories, chartColors, smooth, showMarkers, showArea, strokeWidth],
    );

    /**
     * Validate series data
     * Prevents rendering errors with invalid data
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
     * Validate data consistency
     * All series should have same length as categories
     */
    const expectedLength = categories.length;
    const hasInconsistentData = series.some(
      (s) => s.data.length !== expectedLength,
    );

    if (hasInconsistentData) {
      console.warn(
        "LineChart: Some series have inconsistent data length with categories",
        {
          expectedLength,
          seriesLengths: series.map((s) => s.data.length),
        },
      );
    }

    /**
     * Check for null/undefined values in data
     * ApexCharts handles these gracefully by creating gaps
     */
    const hasNullValues = series.some((s) =>
      s.data.some((val) => val === null || val === undefined),
    );

    if (hasNullValues) {
      console.info(
        "LineChart: Data contains null/undefined values - gaps will appear in the chart",
      );
    }

    return (
      <div className={`w-full ${className}`}>
        {/* 
          Chart component renders as line or area based on showArea prop
          - type="area" when showArea is true (filled under line)
          - type="line" when showArea is false (just line)
        */}
        <LazyApexChart
          options={chartOptions}
          series={series}
          type={showArea ? "area" : "line"}
          height={height}
        />
      </div>
    );
  },
);

// Display name for React DevTools
LineChart.displayName = "LineChart";

export default LineChart;

