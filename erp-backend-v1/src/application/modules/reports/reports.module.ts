/**
 * ============================================================================
 * REPORTS MODULE - INFRASTRUCTURE LAYER
 * ============================================================================
 *
 * البنية التحتية الأساسية لموديول التقارير
 * يوفر الخدمات الأساسية والـ DTOs المشتركة لجميع فئات التقارير
 *
 * Core Services:
 * - BaseReportService: Utilities (pagination, filtering, calculations, date handling)
 * - ExportService: Export to Excel/CSV/PDF with professional styling
 *
 * Usage:
 * كل فئة تقارير (Finance, Payroll, Projects, etc.) ستقوم بعمل import لهذا الموديول
 * واستخدام الخدمات الأساسية بدون تكرار الكود
 *
 * @module ReportsModule
 * @version 1.0.0
 * @author ERP System Team
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { BaseReportService } from './services/base-report.service';
import { ExportService } from './services/export.service';

/**
 * Reports Infrastructure Module
 *
 * Base module that provides shared services for all report categories.
 * Does NOT include controllers - each report category will have its own module with controllers.
 *
 * Example: FinanceReportsModule will import ReportsModule to use BaseReportService & ExportService
 */
@Module({
  imports: [
    DatabaseModule, // Provides PrismaService for database access
  ],
  providers: [
    BaseReportService, // Common utilities for all reports
    ExportService, // Export functionality
  ],
  exports: [
    BaseReportService, // Available for report category modules
    ExportService, // Available for report category modules
  ],
})
export class ReportsModule {}
