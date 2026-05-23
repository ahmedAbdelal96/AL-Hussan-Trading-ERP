import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string; // alias for description
  actions?: ReactNode;
  /** @deprecated icon is no longer rendered — kept for backward compatibility */
  icon?: ReactNode;
  /** @deprecated showBackButton is no longer supported */
  showBackButton?: boolean;
  /** @deprecated decorative left border removed — kept for backward compatibility */
  borderColor?: "brand" | "success" | "error" | "warning" | "info" | "purple";
  className?: string;
}

/**
 * PageHeader — compact command-zone style page header.
 *
 * Renders as a single 52px horizontal bar matching CommandZone.
 * All previous props (icon, borderColor, showBackButton) are kept for
 * backward compatibility but are no longer rendered.
 */
export const PageHeader = ({
  title,
  description,
  subtitle,
  actions,
  className,
}: PageHeaderProps) => {
  const subtitleText = subtitle || description;

  return (
    <header className={cn("erp-command-zone", className)}>
      {/* Leading: title + optional sub */}
      <div className="flex flex-col justify-center min-w-0 gap-0.5">
        <h1 className="erp-page-title truncate">{title}</h1>
        {subtitleText && (
          <p className="erp-page-subtitle truncate">
            {subtitleText}
          </p>
        )}
      </div>

      {/* Trailing: actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 ms-4">{actions}</div>
      )}
    </header>
  );
};
