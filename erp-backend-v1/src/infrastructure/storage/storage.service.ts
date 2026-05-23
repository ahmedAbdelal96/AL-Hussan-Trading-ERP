/**
 * Storage Service
 * Main service for file upload/download operations
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IStorageAdapter, UploadOptions } from './storage.interface';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';

interface UploadedFileNormalized {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly adapter: IStorageAdapter;

  constructor() {
    // For now, always use LocalStorageAdapter
    // Later: Inject based on config (local vs S3)
    this.adapter = new LocalStorageAdapter();
  }

  /**
   * Generate file path based on entity
   * Example: employees/EMP-001/EMP-001-001.jpg
   */
  generatePath(
    entityType: string,
    entityCode: string,
    fileName: string,
  ): string {
    return `${entityType}/${entityCode}/${fileName}`;
  }

  /**
   * Generate sequential file name
   * Example: EMP-001-001.jpg, EMP-001-002.pdf
   */
  generateFileName(
    prefix: string,
    index: number,
    originalName: string,
  ): string {
    const extension = originalName.split('.').pop();
    const serial = String(index + 1).padStart(3, '0');
    return `${prefix}-${serial}.${extension}`;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: UploadedFileNormalized, options?: UploadOptions): void {
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // Default 10MB
    const allowedTypes = options?.allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // Check file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Check file type
    if (!allowedTypes.includes(file.mimeType)) {
      throw new BadRequestException(
        `File type ${file.mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private normalizeUploadedFile(file: unknown): UploadedFileNormalized {
    if (!file || typeof file !== 'object') {
      throw new BadRequestException('Invalid uploaded file payload');
    }

    const payload = file as Record<string, unknown>;
    const originalName =
      typeof payload.originalname === 'string' ? payload.originalname : '';
    const mimeType =
      typeof payload.mimetype === 'string' ? payload.mimetype : '';
    const size =
      typeof payload.size === 'number'
        ? payload.size
        : Number(payload.size ?? 0);
    const buffer = Buffer.isBuffer(payload.buffer)
      ? payload.buffer
      : Buffer.from([]);

    return {
      originalName,
      mimeType,
      size,
      buffer,
    };
  }

  /**
   * Upload single file
   */
  async uploadFile(
    file: unknown,
    entityType: string,
    entityCode: string,
    index: number,
    options?: UploadOptions,
  ): Promise<{
    fileName: string;
    filePath: string;
    fileUrl: string;
    size: number;
    mimeType: string;
  }> {
    const normalizedFile = this.normalizeUploadedFile(file);

    // Validate file
    this.validateFile(normalizedFile, options);

    // Generate file name
    const fileName = this.generateFileName(
      entityCode,
      index,
      normalizedFile.originalName,
    );

    // Generate storage path
    const filePath = this.generatePath(entityType, entityCode, fileName);

    // Upload to storage
    await this.adapter.upload(normalizedFile.buffer, filePath, {
      originalName: normalizedFile.originalName,
      mimeType: normalizedFile.mimeType,
      size: normalizedFile.size,
      entityType,
      entityId: entityCode,
    });

    // Get file URL
    const fileUrl = this.adapter.getUrl(filePath);

    this.logger.log(`File uploaded successfully: ${filePath}`);

    return {
      fileName,
      filePath,
      fileUrl,
      size: normalizedFile.size,
      mimeType: normalizedFile.mimeType,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: unknown[],
    entityType: string,
    entityCode: string,
    startIndex: number = 0,
    options?: UploadOptions,
  ): Promise<
    Array<{
      fileName: string;
      filePath: string;
      fileUrl: string;
      size: number;
      mimeType: string;
    }>
  > {
    const results: Array<{
      fileName: string;
      filePath: string;
      fileUrl: string;
      size: number;
      mimeType: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(
        files[i],
        entityType,
        entityCode,
        startIndex + i,
        options,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    await this.adapter.delete(filePath);
    this.logger.log(`File deleted: ${filePath}`);
  }

  /**
   * Get file
   */
  async getFile(filePath: string): Promise<Buffer> {
    return await this.adapter.get(filePath);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    return await this.adapter.exists(filePath);
  }

  /**
   * Get file URL
   */
  getFileUrl(filePath: string): string {
    return this.adapter.getUrl(filePath);
  }
}
