/**
 * ============================================================================
 * REPORT PAGE LAYOUT — Shared Layout for All Report Pages
 * ============================================================================
 *
 * Provides a consistent structure for every report page:
 *   1. Breadcrumbs
 *   2. PageHeader (title, description, actions)
 *   3. Filter bar (ReportFilters)
 *   4. KPI cards grid
 *   5. Charts section
 *   6. Data table
 *   7. Generation timestamp footer
 *
 * Also handles: loading, error, empty states.
 *
 * @component ReportPageLayout
 * @version 1.0.0
 */

import React from "react";
import { RefreshCw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { cn } from "@/lib/utils";

// ============ TYPES ============

export interface ReportPageLayoutProps {
  /** Report title */
  title: string;
  /** Report description */
  description?: string;
  /** PageHeader border color */
  borderColor?: "brand" | "success" | "error" | "warning" | "info" | "purple";

  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Has data */
  hasData?: boolean;

  /** Refetch callback */
  onRefresh?: () => void;
  /** Print callback */
  onPrint?: () => void;

  /** Server-generated timestamp */
  generatedAt?: string;

  /** Filter bar slot */
  filters?: React.ReactNode;
  /** Optional compact summary strip (renders between filters and kpiCards) */
  summaryStrip?: React.ReactNode;
  /** KPI cards slot */
  kpiCards?: React.ReactNode;
  /** Charts slot */
  charts?: React.ReactNode;
  /** Main content (table / tabs) */
  children: React.ReactNode;

  /**
   * When true and both `charts` and `children` are provided,
   * renders them side-by-side in a 2-column grid on lg+ screens.
   */
  splitLayout?: boolean;

  /** Additional CSS classes */
  className?: string;
}

// ============ LOADING STATE ============

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted" />
      ))}
    </div>
    <div className="h-64 rounded-lg bg-muted" />
    <div className="h-96 rounded-lg bg-muted" />
  </div>
);

// ============ ERROR STATE ============

const ErrorState: React.FC<{
  error: Error;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <RefreshCw className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t("reports.error.title")}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {error.message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 me-2" />
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
};

// ============ EMPTY STATE ============

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <RefreshCw className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t("reports.empty.title")}
      </h3>
      <p className="text-sm text-muted-foreground">
        {t("reports.empty.description")}
      </p>
    </div>
  );
};

// ============ COMPONENT ============

export const ReportPageLayout: React.FC<ReportPageLayoutProps> = ({
  title,
  description,
  borderColor = "purple",
  isLoading,
  error,
  hasData = true,
  onRefresh,
  onPrint,
  generatedAt,
  filters,
  summaryStrip,
  kpiCards,
  charts,
  children,
  splitLayout = false,
  className,
}) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  // Format timestamp
  const formattedTimestamp = generatedAt
    ? new Date(generatedAt).toLocaleString(
        language === "ar" ? "ar-EG" : "en-US",
      )
    : undefined;

  return (
    <PageShell
      size="wide"
      density="compact"
      className={cn("reports-page-shell", className)}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header */}
      <PageHeader
        title={title}
        description={description}
        borderColor={borderColor}
        actions={
          <div className="flex items-center gap-2">
            {onPrint && (
              <Button variant="outline" size="sm" onClick={onPrint}>
                <Printer className="h-4 w-4 me-1.5" />
                {t("common.print")}
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("h-4 w-4 me-1.5", isLoading && "animate-spin")}
                />
                {t("common.refresh")}
              </Button>
            )}
          </div>
        }
      />

      {/* Loading */}
      {isLoading && <LoadingSkeleton />}

      {/* Error */}
      {!isLoading && error && <ErrorState error={error} onRetry={onRefresh} />}

      {/* Empty */}
      {!isLoading && !error && !hasData && <EmptyState />}

      {/* Main Content */}
      {!isLoading && !error && hasData && (
        <>
          {/* Filters */}
          {filters}

          {/* Summary Strip */}
          {summaryStrip}

          {/* KPI Cards */}
          {kpiCards}

          {/* Charts + Main Content (optionally side-by-side) */}
          {splitLayout && charts ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div>{charts}</div>
              <div>{children}</div>
            </div>
          ) : (
            <>
              {charts}
              {children}
            </>
          )}
        </>
      )}

      {/* Footer — Generation Timestamp */}
      {formattedTimestamp && !isLoading && !error && (
        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border/50">
          {t("reports.generatedAt")}:{" "}
          {formattedTimestamp}
        </div>
      )}
    </PageShell>
  );
};


