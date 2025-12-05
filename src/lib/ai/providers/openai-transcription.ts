/**
 * OpenAI Transcription Service
 *
 * Implements audio-to-text transcription using OpenAI's Whisper model.
 * Supports multiple languages, formats, and timestamp options with retry logic.
 */

import OpenAI from 'openai';
import type {
  TranscriptionService,
  TranscriptionOptions,
  AudioFile,
  TranscriptionFormat,
} from '../interfaces/transcription-service';
import type {
  TranscriptionResponse,
  TranscriptionSegment,
  ResponseMetadata,
} from '../types';
import { getEnv } from '@/lib/env';

export class OpenAITranscriptionService implements TranscriptionService {
  private client: OpenAI;
  private model: string;
  private maxRetries: number;
  private retryDelay: number;
  private maxFileSize: number;

  // Supported audio formats
  private readonly supportedFormats = [
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/wav',
    'audio/webm',
    'audio/flac',
    'audio/ogg',
  ];

  // ISO-639-1 language codes supported by Whisper
  private readonly supportedLanguages = [
    'en',
    'zh',
    'de',
    'es',
    'ru',
    'ko',
    'fr',
    'ja',
    'pt',
    'tr',
    'pl',
    'ca',
    'nl',
    'ar',
    'sv',
    'it',
    'id',
    'hi',
    'fi',
    'vi',
    'he',
    'uk',
    'el',
    'ms',
    'cs',
    'ro',
    'da',
    'hu',
    'ta',
    'no',
    'th',
    'ur',
    'hr',
    'bg',
    'lt',
    'la',
    'mi',
    'ml',
    'cy',
    'sk',
    'te',
    'fa',
    'lv',
    'bn',
    'sr',
    'az',
    'sl',
    'kn',
    'et',
    'mk',
    'br',
    'eu',
    'is',
    'hy',
    'ne',
    'mn',
    'bs',
    'kk',
    'sq',
    'sw',
    'gl',
    'mr',
    'pa',
    'si',
    'km',
    'sn',
    'yo',
    'so',
    'af',
    'oc',
    'ka',
    'be',
    'tg',
    'sd',
    'gu',
    'am',
    'yi',
    'lo',
    'uz',
    'fo',
    'ht',
    'ps',
    'tk',
    'nn',
    'mt',
    'sa',
    'lb',
    'my',
    'bo',
    'tl',
    'mg',
    'as',
    'tt',
    'haw',
    'ln',
    'ha',
    'ba',
    'jw',
    'su',
  ];

  constructor(model: string = 'whisper-1', maxRetries: number = 3) {
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
    this.maxFileSize = 25 * 1024 * 1024; // 25 MB
  }

  async transcribeAudio(
    audio: AudioFile,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResponse> {
    this.validateAudioFile(audio);

    return this.executeWithRetry(async () => {
      const file = await this.prepareFile(audio);
      const format = options?.format || 'verbose_json';

      const response = await this.client.audio.transcriptions.create({
        file,
        model: this.model,
        language: options?.language,
        prompt: options?.prompt,
        response_format: format as
          | 'json'
          | 'text'
          | 'srt'
          | 'verbose_json'
          | 'vtt',
        temperature: options?.temperature,
        timestamp_granularities: options?.timestamps ? ['segment'] : undefined,
      });

      return this.parseResponse(response, format, audio);
    });
  }

  async translateAudio(
    audio: AudioFile,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResponse> {
    this.validateAudioFile(audio);

    return this.executeWithRetry(async () => {
      const file = await this.prepareFile(audio);
      const format = options?.format || 'verbose_json';

      const response = await this.client.audio.translations.create({
        file,
        model: this.model,
        prompt: options?.prompt,
        response_format: format as
          | 'json'
          | 'text'
          | 'srt'
          | 'verbose_json'
          | 'vtt',
        temperature: options?.temperature,
      });

      return this.parseResponse(response, format, audio, 'en');
    });
  }

  getSupportedFormats(): string[] {
    return this.supportedFormats;
  }

  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'openai';
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Validate audio file
   */
  private validateAudioFile(audio: AudioFile): void {
    if (!this.supportedFormats.includes(audio.mimeType)) {
      throw new Error(
        `Unsupported audio format: ${audio.mimeType}. Supported formats: ${this.supportedFormats.join(', ')}`
      );
    }

    if (typeof audio.data === 'string') {
      // If it's a file path, we can't check size here
      return;
    }

    if (audio.data.length > this.maxFileSize) {
      throw new Error(
        `Audio file too large: ${audio.data.length} bytes. Maximum: ${this.maxFileSize} bytes`
      );
    }
  }

  /**
   * Prepare file for OpenAI API
   */
  private async prepareFile(audio: AudioFile): Promise<File> {
    if (typeof audio.data === 'string') {
      // If it's a file path, read it
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(audio.data);
      return new File([buffer], audio.filename, { type: audio.mimeType });
    }

    // If it's a buffer, convert to File
    return new File([audio.data as BlobPart], audio.filename, {
      type: audio.mimeType,
    });
  }

  /**
   * Parse transcription response based on format
   */
  private parseResponse(
    response: any,
    format: TranscriptionFormat,
    _audio: AudioFile,
    detectedLanguage?: string
  ): TranscriptionResponse {
    let text: string;
    let duration: number = 0;
    let language: string | undefined = detectedLanguage;
    let segments: TranscriptionSegment[] | undefined;

    if (format === 'verbose_json' && typeof response === 'object') {
      text = response.text || '';
      duration = response.duration || 0;
      language = response.language || detectedLanguage;

      if (response.segments && Array.isArray(response.segments)) {
        segments = response.segments.map((seg: any) => ({
          text: seg.text || '',
          start: seg.start || 0,
          end: seg.end || 0,
        }));
      }
    } else if (format === 'json' && typeof response === 'object') {
      text = response.text || '';
    } else if (typeof response === 'string') {
      text = response;
    } else {
      text = String(response);
    }

    // Estimate duration if not provided (rough estimate based on text length)
    if (!duration) {
      duration = this.estimateDuration(text);
    }

    const credits = this.calculateCredits(duration);

    const metadata: ResponseMetadata = {
      model: this.model,
      provider: 'openai',
      credits,
    };

    return {
      text,
      language,
      duration,
      segments,
      metadata,
    };
  }

  /**
   * Estimate audio duration from text length (rough approximation)
   */
  private estimateDuration(text: string): number {
    // Average speaking rate: ~150 words per minute
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.ceil(minutes * 60);
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
   * Calculate credits based on audio duration
   */
  private calculateCredits(durationSeconds: number): number {
    // Example: 1 credit per minute of audio
    const minutes = Math.ceil(durationSeconds / 60);
    return Math.max(1, minutes);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
