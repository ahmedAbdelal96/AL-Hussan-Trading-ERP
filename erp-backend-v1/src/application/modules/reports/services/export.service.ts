/**
 * ============================================================================
 * EXPORT SERVICE
 * ============================================================================
 *
 * خدمة تصدير التقارير إلى Excel, PDF, CSV
 * تستخدم مكتبات ExcelJS و PDFKit
 *
 * @module ExportService
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * تصدير البيانات إلى Excel
   * @param data - البيانات المراد تصديرها
   * @param columns - أعمدة الجدول
   * @param sheetName - اسم الورقة
   * @param filename - اسم الملف
   * @param res - Express Response
   */
  async exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: { header: string; key: keyof T; width?: number }[],
    sheetName: string,
    filename: string,
    res: Response,
  ): Promise<void> {
    try {
      // إنشاء Workbook جديد
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ERP System';
      workbook.created = new Date();

      // إضافة Worksheet
      const worksheet = workbook.addWorksheet(sheetName);

      // تعريف الأعمدة
      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key as string,
        width: col.width || 15,
      }));

      // تنسيق الـ Header
      worksheet.getRow(1).font = {
        bold: true,
        size: 12,
        color: { argb: 'FFFFFFFF' },
      };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      worksheet.getRow(1).height = 25;

      // إضافة البيانات
      data.forEach((item) => {
        worksheet.addRow(item);
      });

      // تنسيق الحدود لكل الخلايا
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // تنسيق الصفوف الزوجية
          if (rowNumber > 1 && rowNumber % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' },
            };
          }
        });
      });

      // تجميد الصف الأول (Header)
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      // إعداد Headers للتحميل
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.xlsx"`,
      );

      // كتابة الملف إلى Response
      await workbook.xlsx.write(res);
      res.end();

      this.logger.log(`تم تصدير التقرير إلى Excel: ${filename}`);
    } catch (error) {
      this.logger.error('خطأ في تصدير Excel:', error);
      throw error;
    }
  }

  /**
   * تصدير البيانات إلى CSV
   * @param data - البيانات المراد تصديرها
   * @param columns - أعمدة الجدول
   * @param filename - اسم الملف
   * @param res - Express Response
   */
  async exportToCSV<T extends Record<string, any>>(
    data: T[],
    columns: { header: string; key: keyof T }[],
    filename: string,
    res: Response,
  ): Promise<void> {
    try {
      // إنشاء Workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      // تعريف الأعمدة
      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key as string,
      }));

      // إضافة البيانات
      data.forEach((item) => {
        worksheet.addRow(item);
      });

      // إعداد Headers للتحميل
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.csv"`,
      );

      // كتابة الملف كـ CSV
      await workbook.csv.write(res);
      res.end();

      this.logger.log(`تم تصدير التقرير إلى CSV: ${filename}`);
    } catch (error) {
      this.logger.error('خطأ في تصدير CSV:', error);
      throw error;
    }
  }

  /**
   * إنشاء ملف Excel متقدم مع عدة Sheets
   * @param sheets - مصفوفة من الـ Sheets
   * @param filename - اسم الملف
   * @param res - Express Response
   */
  async exportMultiSheetExcel(
    sheets: Array<{
      name: string;
      data: any[];
      columns: { header: string; key: string; width?: number }[];
    }>,
    filename: string,
    res: Response,
  ): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ERP System';
      workbook.created = new Date();

      // إضافة كل Sheet
      sheets.forEach((sheetConfig) => {
        const worksheet = workbook.addWorksheet(sheetConfig.name);

        // تعريف الأعمدة
        worksheet.columns = sheetConfig.columns.map((col) => ({
          header: col.header,
          key: col.key,
          width: col.width || 15,
        }));

        // تنسيق الـ Header
        worksheet.getRow(1).font = {
          bold: true,
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        worksheet.getRow(1).alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };

        // إضافة البيانات
        sheetConfig.data.forEach((item) => {
          worksheet.addRow(item);
        });

        // تنسيق الحدود
        worksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };

            if (rowNumber > 1 && rowNumber % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' },
              };
            }
          });
        });

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      });

      // إعداد Headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}.xlsx"`,
      );

      // كتابة الملف
      await workbook.xlsx.write(res);
      res.end();

      this.logger.log(`تم تصدير التقرير متعدد الصفحات: ${filename}`);
    } catch (error) {
      this.logger.error('خطأ في تصدير Multi-Sheet Excel:', error);
      throw error;
    }
  }

  /**
   * إنشاء Buffer من Excel (للحفظ في Storage)
   * @param data - البيانات
   * @param columns - الأعمدة
   * @param sheetName - اسم الورقة
   * @returns Buffer
   */
  async createExcelBuffer<T extends Record<string, any>>(
    data: T[],
    columns: { header: string; key: keyof T; width?: number }[],
    sheetName: string,
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key as string,
        width: col.width || 15,
      }));

      // تنسيق الـ Header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      data.forEach((item) => {
        worksheet.addRow(item);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer as unknown as Buffer;
    } catch (error) {
      this.logger.error('خطأ في إنشاء Excel Buffer:', error);
      throw error;
    }
  }

  /**
   * تنسيق القيم المالية في Excel
   */
  formatCurrency(worksheet: ExcelJS.Worksheet, columnKey: string): void {
    worksheet.getColumn(columnKey).numFmt = '#,##0.00';
  }

  /**
   * تنسيق التواريخ في Excel
   */
  formatDate(worksheet: ExcelJS.Worksheet, columnKey: string): void {
    worksheet.getColumn(columnKey).numFmt = 'dd/mm/yyyy';
  }

  /**
   * تنسيق النسب المئوية في Excel
   */
  formatPercentage(worksheet: ExcelJS.Worksheet, columnKey: string): void {
    worksheet.getColumn(columnKey).numFmt = '0.00%';
  }
}
