/**
 * OpenAI Provider Services Tests
 *
 * Tests for OpenAI text generation, image generation, speech synthesis,
 * and transcription services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the environment BEFORE importing the services
vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(() => ({
    OPENAI_API_KEY: 'test-api-key',
    NODE_ENV: 'test',
  })),
}));

import {
  OpenAITextGenerationService,
  OpenAIImageGenerationService,
  OpenAISpeechSynthesisService,
  OpenAITranscriptionService,
} from '../providers';

describe('OpenAI Provider Services - Instantiation', () => {
  it('should create OpenAI text generation service', () => {
    const service = new OpenAITextGenerationService('gpt-4o-mini');

    expect(service).toBeDefined();
    expect(service.getModel()).toBe('gpt-4o-mini');
    expect(service.getProvider()).toBe('openai');
  });

  it('should create OpenAI image generation service', () => {
    const service = new OpenAIImageGenerationService('dall-e-3');

    expect(service).toBeDefined();
    expect(service.getModel()).toBe('dall-e-3');
    expect(service.getProvider()).toBe('openai');
  });

  it('should create OpenAI speech synthesis service', () => {
    const service = new OpenAISpeechSynthesisService('tts-1');

    expect(service).toBeDefined();
    expect(service.getModel()).toBe('tts-1');
    expect(service.getProvider()).toBe('openai');
  });

  it('should create OpenAI transcription service', () => {
    const service = new OpenAITranscriptionService('whisper-1');

    expect(service).toBeDefined();
    expect(service.getModel()).toBe('whisper-1');
    expect(service.getProvider()).toBe('openai');
  });
});

describe('OpenAI Text Generation Service', () => {
  let service: OpenAITextGenerationService;

  beforeEach(() => {
    service = new OpenAITextGenerationService('gpt-4o-mini');
  });

  it('should have correct model and provider', () => {
    expect(service.getModel()).toBe('gpt-4o-mini');
    expect(service.getProvider()).toBe('openai');
  });

  it('should use default model when not specified', () => {
    const defaultService = new OpenAITextGenerationService();
    expect(defaultService.getModel()).toBe('gpt-4o-mini');
  });
});

describe('OpenAI Image Generation Service', () => {
  let service: OpenAIImageGenerationService;

  beforeEach(() => {
    service = new OpenAIImageGenerationService('dall-e-3');
  });

  it('should have correct model and provider', () => {
    expect(service.getModel()).toBe('dall-e-3');
    expect(service.getProvider()).toBe('openai');
  });

  it('should return supported sizes for DALL-E 3', () => {
    const sizes = service.getSupportedSizes();
    expect(sizes).toContain('1024x1024');
    expect(sizes).toContain('1792x1024');
    expect(sizes).toContain('1024x1792');
  });

  it('should return supported sizes for DALL-E 2', () => {
    const dalle2Service = new OpenAIImageGenerationService('dall-e-2');
    const sizes = dalle2Service.getSupportedSizes();
    expect(sizes).toContain('256x256');
    expect(sizes).toContain('512x512');
    expect(sizes).toContain('1024x1024');
  });
});

describe('OpenAI Speech Synthesis Service', () => {
  let service: OpenAISpeechSynthesisService;

  beforeEach(() => {
    service = new OpenAISpeechSynthesisService('tts-1');
  });

  it('should have correct model and provider', () => {
    expect(service.getModel()).toBe('tts-1');
    expect(service.getProvider()).toBe('openai');
  });

  it('should return available voices', async () => {
    const voices = await service.getAvailableVoices();
    expect(voices).toBeDefined();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0]).toHaveProperty('id');
    expect(voices[0]).toHaveProperty('name');
    expect(voices[0]).toHaveProperty('language');
  });

  it('should return supported audio formats', () => {
    const formats = service.getSupportedFormats();
    expect(formats).toContain('mp3');
    expect(formats).toContain('opus');
    expect(formats).toContain('aac');
    expect(formats).toContain('flac');
    expect(formats).toContain('wav');
    expect(formats).toContain('pcm');
  });

  it('should estimate duration correctly', () => {
    const text = 'This is a test sentence with ten words total.';
    const duration = service.estimateDuration(text, 1.0);
    expect(duration).toBeGreaterThan(0);
    expect(typeof duration).toBe('number');
  });

  it('should adjust duration estimate for speed', () => {
    const text = 'This is a test sentence with ten words total.';
    const normalDuration = service.estimateDuration(text, 1.0);
    const fastDuration = service.estimateDuration(text, 2.0);

    // Faster speed should result in shorter duration
    expect(fastDuration).toBeLessThan(normalDuration);
  });
});

describe('OpenAI Transcription Service', () => {
  let service: OpenAITranscriptionService;

  beforeEach(() => {
    service = new OpenAITranscriptionService('whisper-1');
  });

  it('should have correct model and provider', () => {
    expect(service.getModel()).toBe('whisper-1');
    expect(service.getProvider()).toBe('openai');
  });

  it('should return supported audio formats', () => {
    const formats = service.getSupportedFormats();
    expect(formats).toContain('audio/mpeg');
    expect(formats).toContain('audio/wav');
    expect(formats).toContain('audio/webm');
  });

  it('should return supported languages', () => {
    const languages = service.getSupportedLanguages();
    expect(languages).toBeDefined();
    expect(languages.length).toBeGreaterThan(0);
    expect(languages).toContain('en');
    expect(languages).toContain('es');
    expect(languages).toContain('fr');
  });

  it('should return max file size', () => {
    const maxSize = service.getMaxFileSize();
    expect(maxSize).toBe(25 * 1024 * 1024); // 25 MB
  });
});

describe('Error Handling', () => {
  it('should throw error when OPENAI_API_KEY is not configured', async () => {
    // Temporarily override the mock to return no API key
    const { getEnv } = await import('@/lib/env');
    vi.mocked(getEnv).mockReturnValueOnce({
      NODE_ENV: 'test',
    } as any);

    expect(() => {
      new OpenAITextGenerationService();
    }).toThrow('OPENAI_API_KEY is not configured');
  });
});
