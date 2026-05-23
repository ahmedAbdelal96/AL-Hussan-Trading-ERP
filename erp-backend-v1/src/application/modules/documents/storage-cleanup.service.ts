/**
 * Storage Cleanup Service
 * Removes orphaned files (files on disk without DB record)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class StorageCleanupService {
  private readonly logger = new Logger(StorageCleanupService.name);
  private readonly uploadPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    this.uploadPath = process.env.UPLOAD_PATH || join(process.cwd(), 'uploads');
  }

  /**
   * Run cleanup every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOrphanedFiles() {
    this.logger.log('Starting orphaned files cleanup...');

    try {
      const orphanedFiles = await this.findOrphanedFiles();

      if (orphanedFiles.length === 0) {
        this.logger.log('No orphaned files found');
        return;
      }

      this.logger.log(`Found ${orphanedFiles.length} orphaned files`);

      // Delete orphaned files
      let deletedCount = 0;
      for (const filePath of orphanedFiles) {
        try {
          await this.storageService.deleteFile(filePath);
          deletedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to delete orphaned file: ${filePath}`,
            error,
          );
        }
      }

      this.logger.log(
        `Cleanup completed: ${deletedCount}/${orphanedFiles.length} files deleted`,
      );
    } catch (error) {
      this.logger.error('Cleanup job failed', error);
    }
  }

  /**
   * Find files on disk that don't have DB records
   */
  private async findOrphanedFiles(): Promise<string[]> {
    const orphanedFiles: string[] = [];

    // Get all file paths from database
    const dbFiles = await this.getAllDbFilePaths();
    const dbFileSet = new Set(dbFiles);

    // Scan uploads directory
    const diskFiles = await this.scanUploadDirectory();

    // Find files on disk but not in DB
    for (const diskFile of diskFiles) {
      if (!dbFileSet.has(diskFile)) {
        orphanedFiles.push(diskFile);
      }
    }

    return orphanedFiles;
  }

  /**
   * Get all file paths from all document tables
   */
  private async getAllDbFilePaths(): Promise<string[]> {
    const filePaths: string[] = [];

    // Employee documents
    const employeeDocs = await this.prisma.employeeDocument.findMany({
      select: { filePath: true },
    });
    filePaths.push(...employeeDocs.map((doc) => doc.filePath));

    // TODO: Add other entity document tables when implemented
    // const assetDocs = await this.prisma.assetDocument.findMany({...});
    // const projectDocs = await this.prisma.projectDocument.findMany({...});

    return filePaths;
  }

  /**
   * Recursively scan upload directory for all files
   */
  private async scanUploadDirectory(
    dir: string = this.uploadPath,
    baseDir: string = this.uploadPath,
  ): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanUploadDirectory(fullPath, baseDir);
          files.push(...subFiles);
        } else {
          // Get relative path (same format as DB)
          const relativePath = fullPath
            .substring(baseDir.length + 1)
            .replace(/\\/g, '/');
          files.push(relativePath);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to scan directory: ${dir}`, error);
    }

    return files;
  }

  /**
   * Manual cleanup trigger (for admin use)
   */
  async manualCleanup(): Promise<{
    orphanedFiles: string[];
    deletedCount: number;
  }> {
    this.logger.log('Manual cleanup triggered');

    const orphanedFiles = await this.findOrphanedFiles();

    if (orphanedFiles.length === 0) {
      return { orphanedFiles: [], deletedCount: 0 };
    }

    let deletedCount = 0;
    for (const filePath of orphanedFiles) {
      try {
        await this.storageService.deleteFile(filePath);
        deletedCount++;
      } catch (error) {
        this.logger.error(`Failed to delete: ${filePath}`, error);
      }
    }

    return { orphanedFiles, deletedCount };
  }
}
