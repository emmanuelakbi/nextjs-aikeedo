/**
 * Image Generation Service Interface
 *
 * Provides image generation capabilities from text prompts.
 */

import type { ImageGenerationResponse, ImageSize } from '../types';

export type { ImageSize };

export type ImageStyle = 'natural' | 'vivid' | 'artistic' | 'photographic';

export type ImageQuality = 'standard' | 'hd';

export interface ImageGenerationOptions {
  /**
   * Image size/resolution
   */
  size?: ImageSize;

  /**
   * Image style
   */
  style?: ImageStyle;

  /**
   * Image quality
   */
  quality?: ImageQuality;

  /**
   * Number of images to generate
   */
  n?: number;

  /**
   * Response format (url or b64_json)
   */
  responseFormat?: 'url' | 'b64_json';
}

export interface ImageGenerationService {
  /**
   * Generate image from text prompt
   *
   * @param prompt - The text description of the desired image
   * @param options - Generation options
   * @returns Promise resolving to the generated image URL and metadata
   */
  generateImage(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse>;

  /**
   * Generate multiple images from text prompt
   *
   * @param prompt - The text description of the desired images
   * @param count - Number of images to generate
   * @param options - Generation options
   * @returns Promise resolving to array of generated images
   */
  generateImages(
    prompt: string,
    count: number,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse[]>;

  /**
   * Get the model identifier
   */
  getModel(): string;

  /**
   * Get the provider name
   */
  getProvider(): string;

  /**
   * Get supported image sizes for this provider
   */
  getSupportedSizes(): ImageSize[];
}
