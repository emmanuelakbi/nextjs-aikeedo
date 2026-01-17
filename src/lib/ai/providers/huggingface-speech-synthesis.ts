/**
 * Hugging Face Speech Synthesis Service
 * 
 * Free AI text-to-speech using Hugging Face Inference API
 * Uses high-quality models like SpeechT5 and Facebook MMS-TTS
 */

import type { SpeechSynthesisService, SpeechSynthesisOptions } from '../interfaces';
import type { SpeechSynthesisResponse } from '../types';

// Available Hugging Face TTS models
export const HF_TTS_MODELS = {
  'speecht5': {
    id: 'microsoft/speecht5_tts',
    name: 'SpeechT5 (Microsoft)',
    description: 'High-quality English TTS',
    languages: ['en'],
  },
  'mms-tts-eng': {
    id: 'facebook/mms-tts-eng',
    name: 'MMS-TTS English',
    description: 'Facebook multilingual TTS - English',
    languages: ['en'],
  },
  'bark-small': {
    id: 'suno/bark-small',
    name: 'Bark Small (Suno)',
    description: 'Expressive AI voice generation',
    languages: ['en', 'multi'],
  },
} as const;

export type HFTTSModel = keyof typeof HF_TTS_MODELS;

export class HuggingFaceSpeechSynthesisService implements SpeechSynthesisService {
  private model: string;
  private modelId: string;
  private maxRetries: number;
  private baseUrl = 'https://router.huggingface.co/hf-inference/models';

  constructor(model: HFTTSModel = 'speecht5', maxRetries: number = 3) {
    this.model = model;
    this.modelId = HF_TTS_MODELS[model]?.id || HF_TTS_MODELS['speecht5'].id;
    this.maxRetries = maxRetries;
  }

  async synthesize(
    text: string,
    options?: SpeechSynthesisOptions
  ): Promise<SpeechSynthesisResponse> {
    const apiUrl = `${this.baseUrl}/${this.modelId}`;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Note: HF Inference API works without auth for public models (rate limited)
            // For higher limits, users can add their own HF token
          },
          body: JSON.stringify({
            inputs: text,
          }),
        });

        if (response.status === 503) {
          // Model is loading, wait and retry
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 20000;
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 30000)));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
        }

        // Response is audio blob
        const audioBlob = await response.blob();
        
        // Create a blob URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);

        // Estimate duration (rough: ~150 words per minute)
        const wordCount = text.split(/\s+/).length;
        const duration = (wordCount / 150) * 60;

        return {
          url: audioUrl,
          format: 'wav',
          duration,
          metadata: {
            model: this.model,
            provider: 'huggingface',
            credits: 0, // Free!
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Wait before retry
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Failed to generate speech');
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'huggingface';
  }

  getSupportedVoices(): string[] {
    // HuggingFace models typically have single voice
    return ['default'];
  }

  getSupportedFormats(): string[] {
    return ['wav', 'flac'];
  }
}
