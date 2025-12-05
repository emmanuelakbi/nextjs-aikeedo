/**
 * AI Service Factory Tests
 *
 * Tests for the AI service factory including provider selection,
 * model registry, validation, and fallback handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AIServiceFactory,
  getAIServiceFactory,
  resetAIServiceFactory,
  type AIServiceFactoryConfig,
  type ModelInfo,
} from '../factory';

// Mock the env module
vi.mock('@/lib/env', () => ({
  getEnv: () => ({
    OPENAI_API_KEY: 'test-openai-key',
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    GOOGLE_AI_API_KEY: 'test-google-key',
    MISTRAL_API_KEY: 'test-mistral-key',
  }),
}));

describe('AIServiceFactory', () => {
  let factory: AIServiceFactory;

  beforeEach(() => {
    resetAIServiceFactory();
    factory = new AIServiceFactory();
  });

  describe('Model Registry', () => {
    it('should initialize with default models', async () => {
      const models = await factory.getAvailableModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should get models by capability', async () => {
      const textModels = await factory.getAvailableModels('text-generation');
      const imageModels = await factory.getAvailableModels('image-generation');

      expect(textModels.length).toBeGreaterThan(0);
      expect(imageModels.length).toBeGreaterThan(0);

      textModels.forEach((model) => {
        expect(model.capabilities).toContain('text-generation');
      });
    });

    it('should get models by provider', async () => {
      const openaiModels = await factory.getModelsByProvider('openai');
      const anthropicModels = await factory.getModelsByProvider('anthropic');

      expect(openaiModels.length).toBeGreaterThan(0);
      expect(anthropicModels.length).toBeGreaterThan(0);

      openaiModels.forEach((model) => {
        expect(model.provider).toBe('openai');
      });
    });

    it('should get specific model info', async () => {
      const modelInfo = await factory.getModelInfo('gpt-4o-mini');

      expect(modelInfo).toBeDefined();
      expect(modelInfo?.id).toBe('gpt-4o-mini');
      expect(modelInfo?.provider).toBe('openai');
      expect(modelInfo?.capabilities).toContain('text-generation');
    });

    it('should register custom models', async () => {
      const customModel: ModelInfo = {
        id: 'custom-test-model',
        name: 'Custom Test Model',
        provider: 'openai',
        capabilities: ['text-generation'],
        description: 'Test model',
      };

      factory.registerModel(customModel);

      const retrieved = factory.getModelInfo('custom-test-model');
      expect(retrieved).toEqual(customModel);
    });

    it('should filter out deprecated models', async () => {
      const deprecatedModel: ModelInfo = {
        id: 'deprecated-model',
        name: 'Deprecated Model',
        provider: 'openai',
        capabilities: ['text-generation'],
        deprecated: true,
      };

      factory.registerModel(deprecatedModel);

      const availableModels = await factory.getAvailableModels();
      expect(
        availableModels.find((m) => m.id === 'deprecated-model')
      ).toBeUndefined();
    });
  });

  describe('Provider Validation', () => {
    it('should check provider availability', async () => {
      expect(await factory.isProviderAvailable('openai')).toBe(true);
      expect(await factory.isProviderAvailable('anthropic')).toBe(true);
      expect(await factory.isProviderAvailable('google')).toBe(true);
      expect(await factory.isProviderAvailable('mistral')).toBe(true);
    });

    it('should throw error for unavailable provider', () => {
      // Disable a provider
      factory.updateProviderConfig('mistral', {
        provider: 'mistral',
        enabled: false,
        priority: 4,
      });

      expect(() => {
        factory.createTextService('mistral', 'mistral-large-latest');
      }).toThrow('not available');
    });

    it('should validate model exists', () => {
      expect(() => {
        factory.createTextService('openai', 'non-existent-model');
      }).toThrow('not found in registry');
    });

    it('should validate model capability', () => {
      expect(() => {
        // Try to create image service with text-only model
        factory.createImageService('openai', 'gpt-4o-mini');
      }).toThrow('does not support image-generation');
    });

    it('should reject deprecated models', () => {
      const deprecatedModel: ModelInfo = {
        id: 'old-model',
        name: 'Old Model',
        provider: 'openai',
        capabilities: ['text-generation'],
        deprecated: true,
        replacementModel: 'gpt-4o-mini',
      };

      factory.registerModel(deprecatedModel);

      expect(() => {
        factory.createTextService('openai', 'old-model');
      }).toThrow('deprecated');
    });
  });

  describe('Service Creation', () => {
    it('should create text generation service', () => {
      const service = factory.createTextService('openai', 'gpt-4o-mini');

      expect(service).toBeDefined();
      expect(service.getProvider()).toBe('openai');
      expect(service.getModel()).toBe('gpt-4o-mini');
    });

    it('should create image generation service', () => {
      const service = factory.createImageService('openai', 'dall-e-3');

      expect(service).toBeDefined();
      expect(service.getProvider()).toBe('openai');
      expect(service.getModel()).toBe('dall-e-3');
    });

    it('should create speech synthesis service', () => {
      const service = factory.createSpeechService('openai', 'tts-1');

      expect(service).toBeDefined();
      expect(service.getProvider()).toBe('openai');
      expect(service.getModel()).toBe('tts-1');
    });

    it('should create transcription service', () => {
      const service = factory.createTranscriptionService('openai');

      expect(service).toBeDefined();
      expect(service.getProvider()).toBe('openai');
    });

    it('should throw error for unsupported service type', () => {
      expect(() => {
        factory.createImageService('anthropic', 'claude-3-5-sonnet-20241022');
      }).toThrow('does not support image-generation');
    });
  });

  describe('Provider Configuration', () => {
    it('should use custom provider configuration', () => {
      const config: AIServiceFactoryConfig = {
        providers: [
          { provider: 'anthropic', enabled: true, priority: 1 },
          { provider: 'openai', enabled: false, priority: 2 },
          { provider: 'google', enabled: true, priority: 3 },
          { provider: 'mistral', enabled: true, priority: 4 },
        ],
      };

      const customFactory = new AIServiceFactory(config);

      expect(customFactory.isProviderAvailable('anthropic')).toBe(true);
      expect(customFactory.isProviderAvailable('openai')).toBe(false);
    });

    it('should update provider configuration', () => {
      factory.updateProviderConfig('openai', {
        provider: 'openai',
        enabled: false,
        priority: 10,
      });

      expect(factory.isProviderAvailable('openai')).toBe(false);
    });
  });

  describe('Fallback Handling', () => {
    it('should create service with fallback disabled', () => {
      const noFallbackFactory = new AIServiceFactory({ enableFallback: false });

      const service = noFallbackFactory.createTextServiceWithFallback(
        'openai',
        'gpt-4o-mini'
      );

      expect(service).toBeDefined();
      expect(service.getProvider()).toBe('openai');
    });

    it('should attempt fallback when primary provider fails', () => {
      // Disable OpenAI
      factory.updateProviderConfig('openai', {
        provider: 'openai',
        enabled: false,
        priority: 1,
      });

      const service = factory.createTextServiceWithFallback(
        'openai',
        'gpt-4o-mini'
      );

      // Should fall back to another provider
      expect(service).toBeDefined();
      expect(service.getProvider()).not.toBe('openai');
    });

    it('should throw error when all fallbacks fail', () => {
      // Disable all providers
      factory.updateProviderConfig('openai', {
        provider: 'openai',
        enabled: false,
        priority: 1,
      });
      factory.updateProviderConfig('anthropic', {
        provider: 'anthropic',
        enabled: false,
        priority: 2,
      });
      factory.updateProviderConfig('google', {
        provider: 'google',
        enabled: false,
        priority: 3,
      });
      factory.updateProviderConfig('mistral', {
        provider: 'mistral',
        enabled: false,
        priority: 4,
      });

      expect(() => {
        factory.createTextServiceWithFallback('openai', 'gpt-4o-mini');
      }).toThrow('Failed to create text service');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getAIServiceFactory', () => {
      const factory1 = getAIServiceFactory();
      const factory2 = getAIServiceFactory();

      expect(factory1).toBe(factory2);
    });

    it('should reset singleton with resetAIServiceFactory', () => {
      const factory1 = getAIServiceFactory();
      resetAIServiceFactory();
      const factory2 = getAIServiceFactory();

      expect(factory1).not.toBe(factory2);
    });
  });

  describe('Model Filtering', () => {
    it('should filter models by provider and capability', () => {
      const openaiTextModels = await factory.getModelsByProvider(
        'openai',
        'text-generation'
      );

      expect(openaiTextModels.length).toBeGreaterThan(0);
      openaiTextModels.forEach((model) => {
        expect(model.provider).toBe('openai');
        expect(model.capabilities).toContain('text-generation');
      });
    });

    it('should return empty array for non-existent capability', async () => {
      const models = await factory.getModelsByProvider(
        'anthropic',
        'image-generation'
      );

      expect(models).toEqual([]);
    });
  });

  describe('Configuration Options', () => {
    it('should respect maxRetries configuration', () => {
      const config: AIServiceFactoryConfig = {
        maxRetries: 5,
      };

      const customFactory = new AIServiceFactory(config);
      const service = customFactory.createTextService('openai', 'gpt-4o-mini');

      expect(service).toBeDefined();
    });

    it('should use default values when config is not provided', async () => {
      const defaultFactory = new AIServiceFactory();

      expect(await defaultFactory.isProviderAvailable('openai')).toBe(true);
      expect((await defaultFactory.getAvailableModels()).length).toBeGreaterThan(0);
    });
  });
});
