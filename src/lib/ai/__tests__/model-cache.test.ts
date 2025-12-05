/**
 * Model Cache Service Tests
 *
 * Tests for the model caching functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelCacheService } from '../model-cache';
import { MemoryCacheManager, CacheWrapper } from '../../cache/cache-manager';
import type { ModelInfo } from '../factory';

describe('ModelCacheService', () => {
  let cacheService: ModelCacheService;

  beforeEach(() => {
    // Create a fresh cache instance for each test
    const freshCache = new MemoryCacheManager();
    const freshWrapper = new CacheWrapper(freshCache);
    cacheService = new ModelCacheService(freshWrapper);
  });

  describe('getModelInfo', () => {
    it('should cache model information', async () => {
      const mockModel: ModelInfo = {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        capabilities: ['text-generation'],
        description: 'Test model',
      };

      const fetchFn = vi.fn().mockResolvedValue(mockModel);

      // First call - should fetch
      const result1 = await cacheService.getModelInfo('gpt-4o', fetchFn);
      expect(result1).toEqual(mockModel);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await cacheService.getModelInfo('gpt-4o', fetchFn);
      expect(result2).toEqual(mockModel);
      expect(fetchFn).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle undefined models', async () => {
      const fetchFn = vi.fn().mockResolvedValue(undefined);

      const result = await cacheService.getModelInfo('unknown', fetchFn);
      expect(result).toBeUndefined();
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAvailableModels', () => {
    it('should cache model lists', async () => {
      const mockModels: ModelInfo[] = [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          capabilities: ['text-generation'],
        },
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          capabilities: ['text-generation'],
        },
      ];

      const fetchFn = vi.fn().mockResolvedValue(mockModels);

      // First call - should fetch
      const result1 = await cacheService.getAvailableModels(
        'text-generation',
        fetchFn
      );
      expect(result1).toEqual(mockModels);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await cacheService.getAvailableModels(
        'text-generation',
        fetchFn
      );
      expect(result2).toEqual(mockModels);
      expect(fetchFn).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should cache different capabilities separately', async () => {
      const textModels: ModelInfo[] = [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          capabilities: ['text-generation'],
        },
      ];

      const imageModels: ModelInfo[] = [
        {
          id: 'dall-e-3',
          name: 'DALL-E 3',
          provider: 'openai',
          capabilities: ['image-generation'],
        },
      ];

      const textFetchFn = vi.fn().mockResolvedValue(textModels);
      const imageFetchFn = vi.fn().mockResolvedValue(imageModels);

      // Fetch text models
      const textResult = await cacheService.getAvailableModels(
        'text-generation',
        textFetchFn
      );
      expect(textResult).toEqual(textModels);

      // Fetch image models
      const imageResult = await cacheService.getAvailableModels(
        'image-generation',
        imageFetchFn
      );
      expect(imageResult).toEqual(imageModels);

      // Both should have been called once
      expect(textFetchFn).toHaveBeenCalledTimes(1);
      expect(imageFetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProviderStatus', () => {
    it('should cache provider availability status', async () => {
      const checkFn = vi.fn().mockResolvedValue(true);

      // First call - should check
      const result1 = await cacheService.getProviderStatus('openai', checkFn);
      expect(result1).toBe(true);
      expect(checkFn).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await cacheService.getProviderStatus('openai', checkFn);
      expect(result2).toBe(true);
      expect(checkFn).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('invalidateModelCache', () => {
    it('should invalidate specific model cache', async () => {
      const mockModel: ModelInfo = {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        capabilities: ['text-generation'],
      };

      const fetchFn = vi.fn().mockResolvedValue(mockModel);

      // Cache the model
      await cacheService.getModelInfo('gpt-4o', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Invalidate cache
      await cacheService.invalidateModelCache('gpt-4o');

      // Should fetch again
      await cacheService.getModelInfo('gpt-4o', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('warmUpCache', () => {
    it('should pre-load models into cache', async () => {
      const mockModels: ModelInfo[] = [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          capabilities: ['text-generation'],
        },
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          capabilities: ['text-generation'],
        },
      ];

      // Warm up cache
      await cacheService.warmUpCache(mockModels);

      // Fetch should use cache (not call fetchFn)
      const fetchFn = vi.fn();
      const result = await cacheService.getModelInfo('gpt-4o', fetchFn);

      expect(result).toBeDefined();
      expect(result?.id).toBe('gpt-4o');
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });
});
