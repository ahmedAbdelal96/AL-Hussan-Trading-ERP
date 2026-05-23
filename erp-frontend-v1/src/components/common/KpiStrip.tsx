import { cn } from "@/lib/utils";

export type DeltaDirection = "up" | "down" | "neutral";

export interface KpiItem {
  /** Short uppercase label */
  label: string;
  /** Formatted value string (e.g. "1,240" or "SAR 42,000") */
  value: string | number;
  /** Optional click handler */
  onClick?: () => void;
  /** Relative change value (+12%, -3, etc.) */
  delta?: string | number;
  /** Whether delta is good (up), bad (down), or neutral */
  deltaDirection?: DeltaDirection;
  /** Sub-label shown below delta */
  deltaLabel?: string;
  /** CSS color or variable for the top accent border and background tint, e.g. "var(--success)" */
  accent?: string;
  /** Icon element shown at the top of the card */
  icon?: React.ReactNode;
  /** Secondary description text shown below the value */
  description?: string;
  /** Highlight this card as "active" / currently selected filter */
  active?: boolean;
}

interface KpiStripProps {
  items: KpiItem[];
  className?: string;
}

const deltaSymbol: Record<DeltaDirection, string> = {
  up: "▲",
  down: "▼",
  neutral: "—",
};

/**
 * KpiStrip — a single horizontal bar of key metrics.
 *
 * Replaces the grid of InfoCard components on dashboard/list pages.
 * Each cell is separated by a vertical divider.
 * Clicking a cell (if onClick provided) can drill-down / filter.
 */
export const KpiStrip = ({ items, className }: KpiStripProps) => {
  return (
    <div className={cn("erp-kpi-strip", className)}>
      {items.map((item, i) => {
        const dir: DeltaDirection = item.deltaDirection ?? "neutral";
        const Tag = item.onClick ? "button" : "div";

        return (
          <Tag
            key={i}
            style={
              item.accent
                ? ({ "--kpi-accent": item.accent } as React.CSSProperties)
                : undefined
            }
            className={cn(
              "erp-kpi-item",
              item.onClick && "cursor-pointer",
              item.active && "erp-kpi-item--active",
            )}
            onClick={item.onClick}
          >
            {item.icon && <span className="erp-kpi-icon">{item.icon}</span>}
            <span className="erp-kpi-label">{item.label}</span>
            <span className="erp-kpi-value">{item.value}</span>
            {item.description && (
              <span className="erp-kpi-description">{item.description}</span>
            )}

            {item.delta !== undefined && (
              <span
                className={cn(
                  "erp-kpi-delta",
                  dir === "up" && "erp-kpi-delta--up",
                  dir === "down" && "erp-kpi-delta--down",
                  dir === "neutral" && "erp-kpi-delta--neutral",
                )}
              >
                {deltaSymbol[dir]} {item.delta}
                {item.deltaLabel && (
                  <span className="ms-1 font-normal opacity-75">
                    {item.deltaLabel}
                  </span>
                )}
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
};

export default KpiStrip;
