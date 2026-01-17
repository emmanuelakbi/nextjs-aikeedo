/**
 * Anthropic Integration Tests
 *
 * Integration tests for Anthropic provider with actual API calls.
 * These tests are skipped if ANTHROPIC_API_KEY is not configured.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AnthropicTextGenerationService } from '../providers/anthropic-text-generation';
import { getEnv } from '@/lib/env';

// Check API key availability at module load time to avoid TypeScript errors
// with it.skipIf() which evaluates the condition before beforeAll runs
const env = getEnv();
const hasApiKey = !!env.ANTHROPIC_API_KEY;

describe('Anthropic Integration Tests', () => {
  let service: AnthropicTextGenerationService;

  beforeAll(() => {
    if (hasApiKey) {
      service = new AnthropicTextGenerationService(
        'claude-3-5-sonnet-20241022'
      );
    }
  });

  it.skipIf(!hasApiKey)(
    'should generate text completion',
    async () => {
      const response = await service.generateCompletion(
        'Say "Hello, World!" and nothing else.',
        { maxTokens: 50, temperature: 0 }
      );

      expect(response.content).toBeTruthy();
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.metadata.provider).toBe('anthropic');
      expect(response.metadata.tokens).toBeDefined();
      expect(response.metadata.tokens!.total).toBeGreaterThan(0);
    },
    30000
  );

  it.skipIf(!hasApiKey)(
    'should generate chat completion',
    async () => {
      const response = await service.generateChatCompletion(
        [{ role: 'user', content: 'What is 2+2?' }],
        { maxTokens: 50, temperature: 0 }
      );

      expect(response.content).toBeTruthy();
      expect(response.content).toContain('4');
      expect(response.metadata.provider).toBe('anthropic');
    },
    30000
  );

  it.skipIf(!hasApiKey)(
    'should stream completion',
    async () => {
      const chunks: string[] = [];
      let metadata;

      for await (const chunk of service.streamCompletion('Count from 1 to 3.', {
        maxTokens: 50,
        temperature: 0,
      })) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
        if (chunk.isComplete && chunk.metadata) {
          metadata = chunk.metadata;
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(metadata).toBeDefined();
      expect(metadata?.provider).toBe('anthropic');
      expect(metadata?.tokens?.total).toBeGreaterThan(0);
    },
    30000
  );

  it.skipIf(!hasApiKey)(
    'should stream chat completion',
    async () => {
      const chunks: string[] = [];
      let metadata;

      for await (const chunk of service.streamChatCompletion(
        [{ role: 'user', content: 'Say hello.' }],
        { maxTokens: 50, temperature: 0 }
      )) {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
        if (chunk.isComplete && chunk.metadata) {
          metadata = chunk.metadata;
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(metadata).toBeDefined();
      expect(metadata?.provider).toBe('anthropic');
    },
    30000
  );

  it.skipIf(!hasApiKey)(
    'should handle system messages in chat',
    async () => {
      const response = await service.generateChatCompletion(
        [
          {
            role: 'system',
            content:
              'You are a helpful assistant that always responds in exactly 3 words.',
          },
          { role: 'user', content: 'Hello!' },
        ],
        { maxTokens: 50, temperature: 0 }
      );

      expect(response.content).toBeTruthy();
      expect(response.metadata.provider).toBe('anthropic');
    },
    30000
  );
});
