/**
 * File storage factory and utilities
 * Requirements: 1.1, 1.2, 1.3
 */

import path from 'path';
import { storageConfig } from '../config';
import { S3Storage } from './s3-storage';
import { LocalStorage } from './local-storage';
import type { FileStorage } from './types';

export * from './types';
export { S3Storage } from './s3-storage';
export { LocalStorage } from './local-storage';

/**
 * Create a file storage instance based on configuration
 */
export function createFileStorage(): FileStorage {
  const provider = storageConfig.provider();

  switch (provider) {
    case 's3':
    case 'r2': {
      const accessKeyId = storageConfig.accessKeyId();
      const secretAccessKey = storageConfig.secretAccessKey();

      if (!accessKeyId || !secretAccessKey) {
        throw new Error(
          `STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY are required for ${provider} storage`
        );
      }

      return new S3Storage({
        region: storageConfig.region(),
        bucket: storageConfig.bucket(),
        accessKeyId,
        secretAccessKey,
        endpoint: storageConfig.endpoint(),
        publicUrl: storageConfig.publicUrl(),
        forcePathStyle: storageConfig.forcePathStyle(),
      });
    }

    case 'local': {
      // For local storage, use public/uploads directory
      const basePath = path.join(process.cwd(), 'public', 'uploads');
      return new LocalStorage({
        basePath,
        publicUrl: '/uploads',
      });
    }

    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}

/**
 * Singleton storage instance
 */
let storageInstance: FileStorage | null = null;

/**
 * Get the file storage instance
 */
export function getFileStorage(): FileStorage {
  if (!storageInstance) {
    storageInstance = createFileStorage();
  }
  return storageInstance;
}

/**
 * Generate a unique file key with optional prefix
 */
export function generateFileKey(filename: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  const sanitized = basename.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();

  const key = `${sanitized}-${timestamp}-${random}${ext}`;

  return prefix ? `${prefix}/${key}` : key;
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(
  filename: string,
  allowedTypes: string[]
): boolean {
  const ext = path.extname(filename).toLowerCase();
  return allowedTypes.some((type) => {
    if (type.startsWith('.')) {
      return ext === type.toLowerCase();
    }
    return ext === `.${type.toLowerCase()}`;
  });
}

/**
 * Get content type from filename
 */
export function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();

  const contentTypes: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',

    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',

    // Video
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',

    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',

    // Archives
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.7z': 'application/x-7z-compressed',

    // Other
    '.json': 'application/json',
    '.xml': 'application/xml',
  };

  return contentTypes[ext] ?? 'application/octet-stream';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate file size against maximum allowed size
 */
export function validateFileSize(size: number, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxSizeInBytes;
}
