import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ReportSummaryMetric {
  label: string;
  value: string | number;
  /** Optional sub-label (e.g. units, date range) */
  sub?: string;
  /** Optional accent color class for the value */
  valueClassName?: string;
}

interface ReportSummaryStripProps {
  metrics: ReportSummaryMetric[];
  /** Optional title shown at the start of the strip */
  title?: string;
  /** Optional extra content on the trailing end (e.g. export button) */
  trailing?: ReactNode;
  className?: string;
}

/**
 * ReportSummaryStrip — a single horizontal band of key aggregate
 * figures displayed at the top of report pages.
 *
 * Keeps the user aware of totals while they scroll through detail rows.
 *
 * @example
 * <ReportSummaryStrip
 *   title="Payroll Summary"
 *   metrics={[
 *     { label: "Employees", value: "240" },
 *     { label: "Total Net", value: "SAR 1,250,000", valueClassName: "text-green-600" },
 *   ]}
 *   trailing={<ExportButton />}
 * />
 */
export const ReportSummaryStrip = ({
  metrics,
  title,
  trailing,
  className,
}: ReportSummaryStripProps) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0 rounded-md border border-border bg-[var(--surface)] overflow-hidden",
        className,
      )}
    >
      {/* Optional title cell */}
      {title && (
        <div className="flex items-center px-4 py-2.5 border-e border-border shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            {title}
          </span>
        </div>
      )}

      {/* Metric cells */}
      {metrics.map((m, i) => (
        <div
          key={i}
          className="flex flex-col justify-center px-4 py-2.5 border-e border-border last:border-e-0 min-w-[100px]"
        >
          <span className="text-[0.68rem] font-medium uppercase tracking-wide text-[var(--text-tertiary)] whitespace-nowrap">
            {m.label}
          </span>
          <span
            className={cn(
              "text-sm font-bold text-[var(--text-primary)] leading-tight mt-0.5",
              m.valueClassName,
            )}
          >
            {m.value}
          </span>
          {m.sub && (
            <span className="text-[0.65rem] text-[var(--text-tertiary)] mt-0.5">
              {m.sub}
            </span>
          )}
        </div>
      ))}

      {/* Trailing content (pushed to end) */}
      {trailing && (
        <div className="ms-auto flex items-center px-3 py-2 border-s border-border shrink-0">
          {trailing}
        </div>
      )}
    </div>
  );
};

export default ReportSummaryStrip;
