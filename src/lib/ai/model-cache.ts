/**
 * Model Cache Service
 *
 * Caches AI model information to reduce repeated lookups and API calls.
 * Implements response caching for model registry data.
 *
 * Task: 36.1 - Add response caching for models
 */

import {
  getCacheWrapper,
  CacheWrapper,
  CacheOptions,
} from '../cache/cache-manager';
import type { ModelInfo, ServiceCapability } from './factory';
import type { AIProvider } from './types';

/**
 * Cache TTL configurations (in seconds)
 */
const CACHE_TTL = {
  MODEL_INFO: 3600, // 1 hour - models don't change frequently
  MODEL_LIST: 1800, // 30 minutes
  PROVIDER_STATUS: 300, // 5 minutes - check availability more frequently
} as const;

/**
 * Cache key generators for model data
 */
export const ModelCacheKeys = {
  modelInfo: (modelId: string) => `ai:model:${modelId}`,
  modelList: (capability?: ServiceCapability) =>
    `ai:models:${capability || 'all'}`,
  providerModels: (provider: AIProvider, capability?: ServiceCapability) =>
    `ai:provider:${provider}:models:${capability || 'all'}`,
  providerStatus: (provider: AIProvider) => `ai:provider:${provider}:status`,
  allModels: () => 'ai:models:all',
} as const;

/**
 * Model Cache Service
 *
 * Provides caching layer for AI model information to improve performance
 * and reduce redundant lookups.
 */
export class ModelCacheService {
  private cache: CacheWrapper;

  constructor(cacheWrapper?: CacheWrapper) {
    this.cache = cacheWrapper || getCacheWrapper();
  }

  /**
   * Get cached model information
   *
   * @param modelId - Model identifier
   * @param fetchFn - Function to fetch model if not cached
   * @returns Model information or null if not found
   */
  async getModelInfo(
    modelId: string,
    fetchFn: () => Promise<ModelInfo | undefined>
  ): Promise<ModelInfo | undefined> {
    const key = ModelCacheKeys.modelInfo(modelId);

    const result = await this.cache.getOrCompute(
      key,
      async () => {
        const model = await fetchFn();
        // Store undefined as a special marker to cache "not found" results
        return model === undefined ? null : model;
      },
      { ttl: CACHE_TTL.MODEL_INFO }
    );

    // Convert null back to undefined for the API
    return result === null ? undefined : result;
  }

  /**
   * Get cached list of available models
   *
   * @param capability - Optional capability filter
   * @param fetchFn - Function to fetch models if not cached
   * @returns Array of model information
   */
  async getAvailableModels(
    capability: ServiceCapability | undefined,
    fetchFn: () => Promise<ModelInfo[]>
  ): Promise<ModelInfo[]> {
    const key = ModelCacheKeys.modelList(capability);

    return this.cache.getOrCompute(key, fetchFn, {
      ttl: CACHE_TTL.MODEL_LIST,
    });
  }

  /**
   * Get cached models by provider
   *
   * @param provider - AI provider
   * @param capability - Optional capability filter
   * @param fetchFn - Function to fetch models if not cached
   * @returns Array of model information
   */
  async getModelsByProvider(
    provider: AIProvider,
    capability: ServiceCapability | undefined,
    fetchFn: () => Promise<ModelInfo[]>
  ): Promise<ModelInfo[]> {
    const key = ModelCacheKeys.providerModels(provider, capability);

    return this.cache.getOrCompute(key, fetchFn, {
      ttl: CACHE_TTL.MODEL_LIST,
    });
  }

  /**
   * Get cached provider availability status
   *
   * @param provider - AI provider
   * @param checkFn - Function to check provider status if not cached
   * @returns True if provider is available
   */
  async getProviderStatus(
    provider: AIProvider,
    checkFn: () => Promise<boolean>
  ): Promise<boolean> {
    const key = ModelCacheKeys.providerStatus(provider);

    return this.cache.getOrCompute(key, checkFn, {
      ttl: CACHE_TTL.PROVIDER_STATUS,
    });
  }

  /**
   * Invalidate model cache
   *
   * @param modelId - Optional specific model to invalidate
   */
  async invalidateModelCache(modelId?: string): Promise<void> {
    if (modelId) {
      await this.cache.getCache().delete(ModelCacheKeys.modelInfo(modelId));
    } else {
      // Clear all model-related caches
      await this.cache.getCache().delete(ModelCacheKeys.allModels());
    }
  }

  /**
   * Invalidate provider cache
   *
   * @param provider - AI provider to invalidate
   */
  async invalidateProviderCache(provider: AIProvider): Promise<void> {
    await this.cache.getCache().delete(ModelCacheKeys.providerStatus(provider));
  }

  /**
   * Warm up cache with model data
   *
   * Pre-loads frequently accessed model information into cache
   *
   * @param models - Array of models to cache
   */
  async warmUpCache(models: ModelInfo[]): Promise<void> {
    const promises = models.map((model) =>
      this.cache.getCache().set(ModelCacheKeys.modelInfo(model.id), model, {
        ttl: CACHE_TTL.MODEL_INFO,
      })
    );

    await Promise.all(promises);
  }
}

/**
 * Singleton instance
 */
let modelCacheInstance: ModelCacheService | null = null;

/**
 * Get or create the model cache service instance
 */
export function getModelCacheService(): ModelCacheService {
  if (!modelCacheInstance) {
    modelCacheInstance = new ModelCacheService();
  }
  return modelCacheInstance;
}

/**
 * Reset the model cache service (useful for testing)
 */
export function resetModelCacheService(): void {
  modelCacheInstance = null;
}
