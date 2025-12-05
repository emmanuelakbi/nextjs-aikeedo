/**
 * Transcription Service Interface
 *
 * Provides audio-to-text transcription capabilities with language detection
 * and timestamp support.
 */

import type { TranscriptionResponse } from '../types';

export type TranscriptionFormat =
  | 'text'
  | 'json'
  | 'verbose_json'
  | 'srt'
  | 'vtt';

export interface TranscriptionOptions {
  /**
   * Language of the audio (ISO-639-1 code)
   * If not specified, language will be auto-detected
   */
  language?: string;

  /**
   * Response format
   */
  format?: TranscriptionFormat;

  /**
   * Include word-level timestamps
   */
  timestamps?: boolean;

  /**
   * Temperature for sampling (0.0 - 1.0)
   * Higher values increase randomness
   */
  temperature?: number;

  /**
   * Optional prompt to guide the model's style
   */
  prompt?: string;
}

export interface AudioFile {
  /**
   * File buffer or path
   */
  data: Buffer | string;

  /**
   * File name
   */
  filename: string;

  /**
   * MIME type (e.g., 'audio/mpeg', 'audio/wav')
   */
  mimeType: string;
}

export interface TranscriptionService {
  /**
   * Transcribe audio file to text
   *
   * @param audio - Audio file to transcribe
   * @param options - Transcription options
   * @returns Promise resolving to transcription text and metadata
   */
  transcribeAudio(
    audio: AudioFile,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResponse>;

  /**
   * Translate audio to English text
   *
   * @param audio - Audio file to translate
   * @param options - Transcription options
   * @returns Promise resolving to translated text
   */
  translateAudio(
    audio: AudioFile,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResponse>;

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[];

  /**
   * Get supported languages for transcription
   */
  getSupportedLanguages(): string[];

  /**
   * Get the model identifier
   */
  getModel(): string;

  /**
   * Get the provider name
   */
  getProvider(): string;

  /**
   * Get maximum file size in bytes
   */
  getMaxFileSize(): number;
}
