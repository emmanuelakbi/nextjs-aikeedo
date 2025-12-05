/**
 * OpenRouter AI Provider
 * 
 * Unified API gateway for multiple AI providers
 * Supports: OpenAI, Anthropic, Google, Meta, Mistral, and 100+ models
 */

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
import { getEnv } from '@/lib/env';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter Text Generation Service
 * 
 * Provides access to 100+ models through a single API
 */
export class OpenRouterTextGenerationService implements TextGenerationService {
  private apiKey: string;
  private model: string;
  private provider: string = 'openrouter';

  constructor(model: string, maxRetries: number = 3) {
    const env = getEnv();
    if (!env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }
    
    this.apiKey = env.OPENROUTER_API_KEY;
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return this.provider;
  }

  async generateCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    const messages: OpenRouterMessage[] = [
      { role: 'user', content: prompt },
    ];

    const request: OpenRouterRequest = {
      model: this.model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stream: false,
    };

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'AIKEEDO',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenRouter API error: ${error.error?.message || response.statusText}`
      );
    }

    const data: OpenRouterResponse = await response.json();
    const choice = data.choices[0];

    if (!choice) {
      throw new Error('No response from OpenRouter');
    }

    const metadata: ResponseMetadata = {
      model: this.model,
      provider: this.provider as any,
      tokens: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      credits: 0, // Calculate based on your pricing
      finishReason: choice.finish_reason,
    };

    return {
      content: choice.message.content,
      metadata,
    };
  }

  async *streamCompletion(
    prompt: string,
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    const messages: OpenRouterMessage[] = [
      { role: 'user', content: prompt },
    ];

    const request: OpenRouterRequest = {
      model: this.model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stream: true,
    };

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'AIKEEDO',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenRouter API error: ${error.error?.message || response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        yield {
          content: '',
          isComplete: true,
        };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              accumulatedContent += content;
              yield {
                content,
                isComplete: false,
              };
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  async generateChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): Promise<TextGenerationResponse> {
    const openRouterMessages: OpenRouterMessage[] = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    const request: OpenRouterRequest = {
      model: this.model,
      messages: openRouterMessages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stream: false,
    };

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'AIKEEDO',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenRouter API error: ${error.error?.message || response.statusText}`
      );
    }

    const data: OpenRouterResponse = await response.json();
    const choice = data.choices[0];

    if (!choice) {
      throw new Error('No response from OpenRouter');
    }

    const metadata: ResponseMetadata = {
      model: this.model,
      provider: this.provider as any,
      tokens: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      credits: 0, // Calculate based on your pricing
      finishReason: choice.finish_reason,
    };

    return {
      content: choice.message.content,
      metadata,
    };
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options?: TextGenerationOptions
  ): AsyncIterable<TextStreamChunk> {
    const openRouterMessages: OpenRouterMessage[] = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    const request: OpenRouterRequest = {
      model: this.model,
      messages: openRouterMessages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stream: true,
    };

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'AIKEEDO',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenRouter API error: ${error.error?.message || response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        yield {
          content: '',
          isComplete: true,
        };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              yield {
                content,
                isComplete: false,
              };
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
