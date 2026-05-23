/**
 * ApexCharts Component Exports
 *
 * Central export file for all chart components.
 * Provides clean imports for consuming components.
 *
 * @module charts-apex
 * @example
 * ```tsx
 * import { BarChart, LineChart, DonutChart } from '@/components/charts-apex';
 * ```
 */

// Chart Components
export { default as BarChart } from "./BarChart";
export { default as LineChart } from "./LineChart";
export { default as AreaChart } from "./AreaChart";
export { default as DonutChart } from "./DonutChart";
export { default as MixedChart } from "./MixedChart";

// Types
export type {
  BaseChartProps,
  BarChartProps,
  LineChartProps,
  AreaChartProps,
  DonutChartProps,
  MixedChartProps,
  LegacyChartData,
  ConvertedChartData,
} from "./types";

// Configuration & Colors
export {
  CHART_COLORS,
  DEFAULT_COLORS,
  getBaseChartConfig,
  getBarChartConfig,
  getLineChartConfig,
  getAreaChartConfig,
  getDonutChartConfig,
  mergeChartOptions,
} from "./config";
