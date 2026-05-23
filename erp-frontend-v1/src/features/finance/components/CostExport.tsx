/**
 * Cost Export Component
 *
 * Provides export functionality for project costs with:
 * - Excel export with styling
 * - PDF export with formatting
 * - CSV export for raw data
 * - Filtered data export
 *
 * Dependencies:
 * - xlsx: Excel generation
 * - jspdf & jspdf-autotable: PDF generation
 *
 * Performance Considerations:
 * - Async export operations
 * - Progress feedback
 * - Error handling
 *
 * @component CostExport
 * @version 1.0
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { getCurrentLocale } from "@/config/system.constants";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showToast } from "@/lib/toast";
import type { ProjectCostEntity } from "@/types/finance.types";

interface CostExportProps {
  costs: ProjectCostEntity[];
  filename?: string;
}

export const CostExport = ({
  costs,
  filename = "project_costs",
}: CostExportProps) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Format date for export
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getCurrentLocale(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  /**
   * Prepare data for export
   * Transforms API data to export-friendly format
   */
  const prepareExportData = () => {
    return costs.map((cost) => ({
      [t("finance.costs.table.transactionDate")]: formatDate(
        cost.transactionDate,
      ),
      [t("finance.costs.table.description")]: cost.description || "-",
      [t("finance.costs.table.costType")]: t(
        `finance.costs.costTypes.${cost.costType}`,
      ),
      [t("finance.costs.table.category")]:
        cost.category?.name || t("finance.common.noCategory"),
      [t("finance.costs.table.amount")]: cost.amount,
      [t("finance.costs.table.currency")]: cost.currency,
      [t("finance.costs.table.status")]: t(
        `finance.costs.paymentStatus.${cost.paymentStatus}`,
      ),
      [t("finance.costs.table.invoiceNumber")]: cost.invoiceNumber || "-",
      [t("finance.costs.table.paymentMethod")]: cost.paymentMethod || "-",
    }));
  };

  /**
   * Export to Excel with styling
   * Creates formatted XLSX file with proper column widths
   */
  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");

      const exportData = prepareExportData();

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();

      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 30 }, // Description
        { wch: 15 }, // Cost Type
        { wch: 20 }, // Category
        { wch: 12 }, // Amount
        { wch: 8 }, // Currency
        { wch: 15 }, // Status
        { wch: 15 }, // Invoice Number
        { wch: 15 }, // Payment Method
      ];
      ws["!cols"] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, t("finance.costs.export.sheetName"));

      // Generate and download file
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);

      showToast.success(t("finance.costs.export.successExcel"));
    } catch (error) {
      console.error("Excel export error:", error);
      showToast.error(t("finance.costs.export.error"));
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export to PDF with formatting
   * Creates professionally formatted PDF with table
   */
  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const exportData = prepareExportData();

      // Create PDF document (A4 landscape for wide tables)
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add title
      doc.setFontSize(18);
      doc.text(t("finance.costs.export.pdfTitle"), 14, 20);

      // Add export date
      doc.setFontSize(10);
      doc.text(
        `${t("finance.costs.export.exportDate")}: ${formatDate(
          new Date().toISOString(),
        )}`,
        14,
        28,
      );

      // Prepare table data
      const headers = Object.keys(exportData[0] || {});
      const rows = exportData.map((row) =>
        Object.values(row).map((value) => value ?? "-"),
      );

      // Add table with auto-table plugin
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 35,
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 35 },
      });

      // Add footer with page numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `${t("finance.costs.export.page")} ${i} ${t(
            "finance.costs.export.of",
          )} ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }

      // Save PDF
      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(`${filename}_${timestamp}.pdf`);

      showToast.success(t("finance.costs.export.successPdf"));
    } catch (error) {
      console.error("PDF export error:", error);
      showToast.error(t("finance.costs.export.error"));
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export to CSV
   * Simple comma-separated values format
   */
  const exportToCSV = async () => {
    try {
      setIsExporting(true);

      const exportData = prepareExportData();

      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(","),
        ),
      ];

      const csvContent = csvRows.join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${timestamp}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast.success(t("finance.costs.export.successCsv"));
    } catch (error) {
      console.error("CSV export error:", error);
      showToast.error(t("finance.costs.export.error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          disabled={isExporting || costs.length === 0}
        >
          <Download className="h-4 w-4" />
          {isExporting
            ? t("finance.costs.export.exporting")
            : t("finance.costs.export.export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {t("finance.costs.export.selectFormat")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          {t("finance.costs.export.excel")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2">
          <FileText className="h-4 w-4 text-red-600" />
          {t("finance.costs.export.pdf")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2">
          <File className="h-4 w-4 text-blue-600" />
          {t("finance.costs.export.csv")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
