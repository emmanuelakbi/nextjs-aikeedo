/**
 * Generate Transcription Use Case
 *
 * Handles audio transcription with credit management.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.3, 7.4
 */

import { GenerateTranscriptionCommand } from '../../commands/ai/GenerateTranscriptionCommand';
import { getAIServiceFactory } from '../../../lib/ai/factory';
import { calculateTranscriptionCredits } from '../../../lib/ai/credit-calculator';
import {
  CreditDeductionService,
  InsufficientCreditsError,
} from '../../../infrastructure/services/CreditDeductionService';
import { prisma } from '../../../lib/db';
import type {
  TranscriptionResponse,
  TranscriptionSegment,
} from '../../../lib/ai/types';

export interface TranscriptionResult {
  id: string;
  text: string;
  language?: string;
  duration: number;
  segments?: TranscriptionSegment[];
  model: string;
  provider: string;
  credits: number;
}

export class GenerateTranscriptionUseCase {
  private creditService: CreditDeductionService;

  constructor() {
    this.creditService = new CreditDeductionService();
  }

  async execute(
    command: GenerateTranscriptionCommand
  ): Promise<TranscriptionResult> {
    // Estimate credits based on typical audio duration
    // We'll use a conservative estimate and adjust after actual transcription
    const estimatedDurationSeconds = 60; // Assume 1 minute as initial estimate
    const estimatedCredits = calculateTranscriptionCredits(
      estimatedDurationSeconds
    );

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
        type: 'TRANSCRIPTION',
        model: 'whisper-1',
        provider: command.provider,
        prompt: command.audioFile.filename,
        status: 'PENDING',
        credits: estimatedCredits,
      },
    });

    try {
      // Create AI service
      const factory = getAIServiceFactory();
      const transcriptionService = factory.createTranscriptionService(
        command.provider
      );

      // Transcribe audio
      const response: TranscriptionResponse =
        await transcriptionService.transcribeAudio(command.audioFile, {
          language: command.language,
          format: command.format,
          timestamps: command.timestamps,
          temperature: command.temperature,
          prompt: command.prompt,
        });

      // Calculate actual credits used based on actual duration
      const actualCredits = calculateTranscriptionCredits(response.duration);

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
          result: response.text,
          status: 'COMPLETED',
          credits: actualCredits,
          completedAt: new Date(),
        },
      });

      return {
        id: generation.id,
        text: response.text,
        language: response.language,
        duration: response.duration,
        segments: response.segments,
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
