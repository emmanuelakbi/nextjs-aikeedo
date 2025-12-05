/**
 * OpenAI Text Generation Service (Enhanced with Error Handling)
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 *
 * Implements text completion and chat capabilities using OpenAI's API
 * with comprehensive error handling, retry logic, and circuit breaker.
 */

import OpenAI from 'openai';
import type {
  TextGenerationService,
  TextGenerationOptions,
  ChatMessage,
} from '../interfaces/text-generation-service';
import type {
  TextGenerationResponse,
  TextStreamChunk,
  ResponseMetadata,
} from '../types';
import { BaseAIProvider } from '../base-provider';
import { handleAIError } from '../error-handler';
import { getEnv } from '@/lib/env';

export class OpenAITextGenerationServiceV2
  extends BaseAIProvider
  implements TextGenerationService
{
  private client: OpenAI;

  constructor(
    model: string = 'gpt-4o-mini',
    maxRetries: number = 3,
    timeout: number = 60000
  ) {
    super({
      model,
      provider: 'openai',
      maxRetries,
      timeout,
      enableCircuitBreaker: true,
    });

    const env = getEnv();

    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      maxRetries: 0, // We handle retries ourselves
      timeout: timeout,
    });
  }

  async generateCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    return this.executeWithProtection(
      async () => {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens,
          temperature: options?.temperature,
          top_p: options?.topP,
          frequency_penalty: options?.frequencyPenalty,
          presence_penalty: options?.presencePenalty,
          stop: options?.stopSequences,
          stream: false,
        });

        const choice = response.choices[0];
        if (!choice?.message.content) {
          throw new Error('No content in OpenAI response');
        }

        const metadata: ResponseMetadata = {
          model: response.model,
          provider: 'openai',
          tokens: {
            input: response.usage?.prompt_tokens || 0,
            output: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0,
          },
          credits: this.calculateCredits(response.usage?.total_tokens || 0),
          finishReason: choice.finish_reason || undefined,
        };

        return {
          content: choice.message.content,
          metadata,
        };
      },
      'generateCompletion',
      { promptLength: prompt.length }
    );
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    return this.executeWithProtection(
      async () => {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: options?.maxTokens,
          temperature: options?.temperature,
          top_p: options?.topP,
          frequency_penalty: options?.frequencyPenalty,
          presence_penalty: options?.presencePenalty,
          stop: options?.stopSequences,
          stream: false,
        });

        const choice = response.choices[0];
        if (!choice?.message.content) {
          throw new Error('No content in OpenAI response');
        }

        const metadata: ResponseMetadata = {
          model: response.model,
          provider: 'openai',
          tokens: {
            input: response.usage?.prompt_tokens || 0,
            output: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0,
          },
          credits: this.calculateCredits(response.usage?.total_tokens || 0),
          finishReason: choice.finish_reason || undefined,
        };

        return {
          content: choice.message.content,
          metadata,
        };
      },
      'generateChatCompletion',
      { messageCount: messages.length }
    );
  }

  async *streamCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stopSequences,
        stream: true,
      });

      let totalContent = '';
      let tokenCount = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content || '';

        if (content) {
          totalContent += content;
          tokenCount += this.estimateTokens(content);
        }

        const isComplete = chunk.choices[0]?.finish_reason !== null;

        yield {
          content,
          isComplete,
          metadata: isComplete
            ? {
                model: chunk.model,
                provider: 'openai',
                tokens: {
                  input: tokenCount,
                  output: tokenCount,
                  total: tokenCount,
                },
                credits: this.calculateCredits(tokenCount),
                finishReason: chunk.choices[0]?.finish_reason || undefined,
              }
            : undefined,
        };

        if (isComplete) {
          break;
        }
      }
    } catch (error) {
      handleAIError(error, this.provider, {
        operation: 'streamCompletion',
        model: this.model,
      });
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: options?.maxTokens,
        temperature: options?.temperature,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stopSequences,
        stream: true,
      });

      let totalContent = '';
      let tokenCount = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content || '';

        if (content) {
          totalContent += content;
          tokenCount += this.estimateTokens(content);
        }

        const isComplete = chunk.choices[0]?.finish_reason !== null;

        yield {
          content,
          isComplete,
          metadata: isComplete
            ? {
                model: chunk.model,
                provider: 'openai',
                tokens: {
                  input: tokenCount,
                  output: tokenCount,
                  total: tokenCount,
                },
                credits: this.calculateCredits(tokenCount),
                finishReason: chunk.choices[0]?.finish_reason || undefined,
              }
            : undefined,
        };

        if (isComplete) {
          break;
        }
      }
    } catch (error) {
      handleAIError(error, this.provider, {
        operation: 'streamChatCompletion',
        model: this.model,
        messageCount: messages.length,
      });
    }
  }
}
