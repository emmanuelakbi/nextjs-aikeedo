/**
 * Speech Synthesis Service Interface
 *
 * Provides text-to-speech capabilities with various voices and formats.
 */

import type { SpeechSynthesisResponse } from '../types';

export type VoiceId = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

export interface SpeechSynthesisOptions {
  /**
   * Voice to use for synthesis
   */
  voice?: VoiceId;

  /**
   * Audio format
   */
  format?: AudioFormat;

  /**
   * Speed of speech (0.25 - 4.0)
   * 1.0 is normal speed
   */
  speed?: number;

  /**
   * Audio quality/bitrate
   */
  quality?: 'standard' | 'high';
}

export interface Voice {
  id: VoiceId;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  description?: string;
}

export interface SpeechSynthesisService {
  /**
   * Synthesize speech from text
   *
   * @param text - The text to convert to speech
   * @param options - Synthesis options
   * @returns Promise resolving to the audio URL and metadata
   */
  synthesizeSpeech(
    text: string,
    options?: SpeechSynthesisOptions
  ): Promise<SpeechSynthesisResponse>;

  /**
   * Get available voices for this provider
   *
   * @returns Promise resolving to array of available voices
   */
  getAvailableVoices(): Promise<Voice[]>;

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): AudioFormat[];

  /**
   * Get the model identifier
   */
  getModel(): string;

  /**
   * Get the provider name
   */
  getProvider(): string;

  /**
   * Estimate audio duration for given text
   *
   * @param text - The text to estimate
   * @param speed - Speech speed multiplier
   * @returns Estimated duration in seconds
   */
  estimateDuration(text: string, speed?: number): number;
}
