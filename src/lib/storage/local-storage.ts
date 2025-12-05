/**
 * Local file system storage implementation
 * For development and testing purposes
 * Requirements: 1.1, 1.2, 1.3
 */

import { promises as fs } from 'fs';
import path from 'path';
import type {
  FileStorage,
  FileMetadata,
  UploadOptions,
  PresignedUrlOptions,
} from './types';

export interface LocalStorageConfig {
  basePath: string;
  publicUrl?: string;
}

export class LocalStorage implements FileStorage {
  private basePath: string;
  private publicUrl: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath;
    this.publicUrl = config.publicUrl ?? '/uploads';
  }

  private getFilePath(key: string): string {
    return path.join(this.basePath, key);
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    _options?: UploadOptions
  ): Promise<string> {
    const filePath = this.getFilePath(key);
    await this.ensureDirectory(filePath);
    await fs.writeFile(filePath, data);
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.unlink(filePath);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    const filePath = this.getFilePath(key);
    const stats = await fs.stat(filePath);

    return {
      contentLength: stats.size,
      lastModified: stats.mtime,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
  }

  async getPresignedUploadUrl(
    key: string,
    _options?: PresignedUrlOptions
  ): Promise<string> {
    // For local storage, return the public URL
    // In a real implementation, you might generate a temporary token
    return this.getPublicUrl(key);
  }

  async getPresignedDownloadUrl(
    key: string,
    _options?: PresignedUrlOptions
  ): Promise<string> {
    // For local storage, return the public URL
    return this.getPublicUrl(key);
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<string[]> {
    const searchPath = prefix ? this.getFilePath(prefix) : this.basePath;

    try {
      const files: string[] = [];
      await this.listRecursive(searchPath, this.basePath, files, maxKeys);
      return files;
    } catch {
      return [];
    }
  }

  private async listRecursive(
    dir: string,
    basePath: string,
    files: string[],
    maxKeys: number
  ): Promise<void> {
    if (files.length >= maxKeys) return;

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= maxKeys) break;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.listRecursive(fullPath, basePath, files, maxKeys);
      } else {
        const relativePath = path.relative(basePath, fullPath);
        files.push(relativePath);
      }
    }
  }
}
