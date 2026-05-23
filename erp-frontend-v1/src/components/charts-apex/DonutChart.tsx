/**
 * DonutChart Component
 *
 * Professional donut chart component using ApexCharts.
 * Circular chart with center hole, perfect for displaying proportions and percentages.
 * Features customizable center label, interactive legend, and responsive design.
 *
 * @module charts-apex/DonutChart
 * @example
 * ```tsx
 * <DonutChart
 *   series={[44, 55, 13, 33]}
 *   labels={['Active', 'Inactive', 'Pending', 'Archived']}
 *   centerLabel={{ value: 145, text: 'Total Assets' }}
 *   showLegend
 * />
 * ```
 */

import React from "react";
import type { DonutChartProps } from "./types";
import { getDonutChartConfig, DEFAULT_COLORS } from "./config";
import LazyApexChart from "./LazyApexChart";

/**
 * DonutChart functional component
 *
 * Design decisions:
 * - 65% inner radius (optimal balance between visibility and segment thickness)
 * - Center label shows total or custom metric
 * - Legend positioned below chart for better mobile experience
 * - Interactive hover effects with smooth transitions
 *
 * Performance optimizations:
 * - React.memo prevents re-renders on parent changes
 * - Memoized calculations for total and percentages
 * - Hardware-accelerated SVG animations
 */
const DonutChart: React.FC<DonutChartProps> = React.memo(
  ({
    series,
    labels,
    colors,
    showLegend = true,
    centerLabel,
    height = 300,
    className = "",
  }) => {
    /**
     * Calculate total value
     * Used for center label and percentage calculations
     */
    const total = React.useMemo(() => {
      return series.reduce((sum, val) => sum + val, 0);
    }, [series]);

    /**
     * Determine color palette
     * Ensures enough colors for all segments
     */
    const chartColors = React.useMemo(() => {
      if (colors && colors.length > 0) return colors;

      // If we need more colors than available, repeat the palette
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
     * Calculate percentages for each segment
     * Used in tooltips and validation
     */
    const percentages = React.useMemo(() => {
      return series.map((value) => ((value / total) * 100).toFixed(1));
    }, [series, total]);

    /**
     * Build chart configuration
     * Includes center label if provided
     */
    const chartOptions = React.useMemo(
      () =>
        getDonutChartConfig(labels, {
          colors: chartColors,
          legend: {
            show: showLegend,
            position: "bottom",
            horizontalAlign: "center",
            fontSize: "13px",
            fontWeight: 500,
            markers: {
              size: 12,
            },
            itemMargin: {
              horizontal: 10,
              vertical: 5,
            },
            // Custom legend formatter to show values
            formatter: (seriesName: string, opts: { seriesIndex: number }) => {
              const value = series[opts.seriesIndex];
              const percentage = percentages[opts.seriesIndex];
              return `${seriesName}: ${value.toLocaleString()} (${percentage}%)`;
            },
          },
          plotOptions: {
            pie: {
              donut: {
                size: "65%",
                labels: {
                  show: true,
                  name: {
                    show: true,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    offsetY: -10,
                  },
                  value: {
                    show: true,
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    offsetY: 5,
                    formatter: (val: string) => {
                      const num = parseFloat(val);
                      return num.toLocaleString();
                    },
                  },
                  total: {
                    show: true,
                    showAlways: true,
                    // Use custom center label if provided
                    label: centerLabel?.text || "Total",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
                    formatter: centerLabel
                      ? () => centerLabel.value.toString()
                      : (w: { globals: { seriesTotals: number[] } }) => {
                          const sum = w.globals.seriesTotals.reduce(
                            (a: number, b: number) => a + b,
                            0,
                          );
                          return sum.toLocaleString();
                        },
                  },
                },
              },
              // Expand segment slightly on hover
              expandOnClick: true,
            },
          },
          dataLabels: {
            enabled: false, // Labels shown in legend instead
          },
          // Enhanced tooltip
          tooltip: {
            enabled: true,
            y: {
              formatter: (val: number, opts: { seriesIndex: number }) => {
                const percentage = percentages[opts.seriesIndex];
                return `${val.toLocaleString()} (${percentage}%)`;
              },
            },
          },
          // Smooth animations
          chart: {
            animations: {
              enabled: true,
              speed: 800,
              animateGradually: {
                enabled: true,
                delay: 150,
              },
              dynamicAnimation: {
                enabled: true,
                speed: 350,
              },
            },
          },
        }),
      [labels, chartColors, showLegend, centerLabel, series, percentages],
    );

    /**
     * Validate series and labels
     * Must have matching lengths
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

    if (series.length !== labels.length) {
      console.error("DonutChart: Series and labels must have the same length", {
        seriesLength: series.length,
        labelsLength: labels.length,
      });
      return (
        <div
          className={`flex items-center justify-center bg-red-50 rounded-lg ${className}`}
          style={{ height }}
        >
          <p className="text-sm text-red-600">
            Invalid data: Series and labels length mismatch
          </p>
        </div>
      );
    }

    /**
     * Check for negative values
     * Donut charts don't support negative values
     */
    const hasNegativeValues = series.some((val) => val < 0);
    if (hasNegativeValues) {
      console.error(
        "DonutChart: Cannot display negative values in donut chart",
        { series },
      );
      return (
        <div
          className={`flex items-center justify-center bg-red-50 rounded-lg ${className}`}
          style={{ height }}
        >
          <p className="text-sm text-red-600">
            Invalid data: Negative values not supported
          </p>
        </div>
      );
    }

    /**
     * Check for all-zero values
     * No segments would be visible
     */
    if (total === 0) {
      return (
        <div
          className={`flex items-center justify-center bg-[var(--surface-secondary)] rounded-lg ${className}`}
          style={{ height }}
        >
          <p className="text-sm text-[var(--text-tertiary)]">
            No data to display (all values are zero)
          </p>
        </div>
      );
    }

    /**
     * Warn about very small segments
     * Segments < 2% may be hard to see/click
     */
    const smallSegments = percentages.filter((p) => parseFloat(p) < 2);
    if (smallSegments.length > 0) {
      console.info(
        `DonutChart: ${smallSegments.length} segment(s) are very small (< 2%). Consider grouping into "Others".`,
      );
    }

    return (
      <div className={`w-full ${className}`}>
        {/* 
          ApexCharts donut chart
          - type="donut" creates donut shape with center hole
          - series contains numeric values
          - labels shown in legend and tooltips
        */}
        <LazyApexChart
          options={chartOptions}
          series={series}
          type="donut"
          height={height}
        />
      </div>
    );
  },
);

// Display name for React DevTools
DonutChart.displayName = "DonutChart";

export default DonutChart;

