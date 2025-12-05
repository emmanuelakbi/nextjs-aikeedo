/**
 * File Storage Service
 * Handles file uploads and storage with database integration
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { PrismaClient } from '@prisma/client';
import {
  getFileStorage,
  generateFileKey,
  validateFileType,
  validateFileSize,
  getContentType,
  type UploadOptions,
  type PresignedUrlOptions,
} from '@/lib/storage';

const prisma = new PrismaClient();

export interface UploadFileInput {
  workspaceId: string;
  userId: string;
  filename: string;
  data: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
  prefix?: string;
}

export interface FileRecord {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storageKey: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSizeInMB?: number;
}

export class FileStorageService {
  private storage = getFileStorage();

  /**
   * Upload a file and create a database record
   */
  async uploadFile(input: UploadFileInput): Promise<FileRecord> {
    const {
      workspaceId,
      userId,
      filename,
      data,
      contentType,
      metadata,
      prefix,
    } = input;

    // Generate unique storage key
    const storageKey = generateFileKey(filename, prefix);

    // Determine content type
    const finalContentType = contentType ?? getContentType(filename);

    // Upload to storage
    const uploadOptions: UploadOptions = {
      contentType: finalContentType,
      metadata,
      acl: 'public-read',
    };

    const url = await this.storage.upload(storageKey, data, uploadOptions);

    // Create database record
    const file = await prisma.file.create({
      data: {
        workspaceId,
        userId,
        name: filename,
        type: finalContentType,
        size: data.length,
        url,
        storageKey,
        metadata: metadata ?? {},
      },
    });

    return this.mapToFileRecord(file);
  }

  /**
   * Validate file before upload
   */
  validateFile(
    filename: string,
    size: number,
    options?: FileValidationOptions
  ): { valid: boolean; error?: string } {
    const { allowedTypes, maxSizeInMB = 10 } = options ?? {};

    // Validate file type
    if (allowedTypes && !validateFileType(filename, allowedTypes)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Validate file size
    if (!validateFileSize(size, maxSizeInMB)) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSizeInMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string): Promise<FileRecord | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    return file ? this.mapToFileRecord(file) : null;
  }

  /**
   * Get files by workspace
   */
  async getFilesByWorkspace(
    workspaceId: string,
    limit: number = 50
  ): Promise<FileRecord[]> {
    const files = await prisma.file.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return files.map((file) => this.mapToFileRecord(file));
  }

  /**
   * Get files by user
   */
  async getFilesByUser(
    userId: string,
    limit: number = 50
  ): Promise<FileRecord[]> {
    const files = await prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return files.map((file) => this.mapToFileRecord(file));
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Delete from storage
    await this.storage.delete(file.storageKey);

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });
  }

  /**
   * Generate presigned upload URL
   */
  async generateUploadUrl(
    filename: string,
    options?: PresignedUrlOptions
  ): Promise<{ url: string; key: string }> {
    const key = generateFileKey(filename);
    const url = await this.storage.getPresignedUploadUrl(key, options);

    return { url, key };
  }

  /**
   * Generate presigned download URL
   */
  async generateDownloadUrl(
    fileId: string,
    options?: PresignedUrlOptions
  ): Promise<string> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    return this.storage.getPresignedDownloadUrl(file.storageKey, options);
  }

  /**
   * Check if file exists in storage
   */
  async fileExists(storageKey: string): Promise<boolean> {
    return this.storage.exists(storageKey);
  }

  /**
   * Map Prisma file to FileRecord
   */
  private mapToFileRecord(file: {
    id: string;
    workspaceId: string;
    userId: string;
    name: string;
    type: string;
    size: number;
    url: string;
    storageKey: string;
    metadata: unknown;
    createdAt: Date;
  }): FileRecord {
    return {
      id: file.id,
      workspaceId: file.workspaceId,
      userId: file.userId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.url,
      storageKey: file.storageKey,
      metadata: (file.metadata as Record<string, unknown>) ?? {},
      createdAt: file.createdAt,
    };
  }
}

/**
 * Singleton instance
 */
let serviceInstance: FileStorageService | null = null;

/**
 * Get file storage service instance
 */
export function getFileStorageService(): FileStorageService {
  if (!serviceInstance) {
    serviceInstance = new FileStorageService();
  }
  return serviceInstance;
}
