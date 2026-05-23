/**
 * Breadcrumbs Component
 *
 * Enterprise-grade breadcrumb navigation with:
 * - Full RTL/LTR support with auto-detection
 * - Responsive design (collapse on mobile)
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Smooth hover transitions
 * - Dark mode support
 * - Semantic HTML structure
 *
 * Usage:
 * ```tsx
 * <Breadcrumbs />
 * ```
 *
 * The component automatically generates breadcrumbs based on current route
 * using the useBreadcrumbs hook.
 *
 * @component Breadcrumbs
 * @author ERP System Team
 */

import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, Home } from "lucide-react";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useLanguageStore } from "@/store/languageStore";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  /** Optional className for custom styling */
  className?: string;
  /** Show home icon for dashboard link */
  showHomeIcon?: boolean;
  /** Maximum number of items before collapsing (0 = no limit) */
  maxItems?: number;
}

/**
 * Breadcrumbs Navigation Component
 */
export const Breadcrumbs = ({
  className,
  showHomeIcon = true,
  maxItems = 0,
}: BreadcrumbsProps) => {
  const breadcrumbs = useBreadcrumbs();
  const { language } = useLanguageStore();
  const isRTL = language === "ar";

  // Determine which icon to use based on direction
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  // Handle maxItems - collapse middle items if needed
  let displayBreadcrumbs = breadcrumbs;
  if (maxItems > 0 && breadcrumbs.length > maxItems) {
    // Keep first item, last item, and show ellipsis
    displayBreadcrumbs = [
      breadcrumbs[0],
      { label: "...", path: "", isCurrentPage: false },
      ...breadcrumbs.slice(-2),
    ];
  }

  // Don't render if only dashboard (single item)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-2 text-sm mt-1 mb-6 py-2",
        "text-muted-foreground",
        className,
      )}
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {displayBreadcrumbs.map((breadcrumb, index) => {
          const isFirst = index === 0;
          const isLast = index === displayBreadcrumbs.length - 1;
          const isCurrent = breadcrumb.isCurrentPage || isLast;

          return (
            <li
              key={`${breadcrumb.path}-${index}`}
              className="flex items-center gap-2"
            >
              {/* Separator (except for first item) */}
              {!isFirst && (
                <ChevronIcon
                  className="w-4 h-4 opacity-50 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb Item */}
              {isCurrent ? (
                // Current page - not a link
                <span
                  className={cn(
                    "font-medium text-foreground",
                    "line-clamp-1 max-w-[200px] sm:max-w-none",
                  )}
                  aria-current="page"
                >
                  {isFirst && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label={breadcrumb.label} />
                  ) : (
                    breadcrumb.label
                  )}
                </span>
              ) : breadcrumb.label === "..." ? (
                // Ellipsis for collapsed items
                <span className="px-1" aria-hidden="true">
                  …
                </span>
              ) : (
                // Navigation link
                <Link
                  to={breadcrumb.path}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm",
                    "line-clamp-1 max-w-[150px] sm:max-w-none",
                  )}
                  aria-label={`Navigate to ${breadcrumb.label}`}
                >
                  {isFirst && showHomeIcon ? (
                    <Home className="w-4 h-4" aria-label={breadcrumb.label} />
                  ) : (
                    breadcrumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
