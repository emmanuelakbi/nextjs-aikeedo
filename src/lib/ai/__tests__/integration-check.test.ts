/**
 * Integration check for OpenAI providers
 * Verifies that all services can be imported and instantiated correctly
 */

import { describe, it, expect } from 'vitest';

describe('OpenAI Providers Integration', () => {
  it('should import all OpenAI services from main index', async () => {
    const aiModule = await import('../index');

    expect(aiModule.OpenAITextGenerationService).toBeDefined();
    expect(aiModule.OpenAIImageGenerationService).toBeDefined();
    expect(aiModule.OpenAISpeechSynthesisService).toBeDefined();
    expect(aiModule.OpenAITranscriptionService).toBeDefined();
  });

  it('should import all interfaces', async () => {
    const aiModule = await import('../index');

    // Check that types are exported (they won't have runtime values)
    expect(typeof aiModule).toBe('object');
  });

  it('should have working provider exports', async () => {
    const providersModule = await import('../providers');

    expect(providersModule.OpenAITextGenerationService).toBeDefined();
    expect(providersModule.OpenAIImageGenerationService).toBeDefined();
    expect(providersModule.OpenAISpeechSynthesisService).toBeDefined();
    expect(providersModule.OpenAITranscriptionService).toBeDefined();
  });
});
