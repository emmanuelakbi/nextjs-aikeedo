/**
 * OpenAI Speech Synthesis Service
 *
 * Implements text-to-speech using OpenAI's TTS models.
 * Supports multiple voices, formats, and speed settings with retry logic.
 */

import OpenAI from 'openai';
import type {
  SpeechSynthesisService,
  SpeechSynthesisOptions,
  Voice,
  AudioFormat,
} from '../interfaces/speech-synthesis-service';
import type { SpeechSynthesisResponse, ResponseMetadata } from '../types';
import { getEnv } from '@/lib/env';

export class OpenAISpeechSynthesisService implements SpeechSynthesisService {
  private client: OpenAI;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;

  // OpenAI TTS voices
  private readonly voices: Voice[] = [
    {
      id: 'alloy',
      name: 'Alloy',
      language: 'en-US',
      gender: 'neutral',
      description: 'Neutral and balanced voice',
    },
    {
      id: 'echo',
      name: 'Echo',
      language: 'en-US',
      gender: 'male',
      description: 'Male voice with clear articulation',
    },
    {
      id: 'fable',
      name: 'Fable',
      language: 'en-US',
      gender: 'neutral',
      description: 'Warm and expressive voice',
    },
    {
      id: 'onyx',
      name: 'Onyx',
      language: 'en-US',
      gender: 'male',
      description: 'Deep male voice',
    },
    {
      id: 'nova',
      name: 'Nova',
      language: 'en-US',
      gender: 'female',
      description: 'Friendly female voice',
    },
    {
      id: 'shimmer',
      name: 'Shimmer',
      language: 'en-US',
      gender: 'female',
      description: 'Soft female voice',
    },
  ];

  constructor(model: string = 'tts-1', maxRetries: number = 3) {
    const env = getEnv();

    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.model = model;
    this.maxRetries = maxRetries;
    this.retryDelay = 1000;
  }

  async synthesizeSpeech(
    text: string,
    options?: SpeechSynthesisOptions
  ): Promise<SpeechSynthesisResponse> {
    return this.executeWithRetry(async () => {
      const voice = options?.voice || 'alloy';
      const format = this.mapFormat(options?.format);
      const speed = this.validateSpeed(options?.speed);

      const response = await this.client.audio.speech.create({
        model: this.model,
        voice: voice as
          | 'alloy'
          | 'echo'
          | 'fable'
          | 'onyx'
          | 'nova'
          | 'shimmer',
        input: text,
        response_format: format,
        speed,
      });

      // Convert response to buffer
      const buffer = Buffer.from(await response.arrayBuffer());

      // In a real implementation, you would:
      // 1. Upload the buffer to your storage (S3, etc.)
      // 2. Return the public URL
      // For now, we'll create a data URL (not recommended for production)
      const base64Audio = buffer.toString('base64');
      const mimeType = this.getMimeType(format);
      const url = `data:${mimeType};base64,${base64Audio}`;

      const duration = this.estimateDuration(text, speed);
      const credits = this.calculateCredits(text.length);

      const metadata: ResponseMetadata = {
        model: this.model,
        provider: 'openai',
        credits,
      };

      return {
        url,
        format: format || 'mp3',
        duration,
        metadata,
      };
    });
  }

  async getAvailableVoices(): Promise<Voice[]> {
    return this.voices;
  }

  getSupportedFormats(): AudioFormat[] {
    return ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'];
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'openai';
  }

  estimateDuration(text: string, speed: number = 1.0): number {
    // Average speaking rate: ~150 words per minute at normal speed
    // Adjust for speed multiplier
    const words = text.split(/\s+/).length;
    const baseWPM = 150;
    const adjustedWPM = baseWPM * speed;
    const minutes = words / adjustedWPM;
    return Math.ceil(minutes * 60); // Return seconds
  }

  /**
   * Map our generic format to OpenAI's format
   */
  private mapFormat(
    format?: AudioFormat
  ): 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm' {
    if (!format) {
      return 'mp3';
    }

    const supportedFormats = this.getSupportedFormats();
    if (!supportedFormats.includes(format)) {
      console.warn(`Format ${format} not supported, using mp3`);
      return 'mp3';
    }

    return format as 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  }

  /**
   * Validate and clamp speed to OpenAI's range (0.25 - 4.0)
   */
  private validateSpeed(speed?: number): number {
    if (!speed) {
      return 1.0;
    }

    if (speed < 0.25) {
      console.warn('Speed too low, clamping to 0.25');
      return 0.25;
    }

    if (speed > 4.0) {
      console.warn('Speed too high, clamping to 4.0');
      return 4.0;
    }

    return speed;
  }

  /**
   * Get MIME type for audio format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      opus: 'audio/opus',
      aac: 'audio/aac',
      flac: 'audio/flac',
      wav: 'audio/wav',
      pcm: 'audio/pcm',
    };
    return mimeTypes[format] || 'audio/mpeg';
  }

  /**
   * Execute a function with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw this.handleError(error);
      }

      if (!this.isRetryableError(error)) {
        throw this.handleError(error);
      }

      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await this.sleep(delay);

      return this.executeWithRetry(fn, attempt + 1);
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof OpenAI.APIError) {
      return (
        error.status === 429 ||
        error.status === 408 ||
        error.status === 503 ||
        error.status === 500
      );
    }
    return false;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      return new Error(`OpenAI API Error (${error.status}): ${error.message}`);
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error('Unknown error occurred');
  }

  /**
   * Calculate credits based on character count
   */
  private calculateCredits(characterCount: number): number {
    // Example: 1 credit per 1000 characters
    return Math.ceil(characterCount / 1000);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
