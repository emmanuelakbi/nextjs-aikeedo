/**
 * Pollinations.ai Image Generation Service
 * 
 * Free image generation using Pollinations.ai API (no API key required)
 * Uses Flux and other open-source models
 */

import type { ImageGenerationService, ImageGenerationOptions } from '../interfaces';
import type { ImageGenerationResponse, ImageSize } from '../types';

export class PollinationsImageGenerationService implements ImageGenerationService {
  private model: string;
  private maxRetries: number;
  private baseUrl = 'https://image.pollinations.ai/prompt';

  constructor(model: string = 'flux', maxRetries: number = 3) {
    this.model = model;
    this.maxRetries = maxRetries;
  }

  async generateImage(
    prompt: string,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    // Parse size
    const size = options?.size || '1024x1024';
    const [width, height] = size.split('x').map(Number);

    // Build the URL with parameters
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    
    // Pollinations URL format: https://image.pollinations.ai/prompt/{prompt}?width={w}&height={h}&seed={seed}&nologo=true
    const imageUrl = `${this.baseUrl}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    // Actually fetch the image to ensure it's generated (Pollinations generates on-demand)
    // This ensures the image is ready before returning the URL
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Use GET request to trigger image generation and wait for it
        const response = await fetch(imageUrl, { 
          method: 'GET',
          // We don't need the body, just need to trigger generation
        });
        
        if (response.ok) {
          // Check content-type to ensure we got an image
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('image/')) {
            // Calculate credits (free, but we track for consistency)
            const credits = this.calculateCredits(size);

            return {
              url: imageUrl,
              width,
              height,
              metadata: {
                model: 'flux',
                provider: 'pollinations',
                credits,
              },
            };
          }
        }
        lastError = new Error(`Image generation failed with status ${response.status}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        // Wait before retry
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Failed to generate image');
  }

  async generateImages(
    prompt: string,
    count: number,
    options?: ImageGenerationOptions
  ): Promise<ImageGenerationResponse[]> {
    const results: ImageGenerationResponse[] = [];
    
    // Generate images in parallel (with different seeds)
    const promises = Array.from({ length: count }, () => 
      this.generateImage(prompt, options)
    );

    const settled = await Promise.allSettled(promises);
    
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }

    if (results.length === 0) {
      throw new Error('Failed to generate any images');
    }

    return results;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'pollinations';
  }

  getSupportedSizes(): ImageSize[] {
    return ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
  }

  private calculateCredits(size: string): number {
    // Free service, but assign minimal credits for tracking
    const sizeCredits: Record<string, number> = {
      '256x256': 1,
      '512x512': 2,
      '1024x1024': 5,
      '1792x1024': 8,
      '1024x1792': 8,
    };
    return sizeCredits[size] || 5;
  }
}
