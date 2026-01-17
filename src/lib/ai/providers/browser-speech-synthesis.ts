/**
 * Browser-based Speech Synthesis Service
 * 
 * Free text-to-speech using the Web Speech API (no API key required)
 * Works in all modern browsers
 */

import type { SpeechSynthesisService, SpeechSynthesisOptions } from '../interfaces';
import type { SpeechSynthesisResponse } from '../types';

// Voice mapping for browser voices
export interface BrowserVoice {
  id: string;
  name: string;
  lang: string;
  description: string;
}

// Available browser voices (will be populated from browser)
export const BROWSER_VOICES: BrowserVoice[] = [
  { id: 'default', name: 'Default', lang: 'en-US', description: 'System default voice' },
  { id: 'en-US-female', name: 'English (US) Female', lang: 'en-US', description: 'American English female voice' },
  { id: 'en-US-male', name: 'English (US) Male', lang: 'en-US', description: 'American English male voice' },
  { id: 'en-GB-female', name: 'English (UK) Female', lang: 'en-GB', description: 'British English female voice' },
  { id: 'en-GB-male', name: 'English (UK) Male', lang: 'en-GB', description: 'British English male voice' },
  { id: 'es-ES', name: 'Spanish', lang: 'es-ES', description: 'Spanish voice' },
  { id: 'fr-FR', name: 'French', lang: 'fr-FR', description: 'French voice' },
  { id: 'de-DE', name: 'German', lang: 'de-DE', description: 'German voice' },
  { id: 'it-IT', name: 'Italian', lang: 'it-IT', description: 'Italian voice' },
  { id: 'ja-JP', name: 'Japanese', lang: 'ja-JP', description: 'Japanese voice' },
  { id: 'ko-KR', name: 'Korean', lang: 'ko-KR', description: 'Korean voice' },
  { id: 'zh-CN', name: 'Chinese (Simplified)', lang: 'zh-CN', description: 'Mandarin Chinese voice' },
];

export class BrowserSpeechSynthesisService implements SpeechSynthesisService {
  private model: string;

  constructor(model: string = 'browser-tts') {
    this.model = model;
  }

  /**
   * Generate speech from text using Web Speech API
   * Returns a blob URL that can be played in the browser
   */
  async synthesize(
    text: string,
    options?: SpeechSynthesisOptions
  ): Promise<SpeechSynthesisResponse> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      throw new Error('Speech synthesis is only available in browser environments');
    }

    const voice = options?.voice || 'default';
    const speed = options?.speed || 1.0;

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.1, Math.min(10, speed));
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const targetVoice = this.findVoice(voices, voice);
      if (targetVoice) {
        utterance.voice = targetVoice;
      }
    }

    // Generate unique ID
    const id = `browser-tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // For browser TTS, we return a special URL that indicates browser playback
    // The actual playback will be handled by the component
    const url = `browser-tts://${id}?text=${encodeURIComponent(text)}&voice=${voice}&speed=${speed}`;

    // Calculate approximate duration (rough estimate: 150 words per minute at 1x speed)
    const wordCount = text.split(/\s+/).length;
    const duration = (wordCount / 150) * 60 / speed;

    return {
      url,
      format: 'browser',
      duration,
      metadata: {
        model: this.model,
        provider: 'browser',
        credits: 0, // Free!
      },
    };
  }

  /**
   * Actually speak the text (for browser playback)
   */
  speak(text: string, options?: { voice?: string; speed?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.speed || 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && options?.voice) {
        const targetVoice = this.findVoice(voices, options.voice);
        if (targetVoice) {
          utterance.voice = targetVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech
   */
  stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  /**
   * Get available voices from the browser
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'browser';
  }

  getSupportedVoices(): string[] {
    return BROWSER_VOICES.map(v => v.id);
  }

  getSupportedFormats(): string[] {
    return ['browser']; // Browser playback only
  }

  private findVoice(voices: SpeechSynthesisVoice[], voiceId: string): SpeechSynthesisVoice | null {
    // Try exact match first
    let voice = voices.find(v => v.name.toLowerCase().includes(voiceId.toLowerCase()));
    
    if (!voice) {
      // Try language match
      const targetLang = BROWSER_VOICES.find(v => v.id === voiceId)?.lang;
      if (targetLang) {
        voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
      }
    }

    if (!voice && voices.length > 0) {
      // Default to first English voice or first available
      voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    return voice || null;
  }

  private calculateCredits(): number {
    // Free service
    return 0;
  }
}
