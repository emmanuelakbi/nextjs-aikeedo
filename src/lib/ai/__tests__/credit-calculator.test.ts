/**
 * Credit Calculator Tests
 *
 * Tests for credit calculation system including token-to-credit conversion,
 * image credits, speech credits, and transcription credits.
 * Requirements: 2.4, 7.1, 7.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CreditCalculator,
  DEFAULT_CREDIT_CONFIG,
  // creditCalculator,
  calculateTextCredits,
  calculateImageCredits,
  calculateSpeechCredits,
  calculateTranscriptionCredits,
} from '../credit-calculator';
import type { ImageSize } from '../types';

describe('CreditCalculator', () => {
  let calculator: CreditCalculator;

  beforeEach(() => {
    calculator = new CreditCalculator();
  });

  describe('Text Credit Calculation', () => {
    it('should calculate credits for GPT-4 tokens', () => {
      const tokens = 1000;
      const credits = calculator.calculateTextCredits(tokens, 'gpt-4');

      // 1000 tokens at 30 credits per 1000 = 30 credits
      expect(credits).toBe(30);
    });

    it('should calculate credits for GPT-3.5-turbo tokens', () => {
      const tokens = 1000;
      const credits = calculator.calculateTextCredits(tokens, 'gpt-3.5-turbo');

      // 1000 tokens at 2 credits per 1000 = 2 credits
      expect(credits).toBe(2);
    });

    it('should round up fractional credits', () => {
      const tokens = 100; // 0.1k tokens
      const credits = calculator.calculateTextCredits(tokens, 'gpt-4');

      // 100 tokens at 30 credits per 1000 = 3 credits (rounded up)
      expect(credits).toBe(3);
    });

    it('should return 0 credits for 0 tokens', () => {
      const credits = calculator.calculateTextCredits(0, 'gpt-4');
      expect(credits).toBe(0);
    });

    it('should use default rate for unknown models', () => {
      const tokens = 1000;
      const credits = calculator.calculateTextCredits(tokens, 'unknown-model');

      // Should use default rate of 10 credits per 1000 tokens
      expect(credits).toBe(10);
    });

    it('should handle large token counts', () => {
      const tokens = 100000;
      const credits = calculator.calculateTextCredits(tokens, 'gpt-4');

      // 100000 tokens at 30 credits per 1000 = 3000 credits
      expect(credits).toBe(3000);
    });

    it('should throw error for negative tokens', () => {
      expect(() => {
        calculator.calculateTextCredits(-100, 'gpt-4');
      }).toThrow('Token count cannot be negative');
    });

    it('should throw error for non-finite tokens', () => {
      expect(() => {
        calculator.calculateTextCredits(Infinity, 'gpt-4');
      }).toThrow('Token count must be a finite number');
    });

    it('should calculate credits for Claude models', () => {
      expect(calculator.calculateTextCredits(1000, 'claude-3-opus')).toBe(30);
      expect(calculator.calculateTextCredits(1000, 'claude-3-sonnet')).toBe(15);
      expect(calculator.calculateTextCredits(1000, 'claude-3-haiku')).toBe(5);
    });

    it('should calculate credits for Google models', () => {
      expect(calculator.calculateTextCredits(1000, 'gemini-pro')).toBe(10);
      expect(calculator.calculateTextCredits(1000, 'gemini-1.5-pro')).toBe(15);
      expect(calculator.calculateTextCredits(1000, 'gemini-1.5-flash')).toBe(5);
    });

    it('should calculate credits for Mistral models', () => {
      expect(calculator.calculateTextCredits(1000, 'mistral-large')).toBe(20);
      expect(calculator.calculateTextCredits(1000, 'mistral-medium')).toBe(10);
      expect(calculator.calculateTextCredits(1000, 'mistral-small')).toBe(5);
    });
  });

  describe('Detailed Text Credit Calculation', () => {
    it('should calculate credits with separate input/output tokens', () => {
      const inputTokens = 500;
      const outputTokens = 500;
      const credits = calculator.calculateTextCreditsDetailed(
        inputTokens,
        outputTokens,
        'gpt-4'
      );

      // Total 1000 tokens at 30 credits per 1000 = 30 credits
      expect(credits).toBe(30);
    });

    it('should handle zero input tokens', () => {
      const credits = calculator.calculateTextCreditsDetailed(0, 1000, 'gpt-4');
      expect(credits).toBe(30);
    });

    it('should handle zero output tokens', () => {
      const credits = calculator.calculateTextCreditsDetailed(1000, 0, 'gpt-4');
      expect(credits).toBe(30);
    });

    it('should throw error for negative input tokens', () => {
      expect(() => {
        calculator.calculateTextCreditsDetailed(-100, 500, 'gpt-4');
      }).toThrow('Token counts cannot be negative');
    });

    it('should throw error for negative output tokens', () => {
      expect(() => {
        calculator.calculateTextCreditsDetailed(500, -100, 'gpt-4');
      }).toThrow('Token counts cannot be negative');
    });

    it('should throw error for non-finite tokens', () => {
      expect(() => {
        calculator.calculateTextCreditsDetailed(Infinity, 500, 'gpt-4');
      }).toThrow('Token counts must be finite numbers');
    });
  });

  describe('Image Credit Calculation', () => {
    it('should calculate credits for 256x256 image', () => {
      const credits = calculator.calculateImageCredits('256x256');
      expect(credits).toBe(10);
    });

    it('should calculate credits for 512x512 image', () => {
      const credits = calculator.calculateImageCredits('512x512');
      expect(credits).toBe(20);
    });

    it('should calculate credits for 1024x1024 image', () => {
      const credits = calculator.calculateImageCredits('1024x1024');
      expect(credits).toBe(40);
    });

    it('should calculate credits for 1792x1024 image', () => {
      const credits = calculator.calculateImageCredits('1792x1024');
      expect(credits).toBe(60);
    });

    it('should calculate credits for 1024x1792 image', () => {
      const credits = calculator.calculateImageCredits('1024x1792');
      expect(credits).toBe(60);
    });

    it('should calculate credits for multiple images', () => {
      const credits = calculator.calculateImageCredits('1024x1024', 3);
      expect(credits).toBe(120); // 40 * 3
    });

    it('should return 0 credits for 0 images', () => {
      const credits = calculator.calculateImageCredits('1024x1024', 0);
      expect(credits).toBe(0);
    });

    it('should throw error for negative image count', () => {
      expect(() => {
        calculator.calculateImageCredits('1024x1024', -1);
      }).toThrow('Image count cannot be negative');
    });

    it('should throw error for non-integer image count', () => {
      expect(() => {
        calculator.calculateImageCredits('1024x1024', 2.5);
      }).toThrow('Image count must be an integer');
    });

    it('should throw error for unknown image size', () => {
      expect(() => {
        calculator.calculateImageCredits('999x999' as ImageSize);
      }).toThrow('Unknown image size');
    });
  });

  describe('Speech Credit Calculation', () => {
    it('should calculate credits for short text', () => {
      const text = 'Hello, world!'; // 13 characters
      const credits = calculator.calculateSpeechCredits(text);

      // 13 chars at 5 credits per 1000 = 1 credit (rounded up)
      expect(credits).toBe(1);
    });

    it('should calculate credits for 1000 characters', () => {
      const text = 'a'.repeat(1000);
      const credits = calculator.calculateSpeechCredits(text);

      // 1000 chars at 5 credits per 1000 = 5 credits
      expect(credits).toBe(5);
    });

    it('should calculate credits for long text', () => {
      const text = 'a'.repeat(5000);
      const credits = calculator.calculateSpeechCredits(text);

      // 5000 chars at 5 credits per 1000 = 25 credits
      expect(credits).toBe(25);
    });

    it('should return 0 credits for empty text', () => {
      const credits = calculator.calculateSpeechCredits('');
      expect(credits).toBe(0);
    });

    it('should round up fractional credits', () => {
      const text = 'a'.repeat(100); // 100 characters
      const credits = calculator.calculateSpeechCredits(text);

      // 100 chars at 5 credits per 1000 = 0.5, rounded up to 1
      expect(credits).toBe(1);
    });

    it('should handle text with special characters', () => {
      const text = 'Hello! 你好 🌍';
      const credits = calculator.calculateSpeechCredits(text);

      // Should count all characters including unicode
      expect(credits).toBeGreaterThan(0);
    });

    it('should throw error for non-string input', () => {
      expect(() => {
        calculator.calculateSpeechCredits(123 as any);
      }).toThrow('Text must be a string');
    });
  });

  describe('Transcription Credit Calculation', () => {
    it('should calculate credits for 1 minute audio', () => {
      const durationSeconds = 60;
      const credits = calculator.calculateTranscriptionCredits(durationSeconds);

      // 1 minute at 3 credits per minute = 3 credits
      expect(credits).toBe(3);
    });

    it('should calculate credits for 30 seconds audio', () => {
      const durationSeconds = 30;
      const credits = calculator.calculateTranscriptionCredits(durationSeconds);

      // 0.5 minutes at 3 credits per minute = 1.5, rounded up to 2
      expect(credits).toBe(2);
    });

    it('should calculate credits for 5 minutes audio', () => {
      const durationSeconds = 300;
      const credits = calculator.calculateTranscriptionCredits(durationSeconds);

      // 5 minutes at 3 credits per minute = 15 credits
      expect(credits).toBe(15);
    });

    it('should return 0 credits for 0 duration', () => {
      const credits = calculator.calculateTranscriptionCredits(0);
      expect(credits).toBe(0);
    });

    it('should round up fractional credits', () => {
      const durationSeconds = 10; // 1/6 minute
      const credits = calculator.calculateTranscriptionCredits(durationSeconds);

      // 0.167 minutes at 3 credits per minute = 0.5, rounded up to 1
      expect(credits).toBe(1);
    });

    it('should handle long audio files', () => {
      const durationSeconds = 3600; // 1 hour
      const credits = calculator.calculateTranscriptionCredits(durationSeconds);

      // 60 minutes at 3 credits per minute = 180 credits
      expect(credits).toBe(180);
    });

    it('should throw error for negative duration', () => {
      expect(() => {
        calculator.calculateTranscriptionCredits(-60);
      }).toThrow('Duration cannot be negative');
    });

    it('should throw error for non-finite duration', () => {
      expect(() => {
        calculator.calculateTranscriptionCredits(Infinity);
      }).toThrow('Duration must be a finite number');
    });
  });

  describe('Token Estimation', () => {
    it('should estimate tokens from text', () => {
      const text = 'Hello, world!'; // 13 characters
      const tokens = calculator.estimateTokens(text);

      // ~4 characters per token = ~3.25 tokens, rounded up to 4
      expect(tokens).toBe(4);
    });

    it('should estimate tokens for longer text', () => {
      const text = 'a'.repeat(1000);
      const tokens = calculator.estimateTokens(text);

      // 1000 characters / 4 = 250 tokens
      expect(tokens).toBe(250);
    });

    it('should return 0 for empty text', () => {
      const tokens = calculator.estimateTokens('');
      expect(tokens).toBe(0);
    });

    it('should throw error for non-string input', () => {
      expect(() => {
        calculator.estimateTokens(123 as any);
      }).toThrow('Text must be a string');
    });
  });

  describe('Estimate Text Credits', () => {
    it('should estimate credits from text', () => {
      const text = 'a'.repeat(4000); // ~1000 tokens
      const credits = calculator.estimateTextCredits(text, 'gpt-4');

      // ~1000 tokens at 30 credits per 1000 = ~30 credits
      expect(credits).toBeGreaterThanOrEqual(28);
      expect(credits).toBeLessThanOrEqual(32);
    });

    it('should estimate credits for short text', () => {
      const text = 'Hello!';
      const credits = calculator.estimateTextCredits(text, 'gpt-4');

      expect(credits).toBeGreaterThan(0);
    });
  });

  describe('Configuration Getters', () => {
    it('should get model rate', () => {
      const rate = calculator.getModelRate('gpt-4');
      expect(rate).toBe(30);
    });

    it('should get default rate for unknown model', () => {
      const rate = calculator.getModelRate('unknown-model');
      expect(rate).toBe(10);
    });

    it('should get image pricing', () => {
      const pricing = calculator.getImagePricing();

      expect(pricing['256x256']).toBe(10);
      expect(pricing['512x512']).toBe(20);
      expect(pricing['1024x1024']).toBe(40);
    });

    it('should get speech rate', () => {
      const rate = calculator.getSpeechRate();
      expect(rate).toBe(5);
    });

    it('should get transcription rate', () => {
      const rate = calculator.getTranscriptionRate();
      expect(rate).toBe(3);
    });
  });

  describe('Configuration Updates', () => {
    it('should update text credit rates', () => {
      calculator.updateConfig({
        textCreditsPerKToken: {
          'custom-model': 50,
        },
      });

      const credits = calculator.calculateTextCredits(1000, 'custom-model');
      expect(credits).toBe(50);
    });

    it('should update image credit rates', () => {
      calculator.updateConfig({
        imageCredits: {
          '1024x1024': 100,
        },
      });

      const credits = calculator.calculateImageCredits('1024x1024');
      expect(credits).toBe(100);
    });

    it('should update speech rate', () => {
      calculator.updateConfig({
        speechCreditsPerKChar: 10,
      });

      const text = 'a'.repeat(1000);
      const credits = calculator.calculateSpeechCredits(text);
      expect(credits).toBe(10);
    });

    it('should update transcription rate', () => {
      calculator.updateConfig({
        transcriptionCreditsPerMinute: 5,
      });

      const credits = calculator.calculateTranscriptionCredits(60);
      expect(credits).toBe(5);
    });

    it('should preserve existing config when updating', () => {
      calculator.updateConfig({
        textCreditsPerKToken: {
          'new-model': 25,
        },
      });

      // Old models should still work
      expect(calculator.calculateTextCredits(1000, 'gpt-4')).toBe(30);
      // New model should work
      expect(calculator.calculateTextCredits(1000, 'new-model')).toBe(25);
    });
  });

  describe('Helper Functions', () => {
    it('should use default calculator for text credits', () => {
      const credits = calculateTextCredits(1000, 'gpt-4');
      expect(credits).toBe(30);
    });

    it('should use default calculator for image credits', () => {
      const credits = calculateImageCredits('1024x1024');
      expect(credits).toBe(40);
    });

    it('should use default calculator for speech credits', () => {
      const credits = calculateSpeechCredits('a'.repeat(1000));
      expect(credits).toBe(5);
    });

    it('should use default calculator for transcription credits', () => {
      const credits = calculateTranscriptionCredits(60);
      expect(credits).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small token counts', () => {
      const credits = calculator.calculateTextCredits(1, 'gpt-4');
      expect(credits).toBe(1); // Should round up to at least 1
    });

    it('should handle very large token counts', () => {
      const credits = calculator.calculateTextCredits(1000000, 'gpt-4');
      expect(credits).toBe(30000);
    });

    it('should handle single character text for speech', () => {
      const credits = calculator.calculateSpeechCredits('a');
      expect(credits).toBe(1);
    });

    it('should handle 1 second audio for transcription', () => {
      const credits = calculator.calculateTranscriptionCredits(1);
      expect(credits).toBe(1);
    });

    it('should handle fractional seconds for transcription', () => {
      const credits = calculator.calculateTranscriptionCredits(0.5);
      expect(credits).toBe(1);
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom configuration in constructor', () => {
      const customCalculator = new CreditCalculator({
        textCreditsPerKToken: {
          'custom-model': 100,
          default: 20,
        },
        imageCredits: {
          '256x256': 5,
          '512x512': 10,
          '1024x1024': 20,
          '1792x1024': 30,
          '1024x1792': 30,
        },
        speechCreditsPerKChar: 10,
        transcriptionCreditsPerMinute: 5,
      });

      expect(customCalculator.calculateTextCredits(1000, 'custom-model')).toBe(
        100
      );
      expect(customCalculator.calculateImageCredits('256x256')).toBe(5);
      expect(customCalculator.calculateSpeechCredits('a'.repeat(1000))).toBe(
        10
      );
      expect(customCalculator.calculateTranscriptionCredits(60)).toBe(5);
    });
  });

  describe('Default Configuration', () => {
    it('should have correct default text rates', () => {
      expect(DEFAULT_CREDIT_CONFIG.textCreditsPerKToken['gpt-4']).toBe(30);
      expect(DEFAULT_CREDIT_CONFIG.textCreditsPerKToken['gpt-3.5-turbo']).toBe(
        2
      );
      expect(DEFAULT_CREDIT_CONFIG.textCreditsPerKToken['claude-3-opus']).toBe(
        30
      );
      expect(DEFAULT_CREDIT_CONFIG.textCreditsPerKToken['default']).toBe(10);
    });

    it('should have correct default image rates', () => {
      expect(DEFAULT_CREDIT_CONFIG.imageCredits['256x256']).toBe(10);
      expect(DEFAULT_CREDIT_CONFIG.imageCredits['1024x1024']).toBe(40);
    });

    it('should have correct default speech rate', () => {
      expect(DEFAULT_CREDIT_CONFIG.speechCreditsPerKChar).toBe(5);
    });

    it('should have correct default transcription rate', () => {
      expect(DEFAULT_CREDIT_CONFIG.transcriptionCreditsPerMinute).toBe(3);
    });
  });
});
