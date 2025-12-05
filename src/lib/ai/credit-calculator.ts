/**
 * Credit Calculator Service
 *
 * Calculates credit costs for various AI operations based on usage metrics.
 * Requirements: 2.4, 7.1, 7.2
 */

import type { AIProvider, ImageSize } from './types';

/**
 * Credit calculation configuration
 */
export interface CreditConfig {
  /**
   * Credits per 1000 tokens for text generation
   */
  textCreditsPerKToken: Record<string, number>;

  /**
   * Credits per image by size
   */
  imageCredits: Record<ImageSize, number>;

  /**
   * Credits per 1000 characters for speech synthesis
   */
  speechCreditsPerKChar: number;

  /**
   * Credits per minute for transcription
   */
  transcriptionCreditsPerMinute: number;
}

/**
 * Load default credit configuration from centralized config
 */
function loadDefaultCreditConfig(): CreditConfig {
  try {
    const { config } = require('../../../config/config-loader');
    return {
      textCreditsPerKToken: config.credits.text,
      imageCredits: config.credits.image,
      speechCreditsPerKChar: config.credits.speech,
      transcriptionCreditsPerMinute: config.credits.transcription,
    };
  } catch {
    // Fallback if config not available
    return {
      textCreditsPerKToken: {
        'gpt-4': 30,
        'gpt-4-turbo': 20,
        'gpt-4o': 15,
        'gpt-3.5-turbo': 2,
        'claude-3-opus': 30,
        'claude-3-sonnet': 15,
        'claude-3-haiku': 5,
        'claude-3-5-sonnet': 15,
        'gemini-pro': 10,
        'gemini-1.5-pro': 15,
        'gemini-1.5-flash': 5,
        'mistral-large': 20,
        'mistral-medium': 10,
        'mistral-small': 5,
        default: 10,
      },
      imageCredits: {
        '256x256': 10,
        '512x512': 20,
        '1024x1024': 40,
        '1792x1024': 60,
        '1024x1792': 60,
      },
      speechCreditsPerKChar: 5,
      transcriptionCreditsPerMinute: 3,
    };
  }
}

/**
 * Default credit configuration
 * Loaded from centralized config system
 */
export const DEFAULT_CREDIT_CONFIG: CreditConfig = loadDefaultCreditConfig();

/**
 * Credit Calculator
 *
 * Provides methods to calculate credit costs for different AI operations
 */
export class CreditCalculator {
  private config: CreditConfig;

  constructor(config: CreditConfig = DEFAULT_CREDIT_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate credits for text generation based on token usage
   *
   * @param tokens - Number of tokens used (input + output)
   * @param model - Model identifier
   * @returns Credit cost
   */
  calculateTextCredits(tokens: number, model: string): number {
    if (tokens < 0) {
      throw new Error('Token count cannot be negative');
    }

    if (!Number.isFinite(tokens)) {
      throw new Error('Token count must be a finite number');
    }

    // Get rate for specific model or use default
    const ratePerKToken =
      this.config.textCreditsPerKToken[model] ??
      this.config.textCreditsPerKToken['default'];

    // Calculate credits: (tokens / 1000) * rate
    const credits = (tokens / 1000) * ratePerKToken;

    // Round up to nearest integer (always charge at least 1 credit if tokens > 0)
    return tokens > 0 ? Math.ceil(credits) : 0;
  }

  /**
   * Calculate credits for text generation with separate input/output tokens
   * Some providers charge different rates for input vs output tokens
   *
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @param model - Model identifier
   * @returns Credit cost
   */
  calculateTextCreditsDetailed(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    if (inputTokens < 0 || outputTokens < 0) {
      throw new Error('Token counts cannot be negative');
    }

    if (!Number.isFinite(inputTokens) || !Number.isFinite(outputTokens)) {
      throw new Error('Token counts must be finite numbers');
    }

    // For now, use combined total
    // In future, could implement different rates for input/output
    const totalTokens = inputTokens + outputTokens;
    return this.calculateTextCredits(totalTokens, model);
  }

  /**
   * Calculate credits for image generation based on size
   *
   * @param size - Image size/resolution
   * @param count - Number of images (default: 1)
   * @returns Credit cost
   */
  calculateImageCredits(size: ImageSize, count: number = 1): number {
    if (count < 0) {
      throw new Error('Image count cannot be negative');
    }

    if (!Number.isInteger(count)) {
      throw new Error('Image count must be an integer');
    }

    const creditsPerImage = this.config.imageCredits[size];

    if (creditsPerImage === undefined) {
      throw new Error(`Unknown image size: ${size}`);
    }

    return creditsPerImage * count;
  }

  /**
   * Calculate credits for speech synthesis based on character count
   *
   * @param text - Text to be synthesized
   * @returns Credit cost
   */
  calculateSpeechCredits(text: string): number {
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    const charCount = text.length;

    if (charCount === 0) {
      return 0;
    }

    // Calculate credits: (characters / 1000) * rate
    const credits = (charCount / 1000) * this.config.speechCreditsPerKChar;

    // Round up to nearest integer (always charge at least 1 credit if text exists)
    return Math.ceil(credits);
  }

  /**
   * Calculate credits for transcription based on audio duration
   *
   * @param durationSeconds - Audio duration in seconds
   * @returns Credit cost
   */
  calculateTranscriptionCredits(durationSeconds: number): number {
    if (durationSeconds < 0) {
      throw new Error('Duration cannot be negative');
    }

    if (!Number.isFinite(durationSeconds)) {
      throw new Error('Duration must be a finite number');
    }

    if (durationSeconds === 0) {
      return 0;
    }

    // Convert seconds to minutes
    const durationMinutes = durationSeconds / 60;

    // Calculate credits: minutes * rate
    const credits = durationMinutes * this.config.transcriptionCreditsPerMinute;

    // Round up to nearest integer (always charge at least 1 credit if duration > 0)
    return Math.ceil(credits);
  }

  /**
   * Estimate tokens from text (rough approximation)
   * Used when actual token count is not available
   *
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  estimateTokens(text: string): number {
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    // Rough estimation: ~4 characters per token on average
    // This is a simplification; actual tokenization varies by model
    const estimatedTokens = Math.ceil(text.length / 4);

    return estimatedTokens;
  }

  /**
   * Estimate credits for text generation when token count is unknown
   *
   * @param text - Text to estimate
   * @param model - Model identifier
   * @returns Estimated credit cost
   */
  estimateTextCredits(text: string, model: string): number {
    const estimatedTokens = this.estimateTokens(text);
    return this.calculateTextCredits(estimatedTokens, model);
  }

  /**
   * Get the credit rate for a specific model
   *
   * @param model - Model identifier
   * @returns Credits per 1000 tokens
   */
  getModelRate(model: string): number {
    return (
      this.config.textCreditsPerKToken[model] ??
      this.config.textCreditsPerKToken['default']
    );
  }

  /**
   * Get all supported image sizes and their costs
   *
   * @returns Map of image sizes to credit costs
   */
  getImagePricing(): Record<ImageSize, number> {
    return { ...this.config.imageCredits };
  }

  /**
   * Get speech synthesis rate
   *
   * @returns Credits per 1000 characters
   */
  getSpeechRate(): number {
    return this.config.speechCreditsPerKChar;
  }

  /**
   * Get transcription rate
   *
   * @returns Credits per minute
   */
  getTranscriptionRate(): number {
    return this.config.transcriptionCreditsPerMinute;
  }

  /**
   * Update configuration
   *
   * @param config - New configuration (partial update supported)
   */
  updateConfig(config: Partial<CreditConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      textCreditsPerKToken: {
        ...this.config.textCreditsPerKToken,
        ...(config.textCreditsPerKToken ?? {}),
      },
      imageCredits: {
        ...this.config.imageCredits,
        ...(config.imageCredits ?? {}),
      },
    };
  }
}

/**
 * Default credit calculator instance
 */
export const creditCalculator = new CreditCalculator();

/**
 * Helper function to calculate text credits
 */
export function calculateTextCredits(tokens: number, model: string): number {
  return creditCalculator.calculateTextCredits(tokens, model);
}

/**
 * Helper function to calculate image credits
 */
export function calculateImageCredits(size: ImageSize, count?: number): number {
  return creditCalculator.calculateImageCredits(size, count);
}

/**
 * Helper function to calculate speech credits
 */
export function calculateSpeechCredits(text: string): number {
  return creditCalculator.calculateSpeechCredits(text);
}

/**
 * Helper function to calculate transcription credits
 */
export function calculateTranscriptionCredits(durationSeconds: number): number {
  return creditCalculator.calculateTranscriptionCredits(durationSeconds);
}
