/**
 * Generate Completion Use Case
 *
 * Handles text completion generation with credit management.
 * Requirements: 2.1, 2.3, 2.4, 2.5
 */

import { GenerateCompletionCommand } from '../../commands/ai/GenerateCompletionCommand';
import { getAIServiceFactory } from '../../../lib/ai/factory';
import { calculateTextCredits } from '../../../lib/ai/credit-calculator';
import {
  CreditDeductionService,
  InsufficientCreditsError,
} from '../../../infrastructure/services/CreditDeductionService';
import type { TextGenerationResponse } from '../../../lib/ai/types';

export interface CompletionResult {
  content: string;
  model: string;
  provider: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  credits: number;
}

export class GenerateCompletionUseCase {
  private creditService: CreditDeductionService;

  constructor() {
    this.creditService = new CreditDeductionService();
  }

  async execute(command: GenerateCompletionCommand): Promise<CompletionResult> {
    // Estimate credits needed (rough estimate for validation)
    const estimatedTokens =
      Math.ceil(command.prompt.length / 4) + (command.maxTokens || 1000);
    const estimatedCredits = calculateTextCredits(
      estimatedTokens,
      command.model
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
    const allocation = await this.creditService.allocateCredits(
      command.workspaceId,
      estimatedCredits
    );

    try {
      // Create AI service
      const factory = getAIServiceFactory();
      const textService = factory.createTextService(
        command.provider,
        command.model
      );

      // Generate completion
      const response: TextGenerationResponse =
        await textService.generateCompletion(command.prompt, {
          maxTokens: command.maxTokens,
          temperature: command.temperature,
          topP: command.topP,
          frequencyPenalty: command.frequencyPenalty,
          presencePenalty: command.presencePenalty,
          stopSequences: command.stopSequences,
          stream: false,
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

      return {
        content: response.content,
        model: response.metadata.model,
        provider: response.metadata.provider,
        tokens: response.metadata.tokens || {
          input: 0,
          output: 0,
          total: 0,
        },
        credits: actualCredits,
      };
    } catch (error) {
      // Release allocated credits on failure
      await this.creditService.releaseCredits(
        command.workspaceId,
        estimatedCredits
      );
      throw error;
    }
  }
}
