/**
 * File storage types and interfaces
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

/**
 * Storage provider types
 */
export type StorageProvider = 's3' | 'r2' | 'local';

/**
 * File metadata
 */
export interface FileMetadata {
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
  [key: string]: unknown;
}

/**
 * Upload options
 */
export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: 'private' | 'public-read';
}

/**
 * Presigned URL options
 */
export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  contentDisposition?: string;
}

/**
 * File storage interface
 */
export interface FileStorage {
  /**
   * Upload a file to storage
   */
  upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<string>;

  /**
   * Download a file from storage
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<FileMetadata>;

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string;

  /**
   * Generate a presigned URL for upload
   */
  getPresignedUploadUrl(
    key: string,
    options?: PresignedUrlOptions
  ): Promise<string>;

  /**
   * Generate a presigned URL for download
   */
  getPresignedDownloadUrl(
    key: string,
    options?: PresignedUrlOptions
  ): Promise<string>;

  /**
   * List files with a prefix
   */
  list(prefix?: string, maxKeys?: number): Promise<string[]>;
}
