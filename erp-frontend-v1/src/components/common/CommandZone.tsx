import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CommandZoneProps {
  /** Page / entity title */
  title: string;
  /** Optional breadcrumb trail shown before the title */
  breadcrumb?: BreadcrumbItem[];
  /** Action buttons / controls rendered on the trailing edge */
  actions?: ReactNode;
  /** Optional badge next to title (count, status, etc.) */
  badge?: ReactNode;
  className?: string;
}

/**
 * CommandZone — the fixed 52px page header bar.
 *
 * Replaces PageHeader for list and detail pages.
 * Breadcrumb + Title on the leading side, Actions on the trailing side.
 * Height is intentionally compact so more data fits in the viewport.
 */
export const CommandZone = ({
  title,
  breadcrumb,
  actions,
  badge,
  className,
}: CommandZoneProps) => {
  return (
    <div className={cn("erp-command-zone", className)}>
      {/* Leading: breadcrumb + title */}
      <div className="flex items-center gap-1.5 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-[var(--text-secondary)] transition-colors truncate max-w-[8rem]"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="truncate max-w-[8rem]">{crumb.label}</span>
                )}
                <ChevronRight className="size-3 shrink-0 opacity-50" />
              </span>
            ))}
          </nav>
        )}

        <h1 className="erp-page-title truncate leading-none">{title}</h1>

        {badge && <span className="shrink-0">{badge}</span>}
      </div>

      {/* Trailing: actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 ms-4">{actions}</div>
      )}
    </div>
  );
};

export default CommandZone;
