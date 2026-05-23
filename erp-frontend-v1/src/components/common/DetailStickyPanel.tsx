import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DetailPanelSection {
  label: string;
  value: ReactNode;
  wide?: boolean;
}

interface DetailStickyPanelProps {
  sections: DetailPanelSection[];
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * DetailStickyPanel - compact sticky summary panel for details pages.
 */
export const DetailStickyPanel = ({
  sections,
  title = "Details",
  actions,
  className,
}: DetailStickyPanelProps) => {
  return (
    <aside
      className={cn(
        "w-full shrink-0 lg:sticky lg:top-20 lg:w-72 xl:w-80",
        "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      </div>

      <dl className="space-y-1.5 p-2">
        {sections.map((section, i) => (
          <div
            key={i}
            className={cn(
              "rounded-[var(--radius-sm)] border border-transparent bg-[var(--bg-surface-primary)] px-3 py-2.5 transition-colors",
              "hover:border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]/45",
              section.wide
                ? "flex flex-col gap-0.5"
                : "flex items-start justify-between gap-3",
            )}
          >
            <dt className="min-w-[84px] shrink-0 pt-0.5 text-xs font-medium text-[var(--text-tertiary)]">
              {section.label}
            </dt>
            <dd
              className={cn(
                "text-sm font-medium text-[var(--text-primary)]",
                section.wide ? "" : "min-w-0 break-words text-end",
              )}
            >
              {section.value}
            </dd>
          </div>
        ))}
      </dl>

      {actions && (
        <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-4 py-3">
          {actions}
        </div>
      )}
    </aside>
  );
};

export default DetailStickyPanel;
