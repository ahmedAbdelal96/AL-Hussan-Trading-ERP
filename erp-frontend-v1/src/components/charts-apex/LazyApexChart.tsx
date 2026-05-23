import React, { Suspense } from "react";
import type { ApexOptions } from "apexcharts";

const ApexChart = React.lazy(() => import("react-apexcharts"));

type ApexChartType =
  | "line"
  | "area"
  | "bar"
  | "pie"
  | "donut"
  | "radar"
  | "scatter"
  | "bubble";

interface LazyApexChartProps {
  options: ApexOptions;
  series: unknown;
  type: ApexChartType;
  height?: number | string;
  className?: string;
}

/**
 * Shared lazy wrapper for ApexCharts renderer.
 * Keeps heavy chart runtime out of eagerly loaded chunks.
 */
const LazyApexChart: React.FC<LazyApexChartProps> = ({
  options,
  series,
  type,
  height = 300,
  className,
}) => {
  return (
    <Suspense
      fallback={
        <div
          className={`w-full animate-pulse rounded-md bg-muted/40 ${className ?? ""}`}
          style={{ height }}
        />
      }
    >
      <ApexChart options={options} series={series} type={type} height={height} />
    </Suspense>
  );
};

export default LazyApexChart;
