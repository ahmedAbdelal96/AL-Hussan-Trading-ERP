/**
 * ============================================================================
 * AUDIT LOGS CLEANUP SERVICE
 * ============================================================================
 *
 * Handles automatic archiving and deletion of old audit logs.
 * Prevents database bloating and maintains performance.
 *
 * Features:
 * - Archive logs older than retention period
 * - Delete logs after archival period
 * - Export to JSON files for long-term storage
 * - Configurable retention policies
 *
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class AuditLogsCleanupService {
  private readonly logger = new Logger(AuditLogsCleanupService.name);

  // Configurable retention policies (in days)
  private readonly RETENTION_PERIOD = 180; // 6 months - keep in database
  private readonly ARCHIVE_PERIOD = 730; // 2 years - keep archived files
  private readonly ARCHIVE_PATH = path.join(
    process.cwd(),
    'archives',
    'audit-logs',
  );

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Run cleanup every day at 2 AM
   * Adjust cron expression as needed
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleScheduledCleanup() {
    this.logger.log('🧹 Starting scheduled audit logs cleanup...');

    try {
      const archived = await this.archiveOldLogs();
      const deleted = await this.deleteArchivedLogs();

      this.logger.log(
        `✅ Cleanup completed: ${archived} logs archived, ${deleted} logs deleted`,
      );
    } catch (error) {
      this.logger.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Archive logs older than retention period
   */
  async archiveOldLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_PERIOD);

    this.logger.log(
      `📦 Archiving logs older than ${cutoffDate.toISOString()}...`,
    );

    // Fetch logs to archive in batches
    const BATCH_SIZE = 1000;
    let totalArchived = 0;
    let hasMore = true;

    while (hasMore) {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
        take: BATCH_SIZE,
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (logs.length === 0) {
        hasMore = false;
        break;
      }

      // Export to JSON file
      await this.exportLogsToFile(logs, cutoffDate);

      // Delete from database after successful export
      const logIds = logs.map((log) => log.id);
      await this.prisma.auditLog.deleteMany({
        where: {
          id: {
            in: logIds,
          },
        },
      });

      totalArchived += logs.length;
      this.logger.log(`   Archived ${totalArchived} logs so far...`);
    }

    return totalArchived;
  }

  /**
   * Delete archived files older than archive period
   */
  async deleteArchivedLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ARCHIVE_PERIOD);

    this.logger.log(
      `🗑️  Deleting archived files older than ${cutoffDate.toISOString()}...`,
    );

    try {
      // Ensure archive directory exists
      await fs.mkdir(this.ARCHIVE_PATH, { recursive: true });

      // List all archive files
      const files = await fs.readdir(this.ARCHIVE_PATH);
      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.ARCHIVE_PATH, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          this.logger.log(`   Deleted archive file: ${file}`);
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.error('Error deleting archived files:', error);
      return 0;
    }
  }

  /**
   * Export logs to JSON file
   */
  private async exportLogsToFile(
    logs: Array<{ id: string; createdAt: Date } & Record<string, unknown>>,
    referenceDate: Date,
  ) {
    try {
      // Create year-month directory structure
      const year = referenceDate.getFullYear();
      const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
      const dirPath = path.join(this.ARCHIVE_PATH, String(year), month);

      await fs.mkdir(dirPath, { recursive: true });

      // Create filename with timestamp
      const timestamp = referenceDate.toISOString().split('T')[0];
      const filename = `audit-logs-${timestamp}-${Date.now()}.json`;
      const filePath = path.join(dirPath, filename);

      // Write logs to file
      await fs.writeFile(
        filePath,
        JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            logsCount: logs.length,
            logs,
          },
          null,
          2,
        ),
        'utf-8',
      );

      this.logger.log(`   Exported ${logs.length} logs to ${filename}`);
    } catch (error) {
      this.logger.error('Error exporting logs to file:', error);
      throw error;
    }
  }

  /**
   * Manual cleanup (can be triggered via API)
   */
  async manualCleanup(retentionDays?: number) {
    const originalRetention = this.RETENTION_PERIOD;

    if (retentionDays) {
      // Temporarily override retention period
      (this as any).RETENTION_PERIOD = retentionDays;
    }

    try {
      const archived = await this.archiveOldLogs();
      return {
        success: true,
        logsArchived: archived,
        message: `Successfully archived ${archived} logs older than ${retentionDays || originalRetention} days`,
      };
    } finally {
      // Restore original retention period
      (this as any).RETENTION_PERIOD = originalRetention;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_PERIOD);

    const [totalLogs, logsToArchive, oldestLog, newestLog] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      }),
      this.prisma.auditLog.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Get archive directory size
    let archiveFiles = 0;
    try {
      const files = await fs.readdir(this.ARCHIVE_PATH, { recursive: true });
      archiveFiles = files.filter((f) => String(f).endsWith('.json')).length;
      // Note: For size, you'd need to stat each file
    } catch {
      // Directory doesn't exist yet
    }

    return {
      totalLogsInDatabase: totalLogs,
      logsEligibleForArchival: logsToArchive,
      oldestLogDate: oldestLog?.createdAt,
      newestLogDate: newestLog?.createdAt,
      retentionPolicyDays: this.RETENTION_PERIOD,
      archivePolicyDays: this.ARCHIVE_PERIOD,
      archivedFiles: archiveFiles,
      archivePath: this.ARCHIVE_PATH,
    };
  }
}
