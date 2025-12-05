/**
 * Generate Speech Use Case
 *
 * Handles speech synthesis with credit management and audio storage.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.3, 7.4
 */

import { GenerateSpeechCommand } from '../../commands/ai/GenerateSpeechCommand';
import { getAIServiceFactory } from '../../../lib/ai/factory';
import { calculateSpeechCredits } from '../../../lib/ai/credit-calculator';
import {
  CreditDeductionService,
  InsufficientCreditsError,
} from '../../../infrastructure/services/CreditDeductionService';
import { VoiceService } from '../../../infrastructure/services/VoiceService';
import { VoiceRepository } from '../../../infrastructure/repositories/VoiceRepository';
import { prisma } from '../../../lib/db';
import type { SpeechSynthesisResponse } from '../../../lib/ai/types';

export interface SpeechResult {
  id: string;
  url: string;
  format: string;
  duration: number;
  model: string;
  provider: string;
  credits: number;
}

export class GenerateSpeechUseCase {
  private creditService: CreditDeductionService;

  constructor() {
    this.creditService = new CreditDeductionService();
  }

  async execute(command: GenerateSpeechCommand): Promise<SpeechResult> {
    // Validate custom voice if provided
    if (command.customVoiceId) {
      const voiceRepository = new VoiceRepository();
      const voiceService = new VoiceService(voiceRepository);

      const isValid = await voiceService.validateVoiceAccess(
        command.customVoiceId,
        command.workspaceId
      );

      if (!isValid) {
        throw new Error(
          'Custom voice not found, not ready, or does not belong to this workspace'
        );
      }
    }

    // Calculate credits needed
    const estimatedCredits = calculateSpeechCredits(command.text);

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
    await this.creditService.allocateCredits(
      command.workspaceId,
      estimatedCredits
    );

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        workspaceId: command.workspaceId,
        userId: command.userId,
        type: 'SPEECH',
        model: command.model,
        provider: command.provider,
        prompt: command.text,
        status: 'PENDING',
        credits: estimatedCredits,
      },
    });

    try {
      // Create AI service
      const factory = getAIServiceFactory();
      const speechService = factory.createSpeechService(
        command.provider,
        command.model
      );

      // Generate speech
      const response: SpeechSynthesisResponse =
        await speechService.synthesizeSpeech(command.text, {
          voice: command.voice,
          format: command.format,
          speed: command.speed,
          quality: command.quality,
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
        format: response.format,
        duration: response.duration,
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
}
