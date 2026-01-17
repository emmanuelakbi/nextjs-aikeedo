/**
 * OpenAI Image Generation Service
 *
 * Implements image generation using OpenAI's DALL-E models.
 * Supports multiple sizes, styles, and quality settings with retry logic.
 */

import OpenAI from 'openai';
import type {
  ImageGenerationService,
  ImageGenerationOptions,
  ImageSize,
} from '../interfaces/image-generation-service';
import type { ImageGenerationResponse, ResponseMetadata } from '../types';
import { getEnv } from '@/lib/env';

export class OpenAIImageGenerationService implements ImageGenerationService {
  private client: OpenAI;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(model: string = 'dall-e-3', maxRetries: number = 3) {
    const env = getEnv();

    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.model = model;
    this.maxRetries = maxRetries;
    this.retryDelay = 1000;
  }

  async generateImage(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    return this.executeWithRetry(async () => {
      const response = await this.client.images.generate({
        model: this.model,
        prompt,
        size: this.mapSize(options?.size),
        quality: options?.quality || 'standard',
        style: this.mapStyle(options?.style),
        n: 1,
        response_format: options?.responseFormat || 'url',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image in OpenAI response');
      }

      const image = response.data[0];
      if (!image) {
        throw new Error('No image data in OpenAI response');
      }

      const url = image.url || image.b64_json || '';
      if (!url) {
        throw new Error('No URL or base64 data in OpenAI response');
      }

      const [width, height] = this.parseSizeString(
        options?.size || '1024x1024'
      );

      const metadata: ResponseMetadata = {
        model: this.model,
        provider: 'openai',
        credits: this.calculateCredits(options?.size, options?.quality),
      };

      return {
        url,
        width,
        height,
        metadata,
      };
    });
  }

  async generateImages(
    prompt: string,
    count: number,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse[]> {
    // DALL-E 3 only supports n=1, so we need to make multiple requests
    if (this.model === 'dall-e-3' && count > 1) {
      const promises = Array.from({ length: count }, () =>
        this.generateImage(prompt, options)
      );
      return Promise.all(promises);
    }

    // DALL-E 2 supports multiple images in one request
    return this.executeWithRetry(async () => {
      const response = await this.client.images.generate({
        model: this.model,
        prompt,
        size: this.mapSize(options?.size),
        n: Math.min(count, 10), // OpenAI max is 10
        response_format: options?.responseFormat || 'url',
      });

      const [width, height] = this.parseSizeString(
        options?.size || '1024x1024'
      );

      if (!response.data) {
        throw new Error('No images in OpenAI response');
      }

      return response.data.map((image) => {
        const url = image.url || image.b64_json || '';
        if (!url) {
          throw new Error('No URL or base64 data in OpenAI response');
        }

        const metadata: ResponseMetadata = {
          model: this.model,
          provider: 'openai',
          credits: this.calculateCredits(options?.size, options?.quality),
        };

        return {
          url,
          width,
          height,
          metadata,
        };
      });
    });
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'openai';
  }

  getSupportedSizes(): ImageSize[] {
    if (this.model === 'dall-e-3') {
      return ['1024x1024', '1792x1024', '1024x1792'];
    }
    // DALL-E 2
    return ['256x256', '512x512', '1024x1024'];
  }

  /**
   * Map our generic size to OpenAI's size format
   */
  private mapSize(
    size?: ImageSize
  ): '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' {
    if (!size) {
      return '1024x1024';
    }

    const supportedSizes = this.getSupportedSizes();
    if (!supportedSizes.includes(size)) {
      console.warn(
        `Size ${size} not supported by ${this.model}, using 1024x1024`
      );
      return '1024x1024';
    }

    return size as
      | '256x256'
      | '512x512'
      | '1024x1024'
      | '1792x1024'
      | '1024x1792';
  }

  /**
   * Map our generic style to OpenAI's style format
   */
  private mapStyle(style?: string): 'vivid' | 'natural' | undefined {
    if (!style || this.model !== 'dall-e-3') {
      return undefined;
    }

    if (style === 'vivid' || style === 'natural') {
      return style;
    }

    // Map other styles to closest match
    if (style === 'artistic') {
      return 'vivid';
    }
    if (style === 'photographic') {
      return 'natural';
    }

    return 'natural';
  }

  /**
   * Parse size string to width and height
   */
  private parseSizeString(size: string): [number, number] {
    const [width, height] = size.split('x').map(Number);
    return [width || 1024, height || 1024];
  }

  /**
   * Execute a function with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw this.handleError(error);
      }

      if (!this.isRetryableError(error)) {
        throw this.handleError(error);
      }

      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await this.sleep(delay);

      return this.executeWithRetry(fn, attempt + 1);
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof OpenAI.APIError) {
      return (
        error.status === 429 ||
        error.status === 408 ||
        error.status === 503 ||
        error.status === 500
      );
    }
    return false;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      return new Error(`OpenAI API Error (${error.status}): ${error.message}`);
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error('Unknown error occurred');
  }

  /**
   * Calculate credits based on image size and quality
   */
  private calculateCredits(size?: ImageSize, quality?: string): number {
    // Example pricing (adjust based on your model):
    // Standard quality: 1024x1024 = 10 credits
    // HD quality: 1024x1024 = 20 credits
    // Larger sizes cost more

    const baseCredits = 10;
    const qualityMultiplier = quality === 'hd' ? 2 : 1;

    let sizeMultiplier = 1;
    if (size === '1792x1024' || size === '1024x1792') {
      sizeMultiplier = 1.5;
    } else if (size === '512x512') {
      sizeMultiplier = 0.5;
    } else if (size === '256x256') {
      sizeMultiplier = 0.25;
    }

    return Math.ceil(baseCredits * qualityMultiplier * sizeMultiplier);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
