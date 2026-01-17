/**
 * Property-Based Tests for Credit Calculation Safety
 *
 * Feature: critical-fixes
 * Property 6: AI Provider Response Type Safety
 * **Validates: Requirements 4.3**
 *
 * These tests validate that credit calculations handle undefined values safely
 * with proper type guards, ensuring the system never produces invalid credit values.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  CreditCalculator,
  CreditConfig,
  PartialCreditConfig,
  DEFAULT_CREDIT_CONFIG,
} from '../credit-calculator';
import type { ImageSize } from '../types';

/**
 * Arbitraries for credit calculation testing
 */

// Generate valid token counts (0 to 1 million)
const tokenCountArbitrary = fc.integer({ min: 0, max: 1000000 });

// Generate valid model names including unknown models
const modelNameArbitrary = fc.oneof(
  fc.constantFrom(
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-3.5-turbo',
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
    'gemini-pro',
    'mistral-large',
    'default'
  ),
  // Include random unknown model names to test fallback behavior
  fc.string({ minLength: 1, maxLength: 50 })
);

// Generate valid image sizes
const imageSizeArbitrary = fc.constantFrom<ImageSize>(
  '256x256',
  '512x512',
  '1024x1024',
  '1792x1024',
  '1024x1792'
);

// Generate valid image counts
const imageCountArbitrary = fc.integer({ min: 0, max: 100 });

// Generate valid text for speech synthesis
const speechTextArbitrary = fc.string({ minLength: 0, maxLength: 10000 });

// Generate valid audio duration in seconds
const audioDurationArbitrary = fc.float({ min: 0, max: 3600, noNaN: true });

// Generate partial credit config updates with potentially undefined values
const partialCreditConfigArbitrary = fc.record({
  textCreditsPerKToken: fc.option(
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 30 }),
      fc.integer({ min: 1, max: 100 })
    ),
    { nil: undefined }
  ),
  imageCredits: fc.option(
    fc.record({
      '256x256': fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
      '512x512': fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
      '1024x1024': fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
      '1792x1024': fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
      '1024x1792': fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
    }),
    { nil: undefined }
  ),
  speechCreditsPerKChar: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  transcriptionCreditsPerMinute: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
});

/**
 * Property 6: AI Provider Response Type Safety - Credit Calculation Safety
 * Feature: critical-fixes, Property 6: AI Provider Response Type Safety
 * **Validates: Requirements 4.3**
 *
 * WHEN calculating credits THEN the system SHALL handle undefined values safely
 * with proper type guards.
 */
describe('Property 6: Credit Calculation Safety (Requirement 4.3)', () => {
  let calculator: CreditCalculator;

  beforeEach(() => {
    calculator = new CreditCalculator();
  });

  describe('Text Credit Calculation with Undefined Handling', () => {
    it('should always return a valid number for any model name (including unknown)', async () => {
      await fc.assert(
        fc.asyncProperty(
          tokenCountArbitrary,
          modelNameArbitrary,
          async (tokens, model) => {
            const credits = calculator.calculateTextCredits(tokens, model);

            // Credits should always be a valid non-negative integer
            expect(Number.isFinite(credits)).toBe(true);
            expect(Number.isInteger(credits)).toBe(true);
            expect(credits).toBeGreaterThanOrEqual(0);

            // Should never be NaN or Infinity
            expect(Number.isNaN(credits)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default rate when model rate is undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          tokenCountArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            (s) => !Object.keys(DEFAULT_CREDIT_CONFIG.textCreditsPerKToken).includes(s)
          ),
          async (tokens, unknownModel) => {
            const credits = calculator.calculateTextCredits(tokens, unknownModel);
            const defaultRate = calculator.getModelRate('default');
            const expectedCredits = tokens > 0 ? Math.ceil((tokens / 1000) * defaultRate) : 0;

            expect(credits).toBe(expectedCredits);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle detailed text credits with any combination of input/output tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 500000 }),
          fc.integer({ min: 0, max: 500000 }),
          modelNameArbitrary,
          async (inputTokens, outputTokens, model) => {
            const credits = calculator.calculateTextCreditsDetailed(
              inputTokens,
              outputTokens,
              model
            );

            // Credits should always be a valid non-negative integer
            expect(Number.isFinite(credits)).toBe(true);
            expect(Number.isInteger(credits)).toBe(true);
            expect(credits).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Image Credit Calculation with Undefined Handling', () => {
    it('should always return a valid number for any valid image size', async () => {
      await fc.assert(
        fc.asyncProperty(
          imageSizeArbitrary,
          imageCountArbitrary,
          async (size, count) => {
            const credits = calculator.calculateImageCredits(size, count);

            // Credits should always be a valid non-negative integer
            expect(Number.isFinite(credits)).toBe(true);
            expect(Number.isInteger(credits)).toBe(true);
            expect(credits).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for invalid image sizes (type guard)', async () => {
      const invalidSizes = ['100x100', '2000x2000', 'invalid', '', '0x0'];

      for (const invalidSize of invalidSizes) {
        expect(() => {
          calculator.calculateImageCredits(invalidSize as ImageSize);
        }).toThrow('Unknown image size');
      }
    });
  });

  describe('Speech Credit Calculation with Undefined Handling', () => {
    it('should always return a valid number for any string input', async () => {
      await fc.assert(
        fc.asyncProperty(speechTextArbitrary, async (text) => {
          const credits = calculator.calculateSpeechCredits(text);

          // Credits should always be a valid non-negative integer
          expect(Number.isFinite(credits)).toBe(true);
          expect(Number.isInteger(credits)).toBe(true);
          expect(credits).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should throw for non-string input (type guard)', () => {
      const invalidInputs = [123, null, undefined, {}, [], true];

      for (const invalidInput of invalidInputs) {
        expect(() => {
          calculator.calculateSpeechCredits(invalidInput as any);
        }).toThrow('Text must be a string');
      }
    });
  });

  describe('Transcription Credit Calculation with Undefined Handling', () => {
    it('should always return a valid number for any valid duration', async () => {
      await fc.assert(
        fc.asyncProperty(audioDurationArbitrary, async (duration) => {
          const credits = calculator.calculateTranscriptionCredits(duration);

          // Credits should always be a valid non-negative integer
          expect(Number.isFinite(credits)).toBe(true);
          expect(Number.isInteger(credits)).toBe(true);
          expect(credits).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should throw for negative duration (type guard)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -1000000, max: -1 }),
          async (negativeDuration) => {
            expect(() => {
              calculator.calculateTranscriptionCredits(negativeDuration);
            }).toThrow('Duration cannot be negative');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw for non-finite duration (type guard)', () => {
      expect(() => {
        calculator.calculateTranscriptionCredits(Infinity);
      }).toThrow('Duration must be a finite number');

      expect(() => {
        calculator.calculateTranscriptionCredits(-Infinity);
      }).toThrow();

      expect(() => {
        calculator.calculateTranscriptionCredits(NaN);
      }).toThrow('Duration must be a finite number');
    });
  });

  describe('Configuration Update with Partial/Undefined Values', () => {
    it('should safely handle partial config updates without corrupting existing config', async () => {
      await fc.assert(
        fc.asyncProperty(partialCreditConfigArbitrary, async (partialConfig) => {
          // Create a fresh calculator
          const testCalculator = new CreditCalculator();

          // Store original rates for comparison
          const originalGpt4Rate = testCalculator.getModelRate('gpt-4');
          const originalImagePricing = testCalculator.getImagePricing();
          const originalSpeechRate = testCalculator.getSpeechRate();
          const originalTranscriptionRate = testCalculator.getTranscriptionRate();

          // Apply partial update - filter out undefined values from imageCredits
          const cleanPartialConfig: PartialCreditConfig = {
            ...partialConfig,
          };

          // Clean up imageCredits to remove undefined values
          if (partialConfig.imageCredits) {
            const cleanImageCredits: Partial<Record<ImageSize, number>> = {};
            for (const [key, value] of Object.entries(partialConfig.imageCredits)) {
              if (value !== undefined) {
                cleanImageCredits[key as ImageSize] = value;
              }
            }
            cleanPartialConfig.imageCredits = Object.keys(cleanImageCredits).length > 0
              ? cleanImageCredits
              : undefined;
          }

          testCalculator.updateConfig(cleanPartialConfig);

          // Verify existing rates are preserved if not updated
          if (!partialConfig.textCreditsPerKToken || !('gpt-4' in partialConfig.textCreditsPerKToken)) {
            expect(testCalculator.getModelRate('gpt-4')).toBe(originalGpt4Rate);
          }

          // Verify image pricing is preserved for sizes not updated
          const newImagePricing = testCalculator.getImagePricing();
          for (const size of Object.keys(originalImagePricing) as ImageSize[]) {
            const wasUpdated = partialConfig.imageCredits?.[size] !== undefined;
            if (!wasUpdated) {
              expect(newImagePricing[size]).toBe(originalImagePricing[size]);
            }
          }

          // Verify speech rate is preserved if not updated
          if (partialConfig.speechCreditsPerKChar === undefined) {
            expect(testCalculator.getSpeechRate()).toBe(originalSpeechRate);
          }

          // Verify transcription rate is preserved if not updated
          if (partialConfig.transcriptionCreditsPerMinute === undefined) {
            expect(testCalculator.getTranscriptionRate()).toBe(originalTranscriptionRate);
          }

          // Verify calculator still works after update
          const credits = testCalculator.calculateTextCredits(1000, 'gpt-4');
          expect(Number.isFinite(credits)).toBe(true);
          expect(credits).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain type safety after multiple config updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(partialCreditConfigArbitrary, { minLength: 1, maxLength: 10 }),
          async (configUpdates) => {
            const testCalculator = new CreditCalculator();

            // Apply multiple updates
            for (const update of configUpdates) {
              // Clean up imageCredits to remove undefined values
              const cleanUpdate: PartialCreditConfig = { ...update };
              if (update.imageCredits) {
                const cleanImageCredits: Partial<Record<ImageSize, number>> = {};
                for (const [key, value] of Object.entries(update.imageCredits)) {
                  if (value !== undefined) {
                    cleanImageCredits[key as ImageSize] = value;
                  }
                }
                cleanUpdate.imageCredits = Object.keys(cleanImageCredits).length > 0
                  ? cleanImageCredits
                  : undefined;
              }
              testCalculator.updateConfig(cleanUpdate);
            }

            // Verify all calculation methods still work correctly
            const textCredits = testCalculator.calculateTextCredits(1000, 'gpt-4');
            expect(Number.isFinite(textCredits)).toBe(true);
            expect(textCredits).toBeGreaterThanOrEqual(0);

            const imageCredits = testCalculator.calculateImageCredits('1024x1024', 1);
            expect(Number.isFinite(imageCredits)).toBe(true);
            expect(imageCredits).toBeGreaterThanOrEqual(0);

            const speechCredits = testCalculator.calculateSpeechCredits('test');
            expect(Number.isFinite(speechCredits)).toBe(true);
            expect(speechCredits).toBeGreaterThanOrEqual(0);

            const transcriptionCredits = testCalculator.calculateTranscriptionCredits(60);
            expect(Number.isFinite(transcriptionCredits)).toBe(true);
            expect(transcriptionCredits).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Token Estimation with Undefined Handling', () => {
    it('should always return a valid token estimate for any string', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 0, maxLength: 10000 }), async (text) => {
          const tokens = calculator.estimateTokens(text);

          // Tokens should always be a valid non-negative integer
          expect(Number.isFinite(tokens)).toBe(true);
          expect(Number.isInteger(tokens)).toBe(true);
          expect(tokens).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should estimate text credits safely for any text and model', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 5000 }),
          modelNameArbitrary,
          async (text, model) => {
            const credits = calculator.estimateTextCredits(text, model);

            // Credits should always be a valid non-negative integer
            expect(Number.isFinite(credits)).toBe(true);
            expect(Number.isInteger(credits)).toBe(true);
            expect(credits).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Rate Getter Methods with Undefined Handling', () => {
    it('should always return a valid rate for any model', async () => {
      await fc.assert(
        fc.asyncProperty(modelNameArbitrary, async (model) => {
          const rate = calculator.getModelRate(model);

          // Rate should always be a valid positive number
          expect(Number.isFinite(rate)).toBe(true);
          expect(rate).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should return complete image pricing with all sizes defined', () => {
      const pricing = calculator.getImagePricing();
      const expectedSizes: ImageSize[] = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];

      for (const size of expectedSizes) {
        expect(pricing[size]).toBeDefined();
        expect(Number.isFinite(pricing[size])).toBe(true);
        expect(pricing[size]).toBeGreaterThan(0);
      }
    });

    it('should return valid speech and transcription rates', () => {
      const speechRate = calculator.getSpeechRate();
      const transcriptionRate = calculator.getTranscriptionRate();

      expect(Number.isFinite(speechRate)).toBe(true);
      expect(speechRate).toBeGreaterThan(0);

      expect(Number.isFinite(transcriptionRate)).toBe(true);
      expect(transcriptionRate).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero values correctly', () => {
      expect(calculator.calculateTextCredits(0, 'gpt-4')).toBe(0);
      expect(calculator.calculateImageCredits('1024x1024', 0)).toBe(0);
      expect(calculator.calculateSpeechCredits('')).toBe(0);
      expect(calculator.calculateTranscriptionCredits(0)).toBe(0);
    });

    it('should handle very large values without overflow', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 900000, max: 1000000 }),
          async (largeTokenCount) => {
            const credits = calculator.calculateTextCredits(largeTokenCount, 'gpt-4');

            // Should not overflow or produce invalid values
            expect(Number.isFinite(credits)).toBe(true);
            expect(credits).toBeGreaterThan(0);
            expect(credits).toBeLessThan(Number.MAX_SAFE_INTEGER);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle very small positive values correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          modelNameArbitrary,
          async (smallTokenCount, model) => {
            const credits = calculator.calculateTextCredits(smallTokenCount, model);

            // Should always charge at least 1 credit for any positive token count
            expect(credits).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
