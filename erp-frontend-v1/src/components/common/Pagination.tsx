/**
 * Pagination Component
 *
 * A professional, fully-featured pagination component with:
 * - Theme integration (uses design system colors)
 * - Full i18n support (Arabic/English)
 * - RTL support (icons and layout flip automatically)
 * - Smart ellipsis for large page counts
 * - Page size selector
 * - First/Last/Previous/Next navigation
 * - Keyboard accessible
 *
 * @author Senior Developer
 * @version 2.0
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguage } from "@/store/languageStore";

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface PaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination = ({
  paginationInfo,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20, 25, 30, 35, 40],
  className = "",
}: PaginationProps) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { currentPage, pageSize, totalItems, totalPages } = paginationInfo;

  // Calculate displayed items range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  /**
   * Generate smart page numbers with ellipsis
   * Shows: [1] ... [5] [6] [7] ... [20]
   * Always shows first, last, and pages around current
   */
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near start
        for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
          pages.push(i);
        }
        pages.push("...");
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push("...");
        for (let i = Math.max(totalPages - 3, 2); i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    if (!onPageSizeChange) return;
    const size = Number(newSize);
    onPageSizeChange(size);
    // Reset to page 1 when changing page size to avoid empty results
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  // Don't render if no data
  if (totalItems === 0) {
    return null;
  }

  // In RTL, the visual direction of navigation arrows should be mirrored
  // so that icon direction matches user expectation, while actions remain identical.
  const FirstIcon = isRTL ? ChevronsRight : ChevronsLeft;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const LastIcon = isRTL ? ChevronsLeft : ChevronsRight;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 ${className}`}
    >
      {/* Left: Page size selector and info */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        {/* Page Size Selector (optional) */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
              {t("common.show", { defaultValue: "Show" })}
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
              {t("common.entries", { defaultValue: "Entries" })}
            </span>
          </div>
        )}

        {/* Info Text */}
        <div className="text-sm text-[var(--text-tertiary)]">
          {t("common.showing", { defaultValue: "Showing" })}{" "}
          <span className="font-medium text-[var(--text-primary)]">{startItem}</span>{" "}
          {t("common.to", { defaultValue: "to" })}{" "}
          <span className="font-medium text-[var(--text-primary)]">{endItem}</span>{" "}
          {t("common.of", { defaultValue: "of" })}{" "}
          <span className="font-medium text-[var(--text-primary)]">{totalItems}</span>
        </div>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          title={t("common.firstPage", { defaultValue: "First Page" })}
          aria-label={t("common.firstPage", { defaultValue: "First Page" })}
          className="h-9 w-9 hover:bg-[var(--bg-hover)]"
        >
          <FirstIcon className="h-4 w-4" />
        </Button>

        {/* Previous Page Button */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title={t("common.previousPage", { defaultValue: "Previous" })}
          aria-label={t("common.previousPage", { defaultValue: "Previous" })}
          className="h-9 w-9 hover:bg-[var(--bg-hover)]"
        >
          <PrevIcon className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) =>
            typeof page === "number" ? (
              <Button
                key={`page-${page}`}
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page)}
                className={
                  currentPage === page
                    ? "min-w-[36px] h-9 !bg-[var(--primary-main)] !text-[var(--text-on-brand)] hover:!bg-[var(--primary-dark)] !border-[var(--primary-main)] font-semibold"
                    : "min-w-[36px] h-9 bg-[var(--bg-surface-primary)] hover:bg-[var(--bg-hover)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                }
                aria-label={`${t("common.page", {
                  defaultValue: "صفحة",
                })} ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            ) : (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-[var(--text-tertiary)]"
                aria-hidden="true"
              >
                {page}
              </span>
            ),
          )}
        </div>

        {/* Next Page Button */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title={t("common.nextPage", { defaultValue: "Next" })}
          aria-label={t("common.nextPage", { defaultValue: "Next" })}
          className="h-9 w-9 hover:bg-[var(--bg-hover)]"
        >
          <NextIcon className="h-4 w-4" />
        </Button>

        {/* Last Page Button */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          title={t("common.lastPage", { defaultValue: "Last Page" })}
          aria-label={t("common.lastPage", { defaultValue: "Last Page" })}
          className="h-9 w-9 hover:bg-[var(--bg-hover)]"
        >
          <LastIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
