/**
 * AI Service Factory
 *
 * Provides centralized creation and management of AI service instances.
 * Implements provider selection, model registry, validation, and fallback handling.
 *
 * Requirements: 1.2, 1.4, 8.1, 8.2
 */

import type {
  TextGenerationService,
  ImageGenerationService,
  SpeechSynthesisService,
  TranscriptionService,
} from './interfaces';
import type { AIProvider } from './types';
import {
  OpenAITextGenerationService,
  OpenAIImageGenerationService,
  OpenAISpeechSynthesisService,
  OpenAITranscriptionService,
  AnthropicTextGenerationService,
  GoogleTextGenerationService,
  GoogleImageGenerationService,
  MistralTextGenerationService,
  OpenRouterTextGenerationService,
  PollinationsImageGenerationService,
  BrowserSpeechSynthesisService,
} from './providers';
import { getEnv } from '@/lib/env';
import { getModelCacheService } from './model-cache';

/**
 * Service capability types
 */
export type ServiceCapability =
  | 'text-generation'
  | 'image-generation'
  | 'speech-synthesis'
  | 'transcription';

/**
 * Model information in the registry
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  capabilities: ServiceCapability[];
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  pricing?: {
    input: number; // Cost per 1M tokens
    output: number; // Cost per 1M tokens
  };
  deprecated?: boolean;
  replacementModel?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority for fallback
}

/**
 * Factory configuration options
 */
export interface AIServiceFactoryConfig {
  providers?: ProviderConfig[];
  enableFallback?: boolean;
  maxRetries?: number;
}

/**
 * AI Service Factory
 *
 * Centralized factory for creating AI service instances with provider
 * selection, validation, and fallback support.
 */
export class AIServiceFactory {
  private modelRegistry: Map<string, ModelInfo>;
  private providerConfigs: Map<AIProvider, ProviderConfig>;
  private enableFallback: boolean;
  private maxRetries: number;
  private modelCache = getModelCacheService();

  constructor(config?: AIServiceFactoryConfig) {
    this.modelRegistry = new Map();
    this.providerConfigs = new Map();
    this.enableFallback = config?.enableFallback ?? true;
    this.maxRetries = config?.maxRetries ?? 3;

    this.initializeModelRegistry();
    this.initializeProviderConfigs(config?.providers);
  }

  /**
   * Create a text generation service
   *
   * @param provider - AI provider to use
   * @param model - Model identifier
   * @returns Text generation service instance
   * @throws Error if provider is not available or model is invalid
   */
  createTextService(
    provider: AIProvider,
    model: string
  ): TextGenerationService {
    this.validateProvider(provider);
    this.validateModel(model, 'text-generation');

    const config = this.providerConfigs.get(provider);

    switch (provider) {
      case 'openai':
        return new OpenAITextGenerationService(model, this.maxRetries);

      case 'anthropic':
        return new AnthropicTextGenerationService(model, this.maxRetries);

      case 'google':
        return new GoogleTextGenerationService(model, this.maxRetries);

      case 'mistral':
        return new MistralTextGenerationService(model, this.maxRetries);

      case 'openrouter':
        return new OpenRouterTextGenerationService(model, this.maxRetries);

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Create an image generation service
   *
   * @param provider - AI provider to use
   * @param model - Model identifier
   * @returns Image generation service instance
   * @throws Error if provider is not available or model is invalid
   */
  createImageService(
    provider: AIProvider,
    model: string
  ): ImageGenerationService {
    // Use Pollinations as default/fallback for free image generation
    if (provider === 'pollinations' || model === 'flux' || model === 'pollinations') {
      return new PollinationsImageGenerationService(model, this.maxRetries);
    }

    // For other providers, check if they're available
    if (provider === 'openai' && this.isProviderAvailableSync('openai')) {
      this.validateModel(model, 'image-generation');
      return new OpenAIImageGenerationService(model, this.maxRetries);
    }

    if (provider === 'google' && this.isProviderAvailableSync('google')) {
      this.validateModel(model, 'image-generation');
      return new GoogleImageGenerationService(model, this.maxRetries);
    }

    // Default to Pollinations (free, no API key needed)
    return new PollinationsImageGenerationService('flux', this.maxRetries);
  }

  /**
   * Create a speech synthesis service
   *
   * @param provider - AI provider to use
   * @param model - Model identifier
   * @returns Speech synthesis service instance
   * @throws Error if provider is not available or model is invalid
   */
  createSpeechService(
    provider: AIProvider,
    model: string
  ): SpeechSynthesisService {
    // Browser TTS (free, instant)
    if (provider === 'browser' || model === 'browser-tts' || model === 'browser') {
      return new BrowserSpeechSynthesisService(model);
    }

    // For OpenAI, check if it's available
    if (provider === 'openai' && this.isProviderAvailableSync('openai')) {
      this.validateModel(model, 'speech-synthesis');
      return new OpenAISpeechSynthesisService(model, this.maxRetries);
    }

    // Default to Browser TTS (free)
    return new BrowserSpeechSynthesisService('browser-tts');
  }

  /**
   * Create a transcription service
   *
   * @param provider - AI provider to use
   * @returns Transcription service instance
   * @throws Error if provider is not available
   */
  createTranscriptionService(provider: AIProvider): TranscriptionService {
    this.validateProvider(provider);

    switch (provider) {
      case 'openai':
        return new OpenAITranscriptionService('whisper-1', this.maxRetries);

      default:
        throw new Error(`Provider ${provider} does not support transcription`);
    }
  }

  /**
   * Create a text service with automatic fallback
   *
   * Attempts to create a service with the specified provider, falling back
   * to alternative providers if the primary is unavailable.
   *
   * @param provider - Preferred AI provider
   * @param model - Model identifier
   * @returns Text generation service instance
   * @throws Error if no providers are available
   */
  async createTextServiceWithFallback(
    provider: AIProvider,
    model: string
  ): Promise<TextGenerationService> {
    if (!this.enableFallback) {
      return this.createTextService(provider, model);
    }

    try {
      return this.createTextService(provider, model);
    } catch (error) {
      // Get fallback providers sorted by priority
      const fallbackProviders = this.getFallbackProviders(
        provider,
        'text-generation'
      );

      for (const fallbackProvider of fallbackProviders) {
        try {
          // Try to find a similar model for the fallback provider
          const fallbackModel = await this.findSimilarModel(
            model,
            fallbackProvider,
            'text-generation'
          );

          if (fallbackModel) {
            return this.createTextService(fallbackProvider, fallbackModel);
          }
        } catch (fallbackError) {
          // Continue to next fallback
          continue;
        }
      }

      // No fallback succeeded
      throw new Error(
        `Failed to create text service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all available models (with caching)
   *
   * @param capability - Optional filter by capability
   * @returns Array of model information
   */
  async getAvailableModels(
    capability?: ServiceCapability
  ): Promise<ModelInfo[]> {
    return this.modelCache.getAvailableModels(capability, async () => {
      const models = Array.from(this.modelRegistry.values());

      if (capability) {
        return models.filter(
          (model) =>
            model.capabilities.includes(capability) && !model.deprecated
        );
      }

      return models.filter((model) => !model.deprecated);
    });
  }

  /**
   * Get models by provider (with caching)
   *
   * @param provider - AI provider
   * @param capability - Optional filter by capability
   * @returns Array of model information
   */
  async getModelsByProvider(
    provider: AIProvider,
    capability?: ServiceCapability
  ): Promise<ModelInfo[]> {
    return this.modelCache.getModelsByProvider(
      provider,
      capability,
      async () => {
        const models = Array.from(this.modelRegistry.values()).filter(
          (model) => model.provider === provider && !model.deprecated
        );

        if (capability) {
          return models.filter((model) =>
            model.capabilities.includes(capability)
          );
        }

        return models;
      }
    );
  }

  /**
   * Get model information (with caching)
   *
   * @param modelId - Model identifier
   * @returns Model information or undefined if not found
   */
  async getModelInfo(modelId: string): Promise<ModelInfo | undefined> {
    return this.modelCache.getModelInfo(modelId, async () => {
      return this.modelRegistry.get(modelId);
    });
  }

  /**
   * Check if a provider is available (with caching)
   *
   * @param provider - AI provider to check
   * @returns True if provider is configured and enabled
   */
  async isProviderAvailable(provider: AIProvider): Promise<boolean> {
    // Pollinations and Browser are always available (no API key needed)
    if (provider === 'pollinations' || provider === 'browser') {
      return true;
    }

    return this.modelCache.getProviderStatus(provider, async () => {
      const config = this.providerConfigs.get(provider);
      if (!config?.enabled) {
        return false;
      }

      // Check if API key is configured
      const env = getEnv();
      switch (provider) {
        case 'openai':
          return !!env.OPENAI_API_KEY;
        case 'anthropic':
          return !!env.ANTHROPIC_API_KEY;
        case 'google':
          return !!env.GOOGLE_AI_API_KEY;
        case 'mistral':
          return !!env.MISTRAL_API_KEY;
        default:
          return false;
      }
    });
  }

  /**
   * Check if a provider is available (synchronous version for internal use)
   *
   * @param provider - AI provider to check
   * @returns True if provider is configured and enabled
   */
  private isProviderAvailableSync(provider: AIProvider): boolean {
    const config = this.providerConfigs.get(provider);
    if (!config?.enabled) {
      return false;
    }

    // Pollinations and Browser are always available (no API key needed)
    if (provider === 'pollinations' || provider === 'browser') {
      return true;
    }

    // Check if API key is configured
    const env = getEnv();
    switch (provider) {
      case 'openai':
        return !!env.OPENAI_API_KEY;
      case 'anthropic':
        return !!env.ANTHROPIC_API_KEY;
      case 'google':
        return !!env.GOOGLE_AI_API_KEY;
      case 'mistral':
        return !!env.MISTRAL_API_KEY;
      case 'openrouter':
        return !!env.OPENROUTER_API_KEY;
      default:
        return false;
    }
  }

  /**
   * Register a custom model
   *
   * @param model - Model information to register
   */
  registerModel(model: ModelInfo): void {
    this.modelRegistry.set(model.id, model);
  }

  /**
   * Update provider configuration
   *
   * @param provider - AI provider
   * @param config - Provider configuration
   */
  updateProviderConfig(provider: AIProvider, config: ProviderConfig): void {
    this.providerConfigs.set(provider, config);
  }

  /**
   * Initialize the model registry with known models
   */
  private initializeModelRegistry(): void {
    // OpenAI models
    this.registerModel({
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      capabilities: ['text-generation'],
      description: 'Most capable GPT-4 model with vision',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { input: 5.0, output: 15.0 },
    });

    this.registerModel({
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      capabilities: ['text-generation'],
      description: 'Affordable and fast GPT-4 model',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      pricing: { input: 0.15, output: 0.6 },
    });

    this.registerModel({
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      capabilities: ['text-generation'],
      description: 'High-performance GPT-4 model',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { input: 10.0, output: 30.0 },
    });

    this.registerModel({
      id: 'dall-e-3',
      name: 'DALL-E 3',
      provider: 'openai',
      capabilities: ['image-generation'],
      description: 'Advanced image generation model',
    });

    this.registerModel({
      id: 'tts-1',
      name: 'TTS-1',
      provider: 'openai',
      capabilities: ['speech-synthesis'],
      description: 'Text-to-speech model',
    });

    this.registerModel({
      id: 'whisper-1',
      name: 'Whisper',
      provider: 'openai',
      capabilities: ['transcription'],
      description: 'Speech-to-text model',
    });

    // Browser TTS (Free speech synthesis)
    this.registerModel({
      id: 'browser-tts',
      name: 'Browser TTS (Free)',
      provider: 'browser',
      capabilities: ['speech-synthesis'],
      description: 'Free text-to-speech using browser Web Speech API',
    });

    // Anthropic models
    this.registerModel({
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      capabilities: ['text-generation'],
      description: 'Most intelligent Claude model',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      pricing: { input: 3.0, output: 15.0 },
    });

    this.registerModel({
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      capabilities: ['text-generation'],
      description: 'Powerful model for complex tasks',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      pricing: { input: 15.0, output: 75.0 },
    });

    this.registerModel({
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      capabilities: ['text-generation'],
      description: 'Fast and affordable Claude model',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      pricing: { input: 0.25, output: 1.25 },
    });

    // Google models
    this.registerModel({
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'google',
      capabilities: ['text-generation'],
      description: 'Advanced reasoning and long context',
      contextWindow: 2000000,
      maxOutputTokens: 8192,
      pricing: { input: 1.25, output: 5.0 },
    });

    this.registerModel({
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      capabilities: ['text-generation'],
      description: 'Fast and efficient model',
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      pricing: { input: 0.075, output: 0.3 },
    });

    this.registerModel({
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'google',
      capabilities: ['text-generation'],
      description: 'Fast and versatile multimodal model',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      pricing: { input: 0.075, output: 0.3 },
    });

    this.registerModel({
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'google',
      capabilities: ['text-generation'],
      description: 'Mid-size multimodal model with thinking capabilities',
      contextWindow: 1048576,
      maxOutputTokens: 65536,
      pricing: { input: 0.075, output: 0.3 },
    });

    this.registerModel({
      id: 'imagen-3',
      name: 'Imagen 3',
      provider: 'google',
      capabilities: ['image-generation'],
      description: 'High-quality image generation',
    });

    // Pollinations (Free image generation)
    this.registerModel({
      id: 'flux',
      name: 'Flux (Free)',
      provider: 'pollinations',
      capabilities: ['image-generation'],
      description: 'Free high-quality image generation via Pollinations.ai',
    });

    this.registerModel({
      id: 'pollinations',
      name: 'Pollinations (Free)',
      provider: 'pollinations',
      capabilities: ['image-generation'],
      description: 'Free image generation using open-source models',
    });

    // Mistral models
    this.registerModel({
      id: 'mistral-large-latest',
      name: 'Mistral Large',
      provider: 'mistral',
      capabilities: ['text-generation'],
      description: 'Flagship model for complex tasks',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { input: 2.0, output: 6.0 },
    });

    this.registerModel({
      id: 'mistral-small-latest',
      name: 'Mistral Small',
      provider: 'mistral',
      capabilities: ['text-generation'],
      description: 'Cost-effective model',
      contextWindow: 32000,
      maxOutputTokens: 4096,
      pricing: { input: 0.2, output: 0.6 },
    });

    // OpenRouter models (100+ models through one API)
    // Free models
    this.registerModel({
      id: 'amazon/nova-2-lite-v1:free',
      name: 'Amazon Nova 2 Lite (FREE)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Free Amazon Nova model via OpenRouter',
      contextWindow: 300000,
      maxOutputTokens: 5000,
      pricing: { input: 0.0, output: 0.0 },
    });

    this.registerModel({
      id: 'arcee-ai/trinity-mini:free',
      name: 'Arcee Trinity Mini (FREE)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Free Arcee AI model via OpenRouter',
      contextWindow: 8192,
      maxOutputTokens: 2048,
      pricing: { input: 0.0, output: 0.0 },
    });

    this.registerModel({
      id: 'tngtech/tng-r1t-chimera:free',
      name: 'TNG R1T Chimera (FREE)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Free TNG Tech model via OpenRouter',
      contextWindow: 8192,
      maxOutputTokens: 2048,
      pricing: { input: 0.0, output: 0.0 },
    });

    this.registerModel({
      id: 'allenai/olmo-3-32b-think:free',
      name: 'Allen AI OLMo 3 32B Think (FREE)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Free Allen AI reasoning model via OpenRouter',
      contextWindow: 8192,
      maxOutputTokens: 2048,
      pricing: { input: 0.0, output: 0.0 },
    });

    this.registerModel({
      id: 'openai/gpt-4o',
      name: 'OpenAI GPT-4o (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Most capable GPT-4 model via OpenRouter',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { input: 5.0, output: 15.0 },
    });

    this.registerModel({
      id: 'openai/gpt-4o-mini',
      name: 'OpenAI GPT-4o Mini (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Affordable and fast GPT-4 via OpenRouter',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      pricing: { input: 0.15, output: 0.6 },
    });

    this.registerModel({
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Most intelligent Claude via OpenRouter',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      pricing: { input: 3.0, output: 15.0 },
    });

    this.registerModel({
      id: 'anthropic/claude-3-opus',
      name: 'Claude 3 Opus (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Powerful Claude for complex tasks via OpenRouter',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      pricing: { input: 15.0, output: 75.0 },
    });

    this.registerModel({
      id: 'anthropic/claude-3-haiku',
      name: 'Claude 3 Haiku (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Fast and affordable Claude via OpenRouter',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      pricing: { input: 0.25, output: 1.25 },
    });

    this.registerModel({
      id: 'google/gemini-pro-1.5',
      name: 'Gemini Pro 1.5 (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Advanced reasoning with 2M context via OpenRouter',
      contextWindow: 2000000,
      maxOutputTokens: 8192,
      pricing: { input: 1.25, output: 5.0 },
    });

    this.registerModel({
      id: 'google/gemini-flash-1.5',
      name: 'Gemini Flash 1.5 (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Fast and efficient Gemini via OpenRouter',
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      pricing: { input: 0.075, output: 0.3 },
    });

    this.registerModel({
      id: 'meta-llama/llama-3.1-405b-instruct',
      name: 'Llama 3.1 405B (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Largest open-source model via OpenRouter',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { input: 3.0, output: 3.0 },
    });

    this.registerModel({
      id: 'meta-llama/llama-3.1-70b-instruct',
      name: 'Llama 3.1 70B (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Balanced open-source model via OpenRouter',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { input: 0.88, output: 0.88 },
    });

    this.registerModel({
      id: 'mistralai/mistral-large',
      name: 'Mistral Large (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Flagship Mistral model via OpenRouter',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      pricing: { input: 2.0, output: 6.0 },
    });

    this.registerModel({
      id: 'mistralai/mistral-small',
      name: 'Mistral Small (via OpenRouter)',
      provider: 'openrouter',
      capabilities: ['text-generation'],
      description: 'Cost-effective Mistral via OpenRouter',
      contextWindow: 32000,
      maxOutputTokens: 4096,
      pricing: { input: 0.2, output: 0.6 },
    });
  }

  /**
   * Initialize provider configurations
   */
  private initializeProviderConfigs(customConfigs?: ProviderConfig[]): void {
    // Default configurations
    const defaults: ProviderConfig[] = [
      { provider: 'openai', enabled: true, priority: 1 },
      { provider: 'anthropic', enabled: true, priority: 2 },
      { provider: 'google', enabled: true, priority: 3 },
      { provider: 'mistral', enabled: true, priority: 4 },
      { provider: 'openrouter', enabled: true, priority: 5 },
      { provider: 'pollinations', enabled: true, priority: 6 },
      { provider: 'browser', enabled: true, priority: 7 },
    ];

    const configs = customConfigs || defaults;

    for (const config of configs) {
      this.providerConfigs.set(config.provider, config);
    }
  }

  /**
   * Validate that a provider is available
   */
  private validateProvider(provider: AIProvider): void {
    if (!this.isProviderAvailableSync(provider)) {
      throw new Error(
        `Provider ${provider} is not available. Please check configuration and API keys.`
      );
    }
  }

  /**
   * Validate that a model exists and supports the required capability
   */
  private validateModel(modelId: string, capability: ServiceCapability): void {
    const model = this.modelRegistry.get(modelId);

    if (!model) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    if (model.deprecated) {
      const replacement = model.replacementModel
        ? ` Use ${model.replacementModel} instead.`
        : '';
      throw new Error(`Model ${modelId} is deprecated.${replacement}`);
    }

    if (!model.capabilities.includes(capability)) {
      throw new Error(`Model ${modelId} does not support ${capability}`);
    }
  }

  /**
   * Get fallback providers for a given capability
   */
  private getFallbackProviders(
    excludeProvider: AIProvider,
    capability: ServiceCapability
  ): AIProvider[] {
    const providers = Array.from(this.providerConfigs.entries())
      .filter(
        ([provider, config]) =>
          provider !== excludeProvider &&
          config.enabled &&
          this.isProviderAvailableSync(provider) &&
          this.hasCapability(provider, capability)
      )
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([provider]) => provider);

    return providers;
  }

  /**
   * Check if a provider has a specific capability
   */
  private hasCapability(
    provider: AIProvider,
    capability: ServiceCapability
  ): boolean {
    const models = Array.from(this.modelRegistry.values()).filter(
      (model) =>
        model.provider === provider &&
        !model.deprecated &&
        model.capabilities.includes(capability)
    );
    return models.length > 0;
  }

  /**
   * Find a similar model from a different provider
   */
  private async findSimilarModel(
    originalModelId: string,
    targetProvider: AIProvider,
    capability: ServiceCapability
  ): Promise<string | null> {
    const originalModel = this.modelRegistry.get(originalModelId);
    if (!originalModel) {
      return null;
    }

    // Get models from target provider with the same capability
    const targetModels = await this.getModelsByProvider(
      targetProvider,
      capability
    );

    if (targetModels.length === 0) {
      return null;
    }

    // Try to find a model with similar characteristics
    // For now, just return the first available model
    // In a production system, you might want more sophisticated matching
    const firstModel = targetModels[0];
    return firstModel ? firstModel.id : null;
  }
}

/**
 * Default factory instance
 */
let defaultFactory: AIServiceFactory | null = null;

/**
 * Get or create the default factory instance
 */
export function getAIServiceFactory(
  config?: AIServiceFactoryConfig
): AIServiceFactory {
  if (!defaultFactory) {
    defaultFactory = new AIServiceFactory(config);
  }
  return defaultFactory;
}

/**
 * Reset the default factory instance (useful for testing)
 */
export function resetAIServiceFactory(): void {
  defaultFactory = null;
}
