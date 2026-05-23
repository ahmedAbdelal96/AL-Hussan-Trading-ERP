/**
 * ApexCharts Configuration System
 *
 * Centralized configuration for all chart components.
 * Provides consistent styling, colors, and behavior across the application.
 * Based on TailAdmin Dashboard design system.
 *
 * @module charts-apex/config
 */

import type { ApexOptions } from "apexcharts";

const CHART_FONT_FAMILY = "var(--font-ui), sans-serif";
const CHART_NEUTRAL = {
  grid: "var(--border)",
  axisText: "var(--text-tertiary)",
  titleText: "var(--text-primary)",
  subtitleText: "var(--text-secondary)",
  markerStroke: "var(--surface)",
} as const;

const sanitizeChartLabel = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text.length > 0 ? text : "-";
};

/**
 * Professional color palette
 * Carefully selected colors for optimal visual appeal and accessibility
 * Based on TailAdmin Dashboard color scheme
 */
export const CHART_COLORS = {
  /** Primary brand color - used for main data series */
  primary: "#465fff",
  /** Secondary brand color - used for secondary data */
  secondary: "#9CB9FF",
  /** Success/positive state color */
  success: "#22c55e",
  /** Warning/caution state color */
  warning: "#f59e0b",
  /** Danger/error state color */
  danger: "#ef4444",
  /** Info/neutral state color */
  info: "#3b82f6",
  /** Purple accent color */
  purple: "#a855f7",
  /** Pink accent color */
  pink: "#ec4899",
  /** Cyan accent color */
  cyan: "#06b6d4",
  /** Orange accent color */
  orange: "#f97316",
} as const;

/**
 * Default color array for multi-series charts
 * Provides good visual contrast between different data series
 */
export const DEFAULT_COLORS: string[] = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.orange,
];

/**
 * Base chart configuration
 * Shared settings for all chart types to maintain consistency
 *
 * Design decisions:
 * - Toolbar hidden to reduce clutter (export functionality can be added separately)
 * - Zoom disabled by default (can be enabled per chart if needed)
 * - Grid lines subtle to avoid visual noise
 * - Responsive breakpoints optimized for mobile, tablet, desktop
 *
 * @returns Base ApexOptions configuration object
 */
export const getBaseChartConfig = (): ApexOptions => ({
  chart: {
    fontFamily: CHART_FONT_FAMILY,
    toolbar: {
      show: false, // Hidden by default - cleaner look
    },
    zoom: {
      enabled: false, // Disabled to prevent accidental zooming
    },
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
  dataLabels: {
    enabled: false, // Disabled by default - reduces clutter
  },
  stroke: {
    curve: "smooth", // Smooth curves for better aesthetics
    width: 2,
  },
  grid: {
    borderColor: CHART_NEUTRAL.grid,
    strokeDashArray: 4, // Dashed lines - less intrusive
    xaxis: {
      lines: {
        show: false, // Vertical lines hidden - cleaner look
      },
    },
    yaxis: {
      lines: {
        show: true, // Horizontal lines shown - help read values
      },
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 10,
    },
  },
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left",
    fontFamily: CHART_FONT_FAMILY,
    fontSize: "13px",
    fontWeight: 500,
    offsetY: 0,
    markers: {
      size: 12,
    },
    itemMargin: {
      horizontal: 8,
      vertical: 0,
    },
  },
  tooltip: {
    enabled: true,
    theme: "light",
    style: {
      fontSize: "12px",
      fontFamily: CHART_FONT_FAMILY,
    },
    x: {
      show: true,
    },
    y: {
      formatter: (val: number) => {
        // Format numbers with thousand separators
        return val.toLocaleString();
      },
    },
    marker: {
      show: true,
    },
  },
  // Responsive configuration for different screen sizes
  responsive: [
    {
      // Mobile devices (< 640px)
      breakpoint: 640,
      options: {
        chart: {
          height: 250,
        },
        xaxis: {
          labels: {
            style: {
              fontSize: "10px",
            },
            rotate: -45,
            rotateAlways: true,
          },
        },
        yaxis: {
          labels: {
            style: {
              fontSize: "10px",
            },
          },
        },
        legend: {
          position: "bottom",
          fontSize: "11px",
        },
      },
    },
    {
      // Tablet devices (640px - 1024px)
      breakpoint: 1024,
      options: {
        chart: {
          height: 280,
        },
        xaxis: {
          labels: {
            style: {
              fontSize: "11px",
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              fontSize: "11px",
            },
          },
        },
      },
    },
  ],
});

/**
 * Bar chart specific configuration
 * Optimized for displaying categorical data with bars
 *
 * Performance note: Border radius applied only to bar tops for better rendering
 *
 * @param categories - X-axis category labels
 * @param options - Additional options to merge with defaults
 * @returns Complete ApexOptions for bar charts
 */
export const getBarChartConfig = (
  categories: string[],
  options?: Partial<ApexOptions>,
): ApexOptions => ({
  ...getBaseChartConfig(),
  chart: {
    ...getBaseChartConfig().chart,
    type: "bar",
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "39%", // Optimal width for most cases - not too thin, not too wide
      borderRadius: 5, // Rounded corners for modern look
      borderRadiusApplication: "end" as const, // Only top corners - better performance
      dataLabels: {
        position: "top" as const,
      },
    },
  },
  xaxis: {
    categories: categories.map(sanitizeChartLabel),
    axisBorder: {
      show: false, // Cleaner look without axis border
    },
    axisTicks: {
      show: false, // No tick marks needed
    },
    labels: {
      style: {
        fontSize: "12px",
        colors: CHART_NEUTRAL.axisText,
      },
      rotate: 0, // No rotation by default
      rotateAlways: false,
      trim: true,
      maxHeight: 120,
    },
  },
  yaxis: {
    labels: {
      style: {
        fontSize: "12px",
        colors: CHART_NEUTRAL.axisText,
      },
      formatter: (val: number | string) => {
        // Convert to number if string
        const numVal = typeof val === "string" ? parseFloat(val) : val;

        // Handle invalid numbers
        if (isNaN(numVal)) return String(val);

        // Smart formatting for large numbers
        if (numVal >= 1000000) {
          return `${(numVal / 1000000).toFixed(1)}M`;
        }
        if (numVal >= 1000) {
          return `${(numVal / 1000).toFixed(1)}K`;
        }
        return numVal.toFixed(0);
      },
    },
  },
  ...options, // Allow overriding any default options
});

/**
 * Line chart specific configuration
 * Perfect for time-series data and trends
 *
 * Design decision: Markers hidden by default to reduce visual clutter
 * They appear on hover for precise value inspection
 *
 * @param categories - X-axis category labels
 * @param options - Additional options to merge with defaults
 * @returns Complete ApexOptions for line charts
 */
export const getLineChartConfig = (
  categories: string[],
  options?: Partial<ApexOptions>,
): ApexOptions => ({
  ...getBaseChartConfig(),
  chart: {
    ...getBaseChartConfig().chart,
    type: "line",
  },
  xaxis: {
    categories: categories.map(sanitizeChartLabel),
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      style: {
        fontSize: "12px",
        colors: CHART_NEUTRAL.axisText,
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        fontSize: "12px",
        colors: CHART_NEUTRAL.axisText,
      },
      formatter: (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
      },
    },
  },
  markers: {
    size: 0, // Hidden by default
    strokeColors: CHART_NEUTRAL.markerStroke,
    strokeWidth: 2,
    hover: {
      size: 6, // Appear on hover
      sizeOffset: 3,
    },
  },
  stroke: {
    curve: "smooth", // Smooth curves for elegant appearance
    width: 2,
  },
  ...options,
});

/**
 * Area chart specific configuration
 * Similar to line chart but with gradient fill
 *
 * Performance optimization: Gradient uses CSS for hardware acceleration
 *
 * @param categories - X-axis category labels
 * @param options - Additional options to merge with defaults
 * @returns Complete ApexOptions for area charts
 */
export const getAreaChartConfig = (
  categories: string[],
  options?: Partial<ApexOptions>,
): ApexOptions => ({
  ...getLineChartConfig(categories),
  chart: {
    ...getBaseChartConfig().chart,
    type: "area",
  },
  fill: {
    type: "gradient",
    gradient: {
      opacityFrom: 0.55, // More opaque at top
      opacityTo: 0, // Transparent at bottom
      shadeIntensity: 1,
      type: "vertical",
      stops: [0, 100],
    },
  },
  stroke: {
    curve: "smooth",
    width: 2,
  },
  ...options,
});

/**
 * Donut chart specific configuration
 * Circular chart with center hole for displaying proportions
 *
 * Design decision: 65% inner radius provides good balance
 * Too small = not visible enough, too large = segments too thin
 *
 * @param labels - Segment labels
 * @param options - Additional options to merge with defaults
 * @returns Complete ApexOptions for donut charts
 */
export const getDonutChartConfig = (
  labels: string[],
  options?: Partial<ApexOptions>,
): ApexOptions => ({
  ...getBaseChartConfig(),
  chart: {
    ...getBaseChartConfig().chart,
    type: "donut",
  },
  labels: labels.map(sanitizeChartLabel),
  plotOptions: {
    pie: {
      donut: {
        size: "65%", // Optimal size for visibility
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: "14px",
            fontWeight: 600,
            color: CHART_NEUTRAL.subtitleText,
            offsetY: -10,
          },
          value: {
            show: true,
            fontSize: "24px",
            fontWeight: 700,
            color: CHART_NEUTRAL.titleText,
            offsetY: 5,
            formatter: (val: string) => {
              // Format the value nicely
              const num = parseFloat(val);
              return num.toLocaleString();
            },
          },
          total: {
            show: true,
            label: "Total",
            fontSize: "14px",
            fontWeight: 600,
            color: CHART_NEUTRAL.axisText,
            formatter: (w: { globals: { seriesTotals: number[] } }) => {
              // Calculate and format total
              const total = w.globals.seriesTotals.reduce(
                (a: number, b: number) => a + b,
                0,
              );
              return total.toLocaleString();
            },
          },
        },
      },
    },
  },
  dataLabels: {
    enabled: false, // Labels in legend instead
  },
  legend: {
    show: true,
    position: "bottom",
    horizontalAlign: "center",
    fontSize: "13px",
    fontWeight: 500,
    offsetY: 0,
    markers: {
      size: 12,
    },
    itemMargin: {
      horizontal: 10,
      vertical: 5,
    },
  },
  ...options,
});

/**
 * Helper function to merge deep ApexOptions objects
 * Handles nested object merging properly
 *
 * @param target - Base options object
 * @param source - Options to merge in
 * @returns Merged options object
 * @internal
 */
export const mergeChartOptions = (
  target: ApexOptions,
  source: Partial<ApexOptions>,
): ApexOptions => {
  return {
    ...target,
    ...source,
    chart: {
      ...target.chart,
      ...source.chart,
    },
    plotOptions: {
      ...target.plotOptions,
      ...source.plotOptions,
    },
    xaxis: {
      ...target.xaxis,
      ...source.xaxis,
    },
    yaxis: {
      ...target.yaxis,
      ...source.yaxis,
    },
  };
};
