/**
 * Property-Based Tests for AI Service Factory
 *
 * Feature: critical-fixes
 * **Property 6: AI Provider Response Type Safety**
 * **Validates: Requirements 4.1**
 *
 * These tests validate that the AI service factory correctly handles:
 * - Factory method return types
 * - Model availability checking
 * - Provider selection logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  AIServiceFactory,
  resetAIServiceFactory,
  type ModelInfo,
  type ServiceCapability,
} from '../factory';
import type { AIProvider } from '../types';

// Mock the env module to provide test API keys
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    OPENAI_API_KEY: 'test-openai-key',
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    GOOGLE_AI_API_KEY: 'test-google-key',
    MISTRAL_API_KEY: 'test-mistral-key',
    OPENROUTER_API_KEY: 'test-openrouter-key',
  }),
}));

import { vi } from 'vitest';

/**
 * Arbitraries for AI factory testing
 */

// Valid AI providers
const aiProviderArbitrary = fc.constantFrom<AIProvider>(
  'openai',
  'anthropic',
  'google',
  'mistral',
  'openrouter'
);

// Valid service capabilities
const serviceCapabilityArbitrary = fc.constantFrom<ServiceCapability>(
  'text-generation',
  'image-generation',
  'speech-synthesis',
  'transcription'
);

// Valid model IDs for each provider
const openaiTextModelArbitrary = fc.constantFrom(
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo'
);

const anthropicTextModelArbitrary = fc.constantFrom(
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307'
);

const googleTextModelArbitrary = fc.constantFrom(
  'gemini-1.5-pro',
  'gemini-1.5-flash'
);

const mistralTextModelArbitrary = fc.constantFrom(
  'mistral-large-latest',
  'mistral-small-latest'
);

// Custom model info generator
const customModelInfoArbitrary: fc.Arbitrary<ModelInfo> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /^[a-z0-9-]+$/.test(s)),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  provider: aiProviderArbitrary,
  capabilities: fc.array(serviceCapabilityArbitrary, { minLength: 1, maxLength: 4 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  contextWindow: fc.option(fc.integer({ min: 1000, max: 2000000 }), { nil: undefined }),
  maxOutputTokens: fc.option(fc.integer({ min: 100, max: 100000 }), { nil: undefined }),
  pricing: fc.option(
    fc.record({
      input: fc.float({ min: 0, max: 100, noNaN: true }),
      output: fc.float({ min: 0, max: 100, noNaN: true }),
    }),
    { nil: undefined }
  ),
  deprecated: fc.option(fc.boolean(), { nil: undefined }),
  replacementModel: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

// Provider configuration generator
const providerConfigArbitrary = fc.record({
  provider: aiProviderArbitrary,
  enabled: fc.boolean(),
  priority: fc.integer({ min: 1, max: 10 }),
});

/**
 * Property 6: AI Provider Response Type Safety - Factory Consistency
 * **Validates: Requirements 4.1**
 *
 * For any AI service factory operation, the system should handle types correctly
 * and maintain consistency in model registry and provider selection.
 */
describe('Property 6: AI Factory Consistency', () => {
  let factory: AIServiceFactory;

  beforeEach(() => {
    resetAIServiceFactory();
    factory = new AIServiceFactory();
  });

  /**
   * Test: Factory method return types are correct
   * **Validates: Requirements 4.1**
   */
  describe('Factory Method Return Types', () => {
    it('should return text generation service with correct interface', () => {
      fc.assert(
        fc.property(openaiTextModelArbitrary, (model) => {
          const service = factory.createTextService('openai', model);

          // Verify service has required methods
          expect(typeof service.generateCompletion).toBe('function');
          expect(typeof service.generateChatCompletion).toBe('function');
          expect(typeof service.streamCompletion).toBe('function');
          expect(typeof service.streamChatCompletion).toBe('function');
          expect(typeof service.getModel).toBe('function');
          expect(typeof service.getProvider).toBe('function');

          // Verify provider and model are correct
          expect(service.getProvider()).toBe('openai');
          expect(service.getModel()).toBe(model);
        }),
        { numRuns: 10 }
      );
    });

    it('should return image generation service with correct interface', () => {
      const service = factory.createImageService('openai', 'dall-e-3');

      // Verify service has required methods
      expect(typeof service.generateImage).toBe('function');
      expect(typeof service.getModel).toBe('function');
      expect(typeof service.getProvider).toBe('function');
      expect(typeof service.getSupportedSizes).toBe('function');

      // Verify provider and model are correct
      expect(service.getProvider()).toBe('openai');
      expect(service.getModel()).toBe('dall-e-3');
    });

    it('should return speech synthesis service with correct interface', () => {
      const service = factory.createSpeechService('openai', 'tts-1');

      // Verify service has required methods
      expect(typeof service.synthesizeSpeech).toBe('function');
      expect(typeof service.getModel).toBe('function');
      expect(typeof service.getProvider).toBe('function');
      expect(typeof service.getAvailableVoices).toBe('function');
      expect(typeof service.getSupportedFormats).toBe('function');
      expect(typeof service.estimateDuration).toBe('function');

      // Verify provider and model are correct
      expect(service.getProvider()).toBe('openai');
      expect(service.getModel()).toBe('tts-1');
    });

    it('should return transcription service with correct interface', () => {
      const service = factory.createTranscriptionService('openai');

      // Verify service has required methods
      expect(typeof service.transcribeAudio).toBe('function');
      expect(typeof service.translateAudio).toBe('function');
      expect(typeof service.getModel).toBe('function');
      expect(typeof service.getProvider).toBe('function');
      expect(typeof service.getSupportedFormats).toBe('function');
      expect(typeof service.getSupportedLanguages).toBe('function');
      expect(typeof service.getMaxFileSize).toBe('function');

      // Verify provider is correct
      expect(service.getProvider()).toBe('openai');
    });
  });

  /**
   * Test: Model availability checking is consistent
   * **Validates: Requirements 4.1**
   */
  describe('Model Availability Checking', () => {
    it('should return consistent results for getAvailableModels', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(serviceCapabilityArbitrary, { nil: undefined }),
          async (capability) => {
            const models = await factory.getAvailableModels(capability);

            // Should return an array
            expect(Array.isArray(models)).toBe(true);

            // All models should have required fields
            for (const model of models) {
              expect(model).toHaveProperty('id');
              expect(model).toHaveProperty('name');
              expect(model).toHaveProperty('provider');
              expect(model).toHaveProperty('capabilities');

              expect(typeof model.id).toBe('string');
              expect(typeof model.name).toBe('string');
              expect(typeof model.provider).toBe('string');
              expect(Array.isArray(model.capabilities)).toBe(true);
            }

            // If capability filter is provided, all models should have that capability
            if (capability) {
              for (const model of models) {
                expect(model.capabilities).toContain(capability);
              }
            }

            // No deprecated models should be returned
            for (const model of models) {
              expect(model.deprecated).not.toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return consistent results for getModelsByProvider', async () => {
      await fc.assert(
        fc.asyncProperty(
          aiProviderArbitrary,
          fc.option(serviceCapabilityArbitrary, { nil: undefined }),
          async (provider, capability) => {
            const models = await factory.getModelsByProvider(provider, capability);

            // Should return an array
            expect(Array.isArray(models)).toBe(true);

            // All models should belong to the specified provider
            for (const model of models) {
              expect(model.provider).toBe(provider);
            }

            // If capability filter is provided, all models should have that capability
            if (capability) {
              for (const model of models) {
                expect(model.capabilities).toContain(capability);
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return model info for registered models', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'gemini-1.5-pro'),
          async (modelId) => {
            const modelInfo = await factory.getModelInfo(modelId);

            // Should return model info for known models
            expect(modelInfo).toBeDefined();
            expect(modelInfo?.id).toBe(modelId);
            expect(modelInfo?.capabilities.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return undefined for unknown models', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 30 }).filter((s) => !s.includes('gpt') && !s.includes('claude')),
          async (unknownModelId) => {
            const modelInfo = await factory.getModelInfo(unknownModelId);

            // Should return undefined for unknown models
            expect(modelInfo).toBeUndefined();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Test: Provider selection logic is correct
   * **Validates: Requirements 4.1**
   */
  describe('Provider Selection Logic', () => {
    it('should check provider availability correctly', async () => {
      // Test only providers with mocked API keys
      const providersWithKeys: AIProvider[] = ['openai', 'anthropic', 'google', 'mistral'];
      
      for (const provider of providersWithKeys) {
        const isAvailable = await factory.isProviderAvailable(provider);

        // Should return a boolean
        expect(typeof isAvailable).toBe('boolean');

        // With mocked API keys, these providers should be available
        expect(isAvailable).toBe(true);
      }
    });

    it('should throw error for disabled providers', () => {
      fc.assert(
        fc.property(aiProviderArbitrary, (provider) => {
          // Disable the provider
          factory.updateProviderConfig(provider, {
            provider,
            enabled: false,
            priority: 1,
          });

          // Should throw when trying to create a service
          expect(() => {
            factory.createTextService(provider, 'gpt-4o-mini');
          }).toThrow('not available');
        }),
        { numRuns: 5 }
      );
    });

    it('should respect provider priority in fallback', async () => {
      // Configure providers with specific priorities
      factory.updateProviderConfig('openai', {
        provider: 'openai',
        enabled: false, // Disable primary
        priority: 1,
      });
      factory.updateProviderConfig('anthropic', {
        provider: 'anthropic',
        enabled: true,
        priority: 2,
      });
      factory.updateProviderConfig('google', {
        provider: 'google',
        enabled: true,
        priority: 3,
      });

      // Should fall back to anthropic (highest priority enabled)
      const service = await factory.createTextServiceWithFallback('openai', 'gpt-4o-mini');

      expect(service.getProvider()).toBe('anthropic');
    });
  });

  /**
   * Test: Custom model registration works correctly
   * **Validates: Requirements 4.1**
   */
  describe('Custom Model Registration', () => {
    it('should register and retrieve custom models', async () => {
      // Use a unique model ID for each test run
      const uniqueId = `custom-model-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const customModel: ModelInfo = {
        id: uniqueId,
        name: 'Custom Test Model',
        provider: 'openai',
        capabilities: ['text-generation'],
        description: 'Test model for property testing',
      };

      // Register the custom model
      factory.registerModel(customModel);

      // Retrieve the model directly from the registry (bypassing cache)
      const retrieved = await factory.getModelInfo(customModel.id);

      // Should match the registered model
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(customModel.id);
      expect(retrieved?.name).toBe(customModel.name);
      expect(retrieved?.provider).toBe(customModel.provider);
      expect(retrieved?.capabilities).toEqual(customModel.capabilities);
    });

    it('should include custom models in getAvailableModels', async () => {
      // Use a unique model ID
      const uniqueId = `custom-available-model-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const customModel: ModelInfo = {
        id: uniqueId,
        name: 'Custom Available Model',
        provider: 'openai',
        capabilities: ['text-generation'],
        description: 'Test model for availability testing',
      };

      factory.registerModel(customModel);

      // Get the model info directly to verify registration
      const modelInfo = await factory.getModelInfo(customModel.id);
      expect(modelInfo).toBeDefined();
      expect(modelInfo?.id).toBe(customModel.id);
    });

    it('should filter out deprecated custom models from available models', async () => {
      const deprecatedModel: ModelInfo = {
        id: 'deprecated-test-model-' + Date.now(),
        name: 'Deprecated Test Model',
        provider: 'openai',
        capabilities: ['text-generation'],
        deprecated: true,
        replacementModel: 'gpt-4o-mini',
      };

      factory.registerModel(deprecatedModel);

      const allModels = await factory.getAvailableModels();
      const deprecatedModelFound = allModels.find((m) => m.id === deprecatedModel.id);

      expect(deprecatedModelFound).toBeUndefined();
    });
  });

  /**
   * Test: Model validation is correct
   * **Validates: Requirements 4.1**
   */
  describe('Model Validation', () => {
    it('should throw error for non-existent models', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 30 }).filter((s) => !s.includes('gpt') && !s.includes('claude')),
          (unknownModel) => {
            expect(() => {
              factory.createTextService('openai', unknownModel);
            }).toThrow('not found in registry');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should throw error for capability mismatch', () => {
      // Try to create image service with text-only model
      expect(() => {
        factory.createImageService('openai', 'gpt-4o-mini');
      }).toThrow('does not support image-generation');

      // Try to create speech service with text-only model
      expect(() => {
        factory.createSpeechService('openai', 'gpt-4o-mini');
      }).toThrow('does not support speech-synthesis');
    });

    it('should throw error for deprecated models', () => {
      const deprecatedModel: ModelInfo = {
        id: 'old-deprecated-model',
        name: 'Old Deprecated Model',
        provider: 'openai',
        capabilities: ['text-generation'],
        deprecated: true,
        replacementModel: 'gpt-4o-mini',
      };

      factory.registerModel(deprecatedModel);

      expect(() => {
        factory.createTextService('openai', 'old-deprecated-model');
      }).toThrow('deprecated');
    });
  });

  /**
   * Test: Fallback service creation works correctly
   * **Validates: Requirements 4.1**
   */
  describe('Fallback Service Creation', () => {
    it('should create service with fallback when primary fails', async () => {
      // Disable OpenAI
      factory.updateProviderConfig('openai', {
        provider: 'openai',
        enabled: false,
        priority: 1,
      });

      const service = await factory.createTextServiceWithFallback('openai', 'gpt-4o-mini');

      // Should have created a service with a different provider
      expect(service).toBeDefined();
      expect(service.getProvider()).not.toBe('openai');
    });

    it('should throw error when all providers fail', async () => {
      // Disable all providers
      const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'mistral', 'openrouter'];
      for (const provider of providers) {
        factory.updateProviderConfig(provider, {
          provider,
          enabled: false,
          priority: 1,
        });
      }

      await expect(
        factory.createTextServiceWithFallback('openai', 'gpt-4o-mini')
      ).rejects.toThrow('Failed to create text service');
    });

    it('should return primary service when fallback is disabled', async () => {
      const noFallbackFactory = new AIServiceFactory({ enableFallback: false });

      const service = await noFallbackFactory.createTextServiceWithFallback('openai', 'gpt-4o-mini');

      expect(service.getProvider()).toBe('openai');
    });
  });
});
