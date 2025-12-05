/**
 * Mistral Integration Tests
 *
 * Integration tests for Mistral text generation service.
 * These tests are skipped by default and should be run manually with a valid API key.
 */

import { describe, it, expect } from 'vitest';
import { MistralTextGenerationService } from '../providers/mistral-text-generation';

describe.skip('Mistral Integration Tests', () => {
  // These tests require a valid MISTRAL_API_KEY in .env
  // Run with: npm test -- --run src/lib/ai/__tests__/mistral-integration.test.ts

  const service = new MistralTextGenerationService('mistral-small-latest');

  it('should generate a simple completion', async () => {
    const response = await service.generateCompletion(
      'Say "Hello, World!" and nothing else.',
      { maxTokens: 50, temperature: 0.1 }
    );

    expect(response.content).toBeTruthy();
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.metadata.provider).toBe('mistral');
    expect(response.metadata.tokens?.total).toBeGreaterThan(0);
    expect(response.metadata.credits).toBeGreaterThan(0);
  }, 30000);

  it('should generate a chat completion', async () => {
    const response = await service.generateChatCompletion(
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is 2+2? Answer with just the number.' },
      ],
      { maxTokens: 10, temperature: 0.1 }
    );

    expect(response.content).toBeTruthy();
    expect(response.content).toContain('4');
    expect(response.metadata.provider).toBe('mistral');
  }, 30000);

  it('should stream a completion', async () => {
    let fullContent = '';
    let chunkCount = 0;
    let finalMetadata = null;

    for await (const chunk of service.streamCompletion('Count from 1 to 5.', {
      maxTokens: 50,
      temperature: 0.1,
    })) {
      if (chunk.content) {
        fullContent += chunk.content;
        chunkCount++;
      }

      if (chunk.isComplete && chunk.metadata) {
        finalMetadata = chunk.metadata;
      }
    }

    expect(fullContent.length).toBeGreaterThan(0);
    expect(chunkCount).toBeGreaterThan(0);
    expect(finalMetadata).toBeTruthy();
    expect(finalMetadata?.provider).toBe('mistral');
  }, 30000);

  it('should stream a chat completion', async () => {
    let fullContent = '';
    let chunkCount = 0;

    for await (const chunk of service.streamChatCompletion(
      [{ role: 'user', content: 'Say hello in 3 words.' }],
      { maxTokens: 20, temperature: 0.1 }
    )) {
      if (chunk.content) {
        fullContent += chunk.content;
        chunkCount++;
      }
    }

    expect(fullContent.length).toBeGreaterThan(0);
    expect(chunkCount).toBeGreaterThan(0);
  }, 30000);

  it('should handle temperature parameter', async () => {
    const lowTemp = await service.generateCompletion('Complete: The sky is', {
      maxTokens: 10,
      temperature: 0.1,
    });

    const highTemp = await service.generateCompletion('Complete: The sky is', {
      maxTokens: 10,
      temperature: 1.5,
    });

    expect(lowTemp.content).toBeTruthy();
    expect(highTemp.content).toBeTruthy();
    // Both should generate content, but we can't reliably test they're different
  }, 30000);

  it('should handle stop sequences', async () => {
    const response = await service.generateCompletion(
      'List three colors:\n1.',
      { maxTokens: 100, stopSequences: ['\n4.'] }
    );

    expect(response.content).toBeTruthy();
    expect(response.content).not.toContain('\n4.');
  }, 30000);

  it('should return proper model information', () => {
    expect(service.getModel()).toBe('mistral-small-latest');
    expect(service.getProvider()).toBe('mistral');
  });
});
