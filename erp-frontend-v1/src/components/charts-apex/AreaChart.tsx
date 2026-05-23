/**
 * AreaChart Component
 *
 * Professional area chart component using ApexCharts.
 * Similar to LineChart but with filled areas under the curves.
 * Ideal for showing cumulative data, volume over time, or stacked series.
 *
 * @module charts-apex/AreaChart
 * @example
 * ```tsx
 * <AreaChart
 *   series={[
 *     { name: 'Product A', data: [100, 200, 300] },
 *     { name: 'Product B', data: [150, 180, 250] }
 *   ]}
 *   categories={['Jan', 'Feb', 'Mar']}
 *   stacked
 * />
 * ```
 */

import React from "react";
import type { AreaChartProps } from "./types";
import { getAreaChartConfig, DEFAULT_COLORS } from "./config";
import LazyApexChart from "./LazyApexChart";

/**
 * AreaChart functional component
 *
 * Design decisions:
 * - Gradient fill by default (visually appealing)
 * - Stacking support for cumulative visualization
 * - Smooth curves for professional appearance
 * - Optimized opacity for overlapping areas
 *
 * Performance optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - GPU-accelerated gradient rendering
 * - Efficient data processing with useMemo
 */
const AreaChart: React.FC<AreaChartProps> = React.memo(
  ({
    series,
    categories,
    colors,
    stacked = false,
    height = 300,
    className = "",
  }) => {
    /**
     * Determine color palette
     * Cycles through default colors if more series than colors provided
     */
    const chartColors = React.useMemo(() => {
      if (colors && colors.length > 0) return colors;

      // If we have more series than default colors, repeat colors
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
     * Calculate optimal gradient opacity based on series count
     * More series = lower opacity to prevent visual overload
     */
    const gradientOpacity = React.useMemo(() => {
      if (stacked) {
        // Stacked areas need higher opacity
        return { from: 0.7, to: 0.1 };
      }

      // Overlapping areas need adjusted opacity
      if (series.length === 1) return { from: 0.6, to: 0 };
      if (series.length === 2) return { from: 0.5, to: 0 };
      return { from: 0.4, to: 0 }; // Lower for 3+ series
    }, [series.length, stacked]);

    /**
     * Build chart configuration
     * Merges base config with area-specific options
     */
    const chartOptions = React.useMemo(
      () =>
        getAreaChartConfig(categories, {
          colors: chartColors,
          chart: {
            stacked,
            // Enhanced animations for stacked areas
            animations: {
              enabled: true,
              speed: 800,
              animateGradually: {
                enabled: true,
                delay: stacked ? 200 : 150, // Slower for stacked
              },
            },
          },
          stroke: {
            curve: "smooth",
            width: 2,
            lineCap: "round",
          },
          fill: {
            type: "gradient",
            gradient: {
              opacityFrom: gradientOpacity.from,
              opacityTo: gradientOpacity.to,
              shadeIntensity: 1,
              type: "vertical",
              stops: [0, 90, 100],
            },
          },
          markers: {
            size: 0, // Hidden by default
            strokeColors: "var(--surface)",
            strokeWidth: 2,
            hover: {
              size: 5,
              sizeOffset: 3,
            },
          },
          // Enhanced tooltip for area charts
          tooltip: {
            shared: true,
            intersect: false,
            y: {
              formatter: (
                val: number,
                opts?: {
                  dataPointIndex: number;
                  globals: { stackedSeriesTotals: number[] };
                },
              ) => {
                // Format value
                const formatted =
                  val >= 1000000
                    ? `${(val / 1000000).toFixed(2)}M`
                    : val >= 1000
                      ? `${(val / 1000).toFixed(2)}K`
                      : val.toLocaleString();

                // For stacked charts, show percentage
                if (stacked && opts?.globals?.stackedSeriesTotals) {
                  const total =
                    opts.globals.stackedSeriesTotals[opts.dataPointIndex];
                  const percentage = ((val / total) * 100).toFixed(1);
                  return `${formatted} (${percentage}%)`;
                }

                return formatted;
              },
            },
          },
          // Y-axis with appropriate formatting
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
            // For stacked charts, ensure Y-axis starts at 0
            min: stacked ? 0 : undefined,
          },
          // Legend configuration
          legend: {
            show: series.length > 1, // Hide legend for single series
            position: "top",
            horizontalAlign: "left",
            markers: {
              size: 12,
            },
            itemMargin: {
              horizontal: 10,
            },
          },
        }),
      [categories, chartColors, stacked, gradientOpacity, series.length],
    );

    /**
     * Validate series data
     * Ensures data integrity
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
     * Check if all series have correct length
     */
    const expectedLength = categories.length;
    const invalidSeries = series.filter(
      (s) => s.data.length !== expectedLength,
    );

    if (invalidSeries.length > 0) {
      console.error("AreaChart: Some series have incorrect data length", {
        expectedLength,
        invalidSeries: invalidSeries.map((s) => ({
          name: s.name,
          length: s.data.length,
        })),
      });
    }

    /**
     * Check for negative values in stacked mode
     * Stacked area charts don't work well with negative values
     */
    if (stacked) {
      const hasNegativeValues = series.some((s) =>
        s.data.some((val) => val < 0),
      );

      if (hasNegativeValues) {
        console.warn(
          "AreaChart: Stacked area charts may not display negative values correctly. Consider using non-stacked mode.",
        );
      }
    }

    return (
      <div className={`w-full ${className}`}>
        {/* 
          ApexCharts area chart
          - Always renders as type="area"
          - Stacking controlled via chart.stacked option
          - Gradient fill applied automatically
        */}
        <LazyApexChart
          options={chartOptions}
          series={series}
          type="area"
          height={height}
        />
      </div>
    );
  },
);

// Display name for React DevTools
AreaChart.displayName = "AreaChart";

export default AreaChart;

