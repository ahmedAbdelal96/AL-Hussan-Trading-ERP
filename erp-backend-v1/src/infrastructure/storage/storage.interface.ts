/**
 * Storage Interface
 * Defines contract for file storage adapters
 */

export interface IStorageAdapter {
  /**
   * Upload file to storage
   * @param file - File buffer
   * @param path - Storage path (e.g., 'employees/EMP-001/001.jpg')
   * @param metadata - Additional file metadata
   * @returns Full file URL/path
   */
  upload(file: Buffer, path: string, metadata?: FileMetadata): Promise<string>;

  /**
   * Delete file from storage
   * @param path - File path to delete
   */
  delete(path: string): Promise<void>;

  /**
   * Get file from storage
   * @param path - File path
   * @returns File buffer
   */
  get(path: string): Promise<Buffer>;

  /**
   * Check if file exists
   * @param path - File path
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file URL (for download/preview)
   * @param path - File path
   */
  getUrl(path: string): string;
}

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  entityType?: string;
  entityId?: string;
}

export interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  namingStrategy?: NamingStrategy;
}

export enum NamingStrategy {
  ORIGINAL = 'original',
  UUID = 'uuid',
  TIMESTAMP = 'timestamp',
  CUSTOM = 'custom',
}

export interface StorageConfig {
  adapter: 'local' | 's3';
  local?: {
    uploadPath: string;
    baseUrl: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}
