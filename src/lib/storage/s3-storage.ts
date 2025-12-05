/**
 * S3-compatible storage implementation
 * Supports AWS S3 and Cloudflare R2
 * Requirements: 1.1, 1.2, 1.3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  FileStorage,
  FileMetadata,
  UploadOptions,
  PresignedUrlOptions,
} from './types';

export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  publicUrl?: string;
  forcePathStyle?: boolean;
}

export class S3Storage implements FileStorage {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    this.client = new S3Client({
      region: config.region,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? false,
    });
  }

  async upload(
    key: string,
    data: Buffer | Uint8Array | string,
    options?: UploadOptions
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
      CacheControl: options?.cacheControl,
      ACL: options?.acl,
    });

    await this.client.send(command);
    return this.getPublicUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'NotFound'
      ) {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag,
      ...response.Metadata,
    };
  }

  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
    }

    // Default S3 URL format
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async getPresignedUploadUrl(
    key: string,
    options?: PresignedUrlOptions
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options?.contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600, // 1 hour default
    });
  }

  async getPresignedDownloadUrl(
    key: string,
    options?: PresignedUrlOptions
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: options?.contentDisposition,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600, // 1 hour default
    });
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.client.send(command);

    return (response.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => key !== undefined);
  }
}
