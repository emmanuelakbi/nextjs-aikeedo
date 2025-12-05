/**
 * Generate Image Use Case
 *
 * Handles image generation with credit management and storage.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 7.3, 7.4
 */

import { GenerateImageCommand } from '../../commands/ai/GenerateImageCommand';
import { getAIServiceFactory } from '../../../lib/ai/factory';
import { calculateImageCredits } from '../../../lib/ai/credit-calculator';
import {
  CreditDeductionService,
  InsufficientCreditsError,
} from '../../../infrastructure/services/CreditDeductionService';
import { prisma } from '../../../lib/db';
import type { ImageGenerationResponse } from '../../../lib/ai/types';
import type { ImageSize } from '../../../lib/ai/interfaces/image-generation-service';

export interface ImageResult {
  id: string;
  url: string;
  width: number;
  height: number;
  model: string;
  provider: string;
  credits: number;
}

export class GenerateImageUseCase {
  private creditService: CreditDeductionService;

  constructor() {
    this.creditService = new CreditDeductionService();
  }

  async execute(command: GenerateImageCommand): Promise<ImageResult> {
    // Calculate credits needed
    const size = (command.size || '1024x1024') as ImageSize;
    const estimatedCredits = calculateImageCredits(size, command.n);

    // Validate sufficient credits
    const hasCredits = await this.creditService.validateCredits(
      command.workspaceId,
      estimatedCredits
    );

    if (!hasCredits) {
      const balance = await this.creditService.getCreditBalance(
        command.workspaceId
      );
      throw new InsufficientCreditsError(
        command.workspaceId,
        estimatedCredits,
        balance.available
      );
    }

    // Allocate credits
    const allocation = await this.creditService.allocateCredits(
      command.workspaceId,
      estimatedCredits
    );

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        workspaceId: command.workspaceId,
        userId: command.userId,
        type: 'IMAGE',
        model: command.model,
        provider: command.provider,
        prompt: command.prompt,
        status: 'PENDING',
        credits: estimatedCredits,
      },
    });

    try {
      // Create AI service
      const factory = getAIServiceFactory();
      const imageService = factory.createImageService(
        command.provider,
        command.model
      );

      // Generate image
      const response: ImageGenerationResponse =
        await imageService.generateImage(command.prompt, {
          size: command.size,
          style: command.style,
          quality: command.quality,
          n: 1, // Generate one image at a time
        });

      // Calculate actual credits used
      const actualCredits = response.metadata.credits;

      // Release the estimated allocation
      await this.creditService.releaseCredits(
        command.workspaceId,
        estimatedCredits
      );

      // Consume actual credits
      await this.creditService.consumeCredits(
        command.workspaceId,
        actualCredits
      );

      // Update generation record with success
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          result: response.url,
          status: 'COMPLETED',
          credits: actualCredits,
          completedAt: new Date(),
        },
      });

      return {
        id: generation.id,
        url: response.url,
        width: response.width,
        height: response.height,
        model: response.metadata.model,
        provider: response.metadata.provider,
        credits: actualCredits,
      };
    } catch (error) {
      // Release allocated credits on failure
      await this.creditService.releaseCredits(
        command.workspaceId,
        estimatedCredits
      );

      // Update generation record with failure
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Generate multiple images
   * Requirements: 4.1
   */
  async executeMultiple(command: GenerateImageCommand): Promise<ImageResult[]> {
    const count = command.n || 1;

    if (count === 1) {
      const result = await this.execute(command);
      return [result];
    }

    // Generate images sequentially to handle credit management properly
    const results: ImageResult[] = [];

    for (let i = 0; i < count; i++) {
      const result = await this.execute({
        ...command,
        n: 1,
      });
      results.push(result);
    }

    return results;
  }
}
