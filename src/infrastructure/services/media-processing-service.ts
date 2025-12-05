/**
 * Media Processing Service
 * Handles image thumbnails, metadata extraction, and file optimization
 * Requirements: Content Management 5.1, 5.2, 5.3, 5.4, 5.5
 */

import sharp from 'sharp';
import { getFileStorageService, type FileRecord } from './file-storage-service';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?: number;
  space?: string;
  channels?: number;
  depth?: string;
}

export interface OptimizeOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedImage {
  data: Buffer;
  metadata: ImageMetadata;
  contentType: string;
}

export class MediaProcessingService {
  private fileStorageService = getFileStorageService();

  /**
   * Generate thumbnail for an image
   * Requirement: 5.1 - Generate thumbnails for images
   */
  async generateThumbnail(
    imageData: Buffer,
    options: ThumbnailOptions = {}
  ): Promise<Buffer> {
    const {
      width = 200,
      height = 200,
      fit = 'cover',
      quality = 80,
      format = 'jpeg',
    } = options;

    const thumbnail = await sharp(imageData)
      .resize(width, height, { fit })
      .toFormat(format, { quality })
      .toBuffer();

    return thumbnail;
  }

  /**
   * Generate thumbnail from file ID
   */
  async generateThumbnailFromFile(
    fileId: string,
    options: ThumbnailOptions = {}
  ): Promise<ProcessedImage> {
    const file = await this.fileStorageService.getFile(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // Validate it's an image
    if (!this.isImageFile(file.type)) {
      throw new Error('File is not an image');
    }

    // Download file data (in real implementation, fetch from storage)
    // For now, we'll assume we have the data
    throw new Error('Not implemented: fetch file data from storage');
  }

  /**
   * Extract metadata from image
   * Requirement: 5.3 - Extract metadata
   */
  async extractImageMetadata(imageData: Buffer): Promise<ImageMetadata> {
    const metadata = await sharp(imageData).metadata();

    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
      size: metadata.size ?? 0,
      hasAlpha: metadata.hasAlpha ?? false,
      orientation: metadata.orientation,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
    };
  }

  /**
   * Optimize image file size
   * Requirement: 5.4 - Optimize file sizes
   */
  async optimizeImage(
    imageData: Buffer,
    options: OptimizeOptions = {}
  ): Promise<ProcessedImage> {
    const { quality = 80, maxWidth, maxHeight, format } = options;

    let pipeline = sharp(imageData);

    // Resize if dimensions specified
    if (maxWidth || maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Get metadata before conversion
    const metadata = await pipeline.metadata();
    const outputFormat =
      format ?? (metadata.format as 'jpeg' | 'png' | 'webp') ?? 'jpeg';

    // Convert and optimize
    const optimized = await pipeline
      .toFormat(outputFormat, { quality })
      .toBuffer();

    const finalMetadata = await this.extractImageMetadata(optimized);

    return {
      data: optimized,
      metadata: finalMetadata,
      contentType: this.getContentTypeForFormat(outputFormat),
    };
  }

  /**
   * Batch process multiple images
   * Requirement: 5.5 - Support batch operations
   */
  async batchProcessImages(
    images: Array<{ data: Buffer; filename: string }>,
    operation: 'thumbnail' | 'optimize',
    options: ThumbnailOptions | OptimizeOptions = {}
  ): Promise<
    Array<{ filename: string; result: Buffer | ProcessedImage; error?: string }>
  > {
    const results = await Promise.allSettled(
      images.map(async (image) => {
        if (operation === 'thumbnail') {
          const result = await this.generateThumbnail(
            image.data,
            options as ThumbnailOptions
          );
          return { filename: image.filename, result };
        } else {
          const result = await this.optimizeImage(
            image.data,
            options as OptimizeOptions
          );
          return { filename: image.filename, result };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          filename: images[index].filename,
          result: Buffer.from([]),
          error: result.reason?.message ?? 'Unknown error',
        };
      }
    });
  }

  /**
   * Convert image format
   */
  async convertImageFormat(
    imageData: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 80
  ): Promise<Buffer> {
    return sharp(imageData).toFormat(targetFormat, { quality }).toBuffer();
  }

  /**
   * Validate if file is an image
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Get content type for image format
   */
  private getContentTypeForFormat(format: string): string {
    const contentTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };

    return contentTypes[format.toLowerCase()] ?? 'application/octet-stream';
  }

  /**
   * Get image dimensions without loading full image
   */
  async getImageDimensions(
    imageData: Buffer
  ): Promise<{ width: number; height: number }> {
    const metadata = await sharp(imageData).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };
  }

  /**
   * Create multiple sizes of an image
   */
  async createImageSizes(
    imageData: Buffer,
    sizes: Array<{ name: string; width: number; height?: number }>
  ): Promise<
    Array<{ name: string; data: Buffer; width: number; height: number }>
  > {
    const results = await Promise.all(
      sizes.map(async (size) => {
        const resized = await sharp(imageData)
          .resize(size.width, size.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toBuffer();

        const metadata = await sharp(resized).metadata();

        return {
          name: size.name,
          data: resized,
          width: metadata.width ?? size.width,
          height: metadata.height ?? size.height ?? 0,
        };
      })
    );

    return results;
  }
}

/**
 * Singleton instance
 */
let serviceInstance: MediaProcessingService | null = null;

/**
 * Get media processing service instance
 */
export function getMediaProcessingService(): MediaProcessingService {
  if (!serviceInstance) {
    serviceInstance = new MediaProcessingService();
  }
  return serviceInstance;
}
