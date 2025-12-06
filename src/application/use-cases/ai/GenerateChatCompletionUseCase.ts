/**
 * Generate Chat Completion Use Case
 *
 * Handles chat completion generation with credit management and streaming support.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { GenerateChatCompletionCommand } from '../../commands/ai/GenerateChatCompletionCommand';
import { getAIServiceFactory } from '../../../lib/ai/factory';
import { calculateTextCredits } from '../../../lib/ai/credit-calculator';
import {
  CreditDeductionService,
  InsufficientCreditsError,
} from '../../../infrastructure/services/CreditDeductionService';
import type {
  TextGenerationResponse,
  TextStreamChunk,
} from '../../../lib/ai/types';
import type { ChatMessage as ServiceChatMessage } from '../../../lib/ai/interfaces/text-generation-service';

export interface ChatCompletionResult {
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

export class GenerateChatCompletionUseCase {
  private creditService: CreditDeductionService;

  constructor() {
    this.creditService = new CreditDeductionService();
  }

  async execute(
    command: GenerateChatCompletionCommand
  ): Promise<ChatCompletionResult> {
    // Estimate credits needed (rough estimate for validation)
    const totalMessageLength = command.messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    const estimatedTokens =
      Math.ceil(totalMessageLength / 4) + (command.maxTokens || 1000);
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

      // Convert messages to service format
      const messages: ServiceChatMessage[] = command.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate chat completion
      const response: TextGenerationResponse =
        await textService.generateChatCompletion(messages, {
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

  async *executeStream(
    command: GenerateChatCompletionCommand
  ): AsyncIterable<TextStreamChunk> {
    // Estimate credits needed (rough estimate for validation)
    const totalMessageLength = command.messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    const estimatedTokens =
      Math.ceil(totalMessageLength / 4) + (command.maxTokens || 1000);
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

    // Track whether credits were successfully allocated
    let creditsAllocated = false;

    try {
      // Allocate credits
      const allocation = await this.creditService.allocateCredits(
        command.workspaceId,
        estimatedCredits
      );
      creditsAllocated = true;
      // Create AI service
      const factory = getAIServiceFactory();
      const textService = factory.createTextService(
        command.provider,
        command.model
      );

      // Convert messages to service format
      const messages: ServiceChatMessage[] = command.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Stream chat completion
      const stream = textService.streamChatCompletion(messages, {
        maxTokens: command.maxTokens,
        temperature: command.temperature,
        topP: command.topP,
        frequencyPenalty: command.frequencyPenalty,
        presencePenalty: command.presencePenalty,
        stopSequences: command.stopSequences,
        stream: true,
      });

      let actualCredits = 0;
      let streamCompleted = false;

      try {
        for await (const chunk of stream) {
          yield chunk;

          // Capture final metadata
          if (chunk.isComplete && chunk.metadata) {
            actualCredits = chunk.metadata.credits;
            streamCompleted = true;
          }
        }

        // If stream completed successfully, adjust credits
        if (streamCompleted && actualCredits > 0) {
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
        } else {
          // Stream completed but no credits calculated, use estimated
          await this.creditService.releaseCredits(
            command.workspaceId,
            estimatedCredits
          );
          await this.creditService.consumeCredits(
            command.workspaceId,
            estimatedCredits
          );
        }
      } catch (streamError) {
        // Release allocated credits on stream failure
        if (creditsAllocated) {
          await this.creditService.releaseCredits(
            command.workspaceId,
            estimatedCredits
          );
        }
        throw streamError;
      }
    } catch (error) {
      // Release allocated credits on failure (only if they were allocated)
      if (creditsAllocated) {
        await this.creditService.releaseCredits(
          command.workspaceId,
          estimatedCredits
        );
      }
      throw error;
    }
  }
}
