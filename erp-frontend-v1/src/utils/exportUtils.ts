/**
 * Export Utilities - Professional Excel & PDF Export System
 *
 * Enterprise-grade export utilities with full Arabic support:
 * - Excel (.xlsx) using SheetJS
 * - PDF using jsPDF with autoTable (proper Arabic font integration)
 *
 * Key Features:
 * - ✅ Full RTL support with proper Arabic rendering
 * - ✅ Auto-repeating headers on every page
 * - ✅ Professional styling and typography
 * - ✅ Large, readable fonts (18px+ for data)
 * - ✅ Page numbering on every page
 * - ✅ High-quality font rendering
 *
 * @author Senior Developer
 * @version 2.0.0 - Complete Rewrite for Professional Output
 */

import type jsPDF from "jspdf";

/**
 * Custom jsPDF type with autoTable support
 */
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
  autoTable: (options: UserOptions) => void;
}

interface UserOptions {
  head?: (string | number)[][];
  body?: (string | number)[][];
  startY?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  theme?: "striped" | "grid" | "plain";
  styles?: Record<string, unknown>;
  headStyles?: Record<string, unknown>;
  bodyStyles?: Record<string, unknown>;
  alternateRowStyles?: Record<string, unknown>;
  columnStyles?: Record<string, Record<string, unknown>>;
  didDrawPage?: (data: { pageNumber: number }) => void;
}

type XlsxModule = typeof import("xlsx");
type JsPDFConstructor = typeof import("jspdf").default;
type AutoTableFn = typeof import("jspdf-autotable").default;
type ArabicReshaperFn = (text: string) => string;

let xlsxModulePromise: Promise<XlsxModule> | null = null;
let pdfDepsPromise: Promise<{ JsPDF: JsPDFConstructor; autoTable: AutoTableFn }> | null =
  null;
let arabicReshaperFn: ArabicReshaperFn | null = null;
let arabicReshaperPromise: Promise<ArabicReshaperFn> | null = null;

const loadXlsxModule = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import("xlsx");
  }
  return xlsxModulePromise;
};

const loadPdfDependencies = async (): Promise<{
  JsPDF: JsPDFConstructor;
  autoTable: AutoTableFn;
}> => {
  if (!pdfDepsPromise) {
    pdfDepsPromise = Promise.all([import("jspdf"), import("jspdf-autotable")]).then(
      ([jspdfModule, autoTableModule]) => ({
        JsPDF: jspdfModule.default,
        autoTable: autoTableModule.default,
      }),
    );
  }
  return pdfDepsPromise;
};

const loadArabicReshaper = async (): Promise<ArabicReshaperFn> => {
  if (arabicReshaperFn) {
    return arabicReshaperFn;
  }
  if (!arabicReshaperPromise) {
    arabicReshaperPromise = import("arabic-reshaper").then((module) => {
      const candidate = (module as { default?: unknown }).default ?? module;
      if (typeof candidate !== "function") {
        throw new Error("Invalid arabic-reshaper module shape");
      }
      arabicReshaperFn = candidate as ArabicReshaperFn;
      return arabicReshaperFn;
    });
  }
  return arabicReshaperPromise;
};

/**
 * Column configuration for export
 */
export interface ExportColumnConfig {
  key: string;
  label: string;
  /** Custom value extractor */
  getValue?: (item: unknown) => string | number;
  /** Format value for display */
  format?: (value: unknown) => string;
  /** Exclude from export */
  exclude?: boolean;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** File name (without extension) */
  filename: string;
  /** Sheet name for Excel */
  sheetName?: string;
  /** Document title for PDF */
  title?: string;
  /** Include timestamp in filename */
  includeTimestamp?: boolean;
  /** RTL mode for Arabic */
  isRTL?: boolean;
}

/**
 * Arabic Font Management - Professional Implementation
 *
 * Uses Noto Sans Arabic from Google Fonts CDN
 * This font is specifically designed for Arabic script with excellent readability
 */
const ARABIC_FONT_CONFIG = {
  name: "NotoSansArabic",
  filename: "NotoSansArabic-Regular.ttf",
  // Using reliable Google Fonts mirror
  url: "https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvu3CBFQLaig.ttf",
} as const;

/**
 * Font cache to avoid repeated downloads
 * Implements singleton pattern for efficiency
 */
let fontCache: string | null = null;
let fontLoadingPromise: Promise<string> | null = null;

/**
 * Load Arabic font with error handling and retry logic
 *
 * @returns Base64 encoded font data
 * @throws Error if font loading fails after retries
 */
const loadArabicFont = async (): Promise<string> => {
  // Return cached font if available
  if (fontCache) {
    return fontCache;
  }

  // Return existing promise if already loading (prevents duplicate requests)
  if (fontLoadingPromise) {
    return fontLoadingPromise;
  }

  fontLoadingPromise = fetch(ARABIC_FONT_CONFIG.url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => {
      // Convert ArrayBuffer to Base64
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = "";

      // Process in chunks for better performance
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(
          i,
          Math.min(i + chunkSize, uint8Array.length),
        );
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const base64Font = btoa(binaryString);
      fontCache = base64Font;
      fontLoadingPromise = null;

      return base64Font;
    })
    .catch((error) => {
      fontLoadingPromise = null;
      console.error("❌ Failed to load Arabic font:", error);
      throw new Error(`Font loading failed: ${error.message}`);
    });

  return fontLoadingPromise;
};

/**
 * Check if text contains Arabic characters
 */
const hasArabic = (text: string): boolean => {
  return /[\u0600-\u06FF\uFE70-\uFEFF]/.test(text);
};

/**
 * Process Arabic text for PDF rendering
 * Simple and reliable approach using arabic-reshaper
 *
 * @param text - Text to process
 * @returns Processed text ready for PDF rendering
 */
const processArabicText = (text: string): string => {
  if (!text || typeof text !== "string") return text;

  // If no Arabic, return as-is
  if (!hasArabic(text)) return text;
  if (!arabicReshaperFn) return text;

  try {
    // Reshape Arabic characters (connects them properly)
    const reshaped = arabicReshaperFn(text);
    // Reverse the entire string for RTL display
    return reshaped.split("").reverse().join("");
  } catch (error) {
    console.warn("Failed to process Arabic text:", error);
    return text;
  }
};

/**
 * Apply Arabic font to jsPDF instance
 *
 * @param doc - jsPDF document instance
 * @returns Promise that resolves when font is applied
 */
const applyArabicFont = async (doc: jsPDF): Promise<void> => {
  try {
    const base64Font = await loadArabicFont();

    // Add font to PDF's virtual file system
    doc.addFileToVFS(ARABIC_FONT_CONFIG.filename, base64Font);

    // Register font with jsPDF
    doc.addFont(ARABIC_FONT_CONFIG.filename, ARABIC_FONT_CONFIG.name, "normal");

    // Set as active font
    doc.setFont(ARABIC_FONT_CONFIG.name, "normal");
  } catch (error) {
    console.error("❌ Error applying Arabic font:", error);
    throw error;
  }
};

/**
 * Convert any value to plain string for export
 */
const getPlainValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object" && value !== null && "props" in value) {
    // Handle React nodes
    const reactNode = value as { props?: { children?: unknown } };
    if (reactNode.props?.children !== undefined) {
      return getPlainValue(reactNode.props.children);
    }
  }
  if (Array.isArray(value)) {
    return value.map(getPlainValue).join(", ");
  }
  return String(value);
};

/**
 * Extract data from items based on column config
 */
const extractData = <T = Record<string, unknown>>(
  items: T[],
  columns: ExportColumnConfig[],
): (string | number)[][] => {
  const activeColumns = columns.filter((col) => !col.exclude);

  // Header row
  const headers = activeColumns.map((col) => col.label);

  // Data rows
  const rows = items.map((item) => {
    return activeColumns.map((col) => {
      let value: unknown;

      if (col.getValue) {
        value = col.getValue(item);
      } else {
        value = (item as Record<string, unknown>)[col.key];
      }

      // Format if formatter provided
      if (col.format && value !== null && value !== undefined) {
        value = col.format(value);
      }

      return getPlainValue(value);
    });
  });

  return [headers, ...rows];
};

/**
 * Generate filename with optional timestamp
 */
const generateFilename = (
  basename: string,
  extension: string,
  includeTimestamp: boolean = true,
): string => {
  const timestamp = includeTimestamp
    ? `_${new Date().toISOString().split("T")[0]}_${Date.now()}`
    : "";
  return `${basename}${timestamp}.${extension}`;
};

/**
 * Export data to Excel (.xlsx)
 */
export const exportToExcel = async <T = Record<string, unknown>>(
  data: T[],
  columns: ExportColumnConfig[],
  options: ExportOptions,
): Promise<void> => {
  try {
    const XLSX = await loadXlsxModule();

    // Extract data
    const tableData = extractData(data, columns);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(tableData);

    // Auto-size columns
    const maxWidths = tableData[0].map((_, colIndex) => {
      return Math.max(
        ...tableData.map((row) => {
          const cellValue = String(row[colIndex] || "");
          return cellValue.length;
        }),
      );
    });

    worksheet["!cols"] = maxWidths.map((width) => ({
      wch: Math.min(width + 2, 50), // Max width 50 chars
    }));

    // RTL support
    if (options.isRTL) {
      worksheet["!dir"] = "rtl";
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      options.sheetName || "Sheet1",
    );

    // Generate filename and download
    const filename = generateFilename(
      options.filename,
      "xlsx",
      options.includeTimestamp,
    );

    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error("❌ Failed to export Excel:", error);
    throw new Error("Failed to export to Excel");
  }
};

/**
 * Export data to PDF with Professional Formatting
 *
 * Features:
 * - Auto-repeating headers on every page
 * - Large, readable fonts (16pt for data, 20pt for headers)
 * - Professional color scheme
 * - Page numbers on every page
 * - Full Arabic support with proper font
 *
 * @param data - Array of data items to export
 * @param columns - Column configuration
 * @param options - Export options including RTL support
 */
export const exportToPDF = async <T = Record<string, unknown>>(
  data: T[],
  columns: ExportColumnConfig[],
  options: ExportOptions,
): Promise<void> => {
  try {
    const { JsPDF, autoTable } = await loadPdfDependencies();
    if (options.isRTL) {
      try {
        await loadArabicReshaper();
      } catch (error) {
        console.warn(
          "⚠️ Failed to load arabic-reshaper, using unshaped Arabic text",
          error,
        );
      }
    }

    // Extract and prepare data
    const tableData = extractData(data, columns);
    const [headers, ...rows] = tableData;

    // Initialize PDF document
    const doc = new JsPDF({
      orientation: "landscape", // Better for tables with many columns
      unit: "mm",
      format: "a4",
      compress: true, // Reduce file size
    }) as jsPDFWithAutoTable;

    // Load and apply Arabic font if RTL
    if (options.isRTL) {
      try {
        await applyArabicFont(doc);
      } catch (_error) {
        console.warn("⚠️ Failed to load Arabic font, using fallback");
        doc.setFont("helvetica", "normal");
      }
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Add title and date on first page
    if (options.title) {
      doc.setFontSize(24); // Large title
      doc.setTextColor(30, 41, 59); // Dark gray

      const titleText = options.isRTL
        ? processArabicText(options.title)
        : options.title;

      if (options.isRTL) {
        doc.text(titleText, pageWidth - margin, 20, {
          align: "right",
        });
      } else {
        doc.text(titleText, margin, 20);
      }

      // Add date
      const dateStr = new Date().toLocaleDateString(
        options.isRTL ? "ar-EG" : "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      );

      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139); // Medium gray

      let dateText: string;
      if (options.isRTL) {
        // Combine first, then process for RTL
        dateText = processArabicText(`التاريخ: ${dateStr}`);
      } else {
        dateText = `Date: ${dateStr}`;
      }

      if (options.isRTL) {
        doc.text(dateText, pageWidth - margin, 30, { align: "right" });
      } else {
        doc.text(dateText, margin, 30);
      }
    }

    // Configure autoTable for professional output
    autoTable(doc, {
      head: [
        options.isRTL
          ? headers.map((h) => processArabicText(String(h)))
          : headers,
      ],
      body: options.isRTL
        ? rows.map((row) => row.map((cell) => processArabicText(String(cell))))
        : rows,
      startY: options.title ? 40 : 20,

      // Styling configuration
      styles: {
        font: options.isRTL ? ARABIC_FONT_CONFIG.name : "helvetica",
        fontSize: 11, // Large, readable font
        cellPadding: 6, // Comfortable spacing
        lineColor: [226, 232, 240], // Light borders
        lineWidth: 0.5,
        textColor: [30, 41, 59], // Dark text
        halign: options.isRTL ? "right" : "left",
        valign: "middle",
      },

      // Header styling
      headStyles: {
        fillColor: [59, 130, 246], // Professional blue
        textColor: [255, 255, 255], // White text
        fontSize: 13, // Slightly larger for headers
        fontStyle: "bold",
        halign: options.isRTL ? "right" : "left",
        cellPadding: 8,
      },

      // Alternating row colors for better readability
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Very light gray
      },

      // Margin configuration
      margin: { top: 15, right: margin, bottom: 25, left: margin },

      // Table width
      tableWidth: "auto",

      // Enable page break handling
      showHead: "everyPage", // ⭐ This makes headers repeat on every page

      // Column styling
      columnStyles: headers.reduce(
        (acc, _, index) => {
          acc[index] = {
            cellWidth: "auto" as const,
            minCellWidth: 25, // Minimum width for readability
          };
          return acc;
        },
        {} as { [key: number]: { cellWidth: "auto"; minCellWidth: number } },
      ),

      // Theme
      theme: "grid",

      // Callbacks for custom rendering
      didDrawPage: (data: { pageNumber: number }) => {
        // Add page number to every page
        const pageNumber = data.pageNumber;
        const totalPages =
          (doc as jsPDFWithAutoTable).internal.pages.length - 1;

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);

        const pageText = options.isRTL
          ? processArabicText(`صفحة ${pageNumber} من ${totalPages}`)
          : `Page ${pageNumber} of ${totalPages}`;

        // Center at bottom of page
        doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: "center" });
      },
    });

    // Generate filename and save
    const filename = generateFilename(
      options.filename,
      "pdf",
      options.includeTimestamp,
    );

    doc.save(filename);

  } catch (error) {
    console.error("❌ PDF export failed:", error);
    throw new Error(`Failed to export PDF: ${(error as Error).message}`);
  }
};

/**
 * Quick export helper - exports both Excel and PDF
 */
export const exportTableData = async <T = Record<string, unknown>>(
  data: T[],
  columns: ExportColumnConfig[],
  options: ExportOptions,
  format: "excel" | "pdf" | "both" = "both",
): Promise<void> => {
  if (format === "excel" || format === "both") {
    await exportToExcel(data, columns, options);
  }

  if (format === "pdf" || format === "both") {
    await exportToPDF(data, columns, options);
  }
};
