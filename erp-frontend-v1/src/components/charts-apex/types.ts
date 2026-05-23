/**
 * ApexCharts Component Types
 *
 * Type definitions for all chart components in the system.
 * These types ensure type safety and provide IntelliSense support.
 *
 * @module charts-apex/types
 */

/**
 * Base props shared by all chart components
 * Provides common configuration options for styling and sizing
 */
export interface BaseChartProps {
  /** Chart height in pixels (default: 300) */
  height?: number;
  /** Additional CSS classes for the wrapper div */
  className?: string;
}

/**
 * BarChart component props
 * Supports both single and multiple bar series with extensive customization
 *
 * @example
 * ```tsx
 * <BarChart
 *   series={[{ name: 'Sales', data: [100, 200, 300] }]}
 *   categories={['Jan', 'Feb', 'Mar']}
 *   color="#465fff"
 * />
 * ```
 */
export interface BarChartProps extends BaseChartProps {
  /** Data series to display. Each series represents a set of bars */
  series: Array<{ name: string; data: number[] }>;
  /** Category labels for the X-axis */
  categories: string[];
  /** Single color for all bars (overridden by colors prop) */
  color?: string;
  /** Multiple colors for different series */
  colors?: string[];
  /** Render bars horizontally instead of vertically (default: false) */
  horizontal?: boolean;
  /** Stack bars on top of each other (default: false) */
  stacked?: boolean;
  /** Border radius for bar tops in pixels (default: 5) */
  borderRadius?: number;
  /** Width of bars as percentage (default: '39%' for optimal spacing) */
  columnWidth?: string;
}

/**
 * LineChart component props
 * Ideal for showing trends over time with optional area fills
 *
 * @example
 * ```tsx
 * <LineChart
 *   series={[
 *     { name: 'Sales', data: [100, 200, 300] },
 *     { name: 'Expenses', data: [80, 150, 200] }
 *   ]}
 *   categories={['Jan', 'Feb', 'Mar']}
 *   smooth
 *   showArea
 * />
 * ```
 */
export interface LineChartProps extends BaseChartProps {
  /** Data series to display. Multiple series create multi-line charts */
  series: Array<{ name: string; data: number[] }>;
  /** Category labels for the X-axis */
  categories: string[];
  /** Color palette for multiple lines */
  colors?: string[];
  /** Use smooth curves instead of straight lines (default: true) */
  smooth?: boolean;
  /** Show marker dots on data points (default: false) */
  showMarkers?: boolean;
  /** Fill area under the line with gradient (default: false) */
  showArea?: boolean;
}

/**
 * AreaChart component props
 * Similar to LineChart but with filled areas by default
 * Perfect for showing cumulative data or volume over time
 *
 * @example
 * ```tsx
 * <AreaChart
 *   series={[{ name: 'Revenue', data: [100, 200, 300] }]}
 *   categories={['Jan', 'Feb', 'Mar']}
 *   stacked
 * />
 * ```
 */
export interface AreaChartProps extends BaseChartProps {
  /** Data series to display with filled areas */
  series: Array<{ name: string; data: number[] }>;
  /** Category labels for the X-axis */
  categories: string[];
  /** Color palette for multiple areas */
  colors?: string[];
  /** Stack areas on top of each other (default: false) */
  stacked?: boolean;
}

/**
 * DonutChart component props
 * Circular chart with center hole, ideal for showing proportions
 * Includes center label support for displaying totals
 *
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
export interface DonutChartProps extends BaseChartProps {
  /** Numeric values for each segment */
  series: number[];
  /** Labels for each segment */
  labels: string[];
  /** Color palette for segments */
  colors?: string[];
  /** Show legend below the chart (default: true) */
  showLegend?: boolean;
  /** Display custom label in the center of the donut */
  centerLabel?: {
    /** The main value to display (number or formatted string) */
    value: string | number;
    /** Descriptive text below the value */
    text: string;
  };
}

/**
 * MixedChart component props
 * Combines different chart types (bar, line, area) in a single chart
 * Useful for comparing different metrics with different scales
 *
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
export interface MixedChartProps extends BaseChartProps {
  /** Array of series with different chart types */
  series: Array<{
    /** Display name for the series */
    name: string;
    /** Chart type for this series */
    type: "column" | "line" | "area";
    /** Data values for this series */
    data: number[];
  }>;
  /** Category labels for the X-axis */
  categories: string[];
  /** Color palette for different series */
  colors?: string[];
}

/**
 * Helper type for data transformation
 * Used to convert legacy Recharts format to ApexCharts format
 *
 * @internal
 */
export interface LegacyChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

/**
 * Converted data format for ApexCharts
 *
 * @internal
 */
export interface ConvertedChartData {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
}
