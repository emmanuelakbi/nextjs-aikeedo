/**
 * Google Provider Services Tests
 *
 * Tests for Google text generation and image generation services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the environment BEFORE importing the services
vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(() => ({
    GOOGLE_AI_API_KEY: 'test-api-key',
    NODE_ENV: 'test',
  })),
}));

import {
  GoogleTextGenerationService,
  GoogleImageGenerationService,
} from '../providers';

describe('Google Provider Services - Instantiation', () => {
  it('should create Google text generation service', () => {
    const service = new GoogleTextGenerationService('gemini-1.5-flash');

    expect(service).toBeDefined();
    expect(service.getModel()).toBe('gemini-1.5-flash');
    expect(service.getProvider()).toBe('google');
  });

  it('should create Google image generation service', () => {
    const service = new GoogleImageGenerationService('imagen-3.0-generate-001');

    expect(service).toBeDefined();
    expect(service.getModel()).toBe('imagen-3.0-generate-001');
    expect(service.getProvider()).toBe('google');
  });
});

describe('Google Text Generation Service', () => {
  let service: GoogleTextGenerationService;

  beforeEach(() => {
    service = new GoogleTextGenerationService('gemini-1.5-flash');
  });

  it('should have correct model and provider', () => {
    expect(service.getModel()).toBe('gemini-1.5-flash');
    expect(service.getProvider()).toBe('google');
  });

  it('should use default model when not specified', () => {
    const defaultService = new GoogleTextGenerationService();
    expect(defaultService.getModel()).toBe('gemini-1.5-flash');
  });
});

describe('Google Image Generation Service', () => {
  let service: GoogleImageGenerationService;

  beforeEach(() => {
    service = new GoogleImageGenerationService('imagen-3.0-generate-001');
  });

  it('should have correct model and provider', () => {
    expect(service.getModel()).toBe('imagen-3.0-generate-001');
    expect(service.getProvider()).toBe('google');
  });

  it('should return supported sizes', () => {
    const sizes = service.getSupportedSizes();
    expect(sizes).toContain('256x256');
    expect(sizes).toContain('512x512');
    expect(sizes).toContain('1024x1024');
  });
});

describe('Error Handling', () => {
  it('should throw error when GOOGLE_AI_API_KEY is not configured', async () => {
    // Temporarily override the mock to return no API key
    const { getEnv } = await import('@/lib/env');
    vi.mocked(getEnv).mockReturnValueOnce({
      NODE_ENV: 'test',
    } as any);

    expect(() => {
      new GoogleTextGenerationService();
    }).toThrow('GOOGLE_AI_API_KEY is not configured');
  });

  it('should throw error for image generation (not yet supported)', async () => {
    const service = new GoogleImageGenerationService();

    await expect(service.generateImage('test prompt')).rejects.toThrow(
      'Google image generation requires Google Cloud Vertex AI'
    );
  });
});
