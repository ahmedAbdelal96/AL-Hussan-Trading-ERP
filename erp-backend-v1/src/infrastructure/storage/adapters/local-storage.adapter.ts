/**
 * Local Storage Adapter
 * Stores files on local disk
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { IStorageAdapter, FileMetadata } from '../storage.interface';

@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly uploadPath: string;
  private readonly baseUrl: string;

  constructor() {
    // Default to uploads folder in project root
    this.uploadPath = resolve(
      process.env.UPLOAD_PATH || join(process.cwd(), 'uploads'),
    );
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Validates and resolves file path to prevent directory traversal attacks.
   * Ensures the resolved path stays within the upload directory.
   */
  private safePath(filePath: string): string {
    const fullPath = resolve(this.uploadPath, filePath);
    const relativePath = relative(this.uploadPath, fullPath);

    // If the relative path starts with '..' or is absolute, it's a traversal attempt
    if (
      relativePath.startsWith('..') ||
      resolve(relativePath) === relativePath
    ) {
      this.logger.warn(`Path traversal attempt blocked: ${filePath}`);
      throw new BadRequestException('Invalid file path');
    }

    return fullPath;
  }

  async upload(
    file: Buffer,
    path: string,
    _metadata?: FileMetadata,
  ): Promise<string> {
    void _metadata;
    const fullPath = this.safePath(path);

    try {
      // Create directory if doesn't exist
      await fs.mkdir(dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(fullPath, file);

      this.logger.log(`File uploaded: ${path}`);

      return path;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${path}`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async delete(path: string): Promise<void> {
    const fullPath = this.safePath(path);

    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${path}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(`Failed to delete file: ${path}`, error);
        throw new Error(`File deletion failed: ${error.message}`);
      }
      // File doesn't exist - that's okay
    }
  }

  async get(path: string): Promise<Buffer> {
    const fullPath = this.safePath(path);

    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      this.logger.error(`Failed to read file: ${path}`, error);
      throw new Error(`File not found: ${path}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.safePath(path);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(path: string): string {
    // Return URL for file download
    return `${this.baseUrl}/api/v1/files/${path}`;
  }
}
