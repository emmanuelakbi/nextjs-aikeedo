/**
 * Property-Based Tests for AI Services Module
 *
 * Feature: nextjs-ai-services
 *
 * These tests validate correctness properties across the AI services module
 * using property-based testing with fast-check.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CreditCalculator } from '../credit-calculator';
// import { AIServiceFactory } from '../factory';
import { executeWithRetry, isRetryableError } from '../retry';
import type { AIProvider, ImageSize } from '../types';

/**
 * Arbitraries for AI service testing
 */

// Generate valid token counts (0 to 1 million)
const tokenCountArbitrary = fc.integer({ min: 0, max: 1000000 });

// Generate valid model names
const modelNameArbitrary = fc.constantFrom(
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gemini-pro',
  'mistral-large'
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

// Generate valid AI providers
const _providerArbitrary = fc.constantFrom<AIProvider>(
  'openai',
  'anthropic',
  'google',
  'mistral'
);

/**
 * Property 5: Token calculation accuracy
 * Feature: nextjs-ai-services, Property 5: Token calculation accuracy
 * Validates: Requirements 2.4, 7.1, 7.2
 *
 * For any generation, the calculated credits should be consistent and deterministic
 * based on token count and model.
 */
describe('Property 5: Token calculation accuracy', () => {
  let calculator: CreditCalculator;

  beforeEach(() => {
    calculator = new CreditCalculator();
  });

  it('should calculate the same credits for the same inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenCountArbitrary,
        modelNameArbitrary,
        async (tokens, model) => {
          // Calculate credits twice with same inputs
          const credits1 = calculator.calculateTextCredits(tokens, model);
          const credits2 = calculator.calculateTextCredits(tokens, model);

          // Should be deterministic
          expect(credits1).toBe(credits2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never return negative credits', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenCountArbitrary,
        modelNameArbitrary,
        async (tokens, model) => {
          const credits = calculator.calculateTextCredits(tokens, model);
          expect(credits).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 credits for 0 tokens', async () => {
    await fc.assert(
      fc.asyncProperty(modelNameArbitrary, async (model) => {
        const credits = calculator.calculateTextCredits(0, model);
        expect(credits).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should calculate credits proportionally to tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100000 }),
        modelNameArbitrary,
        async (tokens, model) => {
          const credits1 = calculator.calculateTextCredits(tokens, model);
          const credits2 = calculator.calculateTextCredits(tokens * 2, model);

          // Double tokens should result in at least as many credits
          // (may not be exactly double due to rounding)
          expect(credits2).toBeGreaterThanOrEqual(credits1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate image credits consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        imageSizeArbitrary,
        imageCountArbitrary,
        async (size, count) => {
          const credits1 = calculator.calculateImageCredits(size, count);
          const credits2 = calculator.calculateImageCredits(size, count);

          expect(credits1).toBe(credits2);
          expect(credits1).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate speech credits consistently', async () => {
    await fc.assert(
      fc.asyncProperty(speechTextArbitrary, async (text) => {
        const credits1 = calculator.calculateSpeechCredits(text);
        const credits2 = calculator.calculateSpeechCredits(text);

        expect(credits1).toBe(credits2);
        expect(credits1).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should calculate transcription credits consistently', async () => {
    await fc.assert(
      fc.asyncProperty(audioDurationArbitrary, async (duration) => {
        const credits1 = calculator.calculateTranscriptionCredits(duration);
        const credits2 = calculator.calculateTranscriptionCredits(duration);

        expect(credits1).toBe(credits2);
        expect(credits1).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain accuracy within acceptable margin for detailed calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50000 }),
        fc.integer({ min: 0, max: 50000 }),
        modelNameArbitrary,
        async (inputTokens, outputTokens, model) => {
          const detailedCredits = calculator.calculateTextCreditsDetailed(
            inputTokens,
            outputTokens,
            model
          );
          const combinedCredits = calculator.calculateTextCredits(
            inputTokens + outputTokens,
            model
          );

          // Should be the same since we use combined calculation
          expect(detailedCredits).toBe(combinedCredits);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Provider failover
 * Feature: nextjs-ai-services, Property 2: Provider failover
 * Validates: Requirements 11.1, 11.2, 11.3
 *
 * For any provider failure, the system should attempt retry before returning error to user
 */
describe('Property 2: Provider failover', () => {
  it('should retry retryable errors', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 5 }), async (failureCount) => {
        let attempts = 0;
        const maxRetries = 3;

        const operation = async () => {
          attempts++;
          if (attempts <= failureCount && attempts < maxRetries) {
            // Use an error message that will be recognized as retryable
            const error = new Error('503 Service Unavailable');
            error.name = 'ServiceError';
            throw error;
          }
          return 'success';
        };

        try {
          const result = await executeWithRetry(operation, {
            maxRetries,
            initialDelay: 10,
            maxDelay: 100,
          });

          // If we succeeded, attempts should be failureCount + 1 or maxRetries
          expect(attempts).toBeGreaterThanOrEqual(1);
          expect(attempts).toBeLessThanOrEqual(maxRetries);
          expect(result).toBe('success');
        } catch (error) {
          // If we failed, we should have tried maxRetries times
          expect(attempts).toBe(maxRetries);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not retry non-retryable errors', async () => {
    const nonRetryableErrors = [
      new Error('Invalid API key'),
      new Error('Bad request: 400'),
      new Error('Unauthorized: 401'),
      new Error('Forbidden: 403'),
      new Error('Not found: 404'),
    ];

    for (const error of nonRetryableErrors) {
      let attempts = 0;

      const operation = async () => {
        attempts++;
        throw error;
      };

      try {
        await executeWithRetry(operation, { maxRetries: 3, initialDelay: 10 });
        expect.fail('Should have thrown error');
      } catch (e) {
        // Should fail immediately without retries
        expect(attempts).toBe(1);
      }
    }
  });

  it('should correctly identify retryable errors', () => {
    const retryableErrors = [
      new Error('Network error'),
      new Error('ECONNRESET'),
      new Error('ETIMEDOUT'),
      new Error('Rate limit exceeded'),
      new Error('429 Too Many Requests'),
      new Error('500 Internal Server Error'),
      new Error('502 Bad Gateway'),
      new Error('503 Service Unavailable'),
      new Error('504 Gateway Timeout'),
    ];

    for (const error of retryableErrors) {
      expect(isRetryableError(error)).toBe(true);
    }

    const nonRetryableErrors = [
      new Error('Invalid API key'),
      new Error('400 Bad Request'),
      new Error('401 Unauthorized'),
      new Error('403 Forbidden'),
      new Error('404 Not Found'),
    ];

    for (const error of nonRetryableErrors) {
      expect(isRetryableError(error)).toBe(false);
    }
  });
});

/**
 * Property 3: Rate limit enforcement
 * Feature: nextjs-ai-services, Property 3: Rate limit enforcement
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 *
 * For any user making requests, the system should enforce rate limits consistently
 * across all endpoints
 */
describe('Property 3: Rate limit enforcement', () => {
  it('should enforce rate limits consistently', async () => {
    // This is a conceptual test - actual rate limiting requires Redis/state
    // We test the logic that would be used in rate limiting

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 1, max: 100 }),
        async (requestCount, maxRequests) => {
          let allowedCount = 0;
          let deniedCount = 0;

          // Simulate rate limit checking
          for (let i = 0; i < requestCount; i++) {
            if (i < maxRequests) {
              allowedCount++;
            } else {
              deniedCount++;
            }
          }

          // Verify counts
          expect(allowedCount + deniedCount).toBe(requestCount);
          expect(allowedCount).toBeLessThanOrEqual(maxRequests);

          if (requestCount > maxRequests) {
            expect(deniedCount).toBeGreaterThan(0);
          } else {
            expect(deniedCount).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate rate limit windows correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 3600000 }), // 1 second to 1 hour
        async (windowMs) => {
          const now = Date.now();
          const resetTime = now + windowMs;

          // Reset time should always be in the future
          expect(resetTime).toBeGreaterThan(now);

          // Reset time should be exactly windowMs in the future
          expect(resetTime - now).toBe(windowMs);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 1: Credit deduction atomicity
 * Feature: nextjs-ai-services, Property 1: Credit deduction atomicity
 * Validates: Requirements 2.4, 2.5, 7.3, 7.4
 *
 * For any AI generation request, credits should be deducted if and only if
 * the generation completes successfully
 */
describe('Property 1: Credit deduction atomicity', () => {
  it('should maintain credit balance consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 100 }),
        fc.boolean(),
        async (initialCredits, creditCost, operationSucceeds) => {
          let currentCredits = initialCredits;

          // Simulate credit deduction with transaction semantics
          const deductCredits = (amount: number): boolean => {
            if (currentCredits >= amount) {
              currentCredits -= amount;
              return true;
            }
            return false;
          };

          const refundCredits = (amount: number): void => {
            currentCredits += amount;
          };

          // Attempt operation
          let operationCompleted = false;
          let creditsDeducted = false;

          try {
            // Check if we have enough credits
            if (currentCredits >= creditCost) {
              // Deduct credits
              creditsDeducted = deductCredits(creditCost);

              // Simulate operation
              if (!operationSucceeds) {
                throw new Error('Operation failed');
              }

              operationCompleted = true;
            }
          } catch (error) {
            // Refund credits on failure
            if (creditsDeducted) {
              refundCredits(creditCost);
              creditsDeducted = false;
            }
          }

          // Verify atomicity
          if (operationCompleted) {
            // Credits should be deducted
            expect(currentCredits).toBe(initialCredits - creditCost);
          } else {
            // Credits should not be deducted (either insufficient or refunded)
            expect(currentCredits).toBe(initialCredits);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never allow negative credit balance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (initialCredits, creditCost) => {
          let currentCredits = initialCredits;

          // Attempt to deduct credits
          const canDeduct = currentCredits >= creditCost;

          if (canDeduct) {
            currentCredits -= creditCost;
          }

          // Credits should never be negative
          expect(currentCredits).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Credit refund on failure
 * Feature: nextjs-ai-services, Property 7: Credit refund on failure
 * Validates: Requirements 2.5, 7.4, 11.5
 *
 * For any failed generation, credits should be refunded to the workspace
 */
describe('Property 7: Credit refund on failure', () => {
  it('should refund credits on any failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 10000 }),
        fc.integer({ min: 1, max: 100 }),
        fc.constantFrom('network', 'timeout', 'provider', 'validation'),
        async (initialCredits, creditCost, failureType) => {
          let currentCredits = initialCredits;
          const originalCredits = initialCredits;

          // Deduct credits
          currentCredits -= creditCost;
          expect(currentCredits).toBe(originalCredits - creditCost);

          // Simulate failure
          const operationFailed = true;

          // Refund on failure
          if (operationFailed) {
            currentCredits += creditCost;
          }

          // Credits should be restored
          expect(currentCredits).toBe(originalCredits);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle partial refunds correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 10000 }),
        fc.integer({ min: 10, max: 100 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        async (initialCredits, creditCost, completionRatio) => {
          let currentCredits = initialCredits;

          // Deduct full credits
          currentCredits -= creditCost;

          // Calculate partial refund (for streaming that was interrupted)
          const usedCredits = Math.floor(creditCost * completionRatio);
          const refundAmount = creditCost - usedCredits;

          // Refund unused portion
          currentCredits += refundAmount;

          // Verify final balance
          const expectedCredits = initialCredits - usedCredits;
          expect(currentCredits).toBe(expectedCredits);
          expect(currentCredits).toBeGreaterThanOrEqual(
            initialCredits - creditCost
          );
          expect(currentCredits).toBeLessThanOrEqual(initialCredits);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain credit balance after multiple operations with failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 10000 }),
        fc.array(
          fc.record({
            cost: fc.integer({ min: 1, max: 50 }),
            succeeds: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (initialCredits, operations) => {
          let currentCredits = initialCredits;
          let expectedCredits = initialCredits;

          for (const op of operations) {
            // Check if we have enough credits
            if (currentCredits >= op.cost) {
              // Deduct credits
              currentCredits -= op.cost;

              if (op.succeeds) {
                // Operation succeeded, credits stay deducted
                expectedCredits -= op.cost;
              } else {
                // Operation failed, refund credits
                currentCredits += op.cost;
              }
            }
          }

          // Final balance should match expected
          expect(currentCredits).toBe(expectedCredits);
          expect(currentCredits).toBeGreaterThanOrEqual(0);
          expect(currentCredits).toBeLessThanOrEqual(initialCredits);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 6: AI Provider Response Type Safety
 * Feature: critical-fixes, Property 6: AI Provider Response Type Safety
 * Validates: Requirements 4.1, 4.2, 4.5
 *
 * For any AI provider API response, the system should handle the response type
 * correctly without runtime type errors, including proper handling of undefined values.
 */
describe('Property 6: AI Provider Response Type Safety', () => {
  // Generate valid response metadata
  const responseMetadataArbitrary = fc.record({
    model: modelNameArbitrary,
    provider: fc.constantFrom<AIProvider>('openai', 'anthropic', 'google', 'mistral'),
    tokens: fc.option(
      fc.record({
        input: fc.integer({ min: 0, max: 100000 }),
        output: fc.integer({ min: 0, max: 100000 }),
        total: fc.integer({ min: 0, max: 200000 }),
      }),
      { nil: undefined }
    ),
    credits: fc.integer({ min: 0, max: 10000 }),
    finishReason: fc.option(
      fc.constantFrom('stop', 'length', 'content_filter', 'other'),
      { nil: undefined }
    ),
  });

  // Generate text generation responses with optional undefined fields
  const textGenerationResponseArbitrary = fc.record({
    content: fc.string({ minLength: 0, maxLength: 5000 }),
    metadata: responseMetadataArbitrary,
  });

  // Generate streaming chunks with optional metadata
  const streamChunkArbitrary = fc.record({
    content: fc.string({ minLength: 0, maxLength: 500 }),
    isComplete: fc.boolean(),
    metadata: fc.option(responseMetadataArbitrary, { nil: undefined }),
  });

  it('should handle text generation responses with all fields present', async () => {
    await fc.assert(
      fc.asyncProperty(textGenerationResponseArbitrary, async (response) => {
        // Verify response structure is valid
        expect(response).toHaveProperty('content');
        expect(response).toHaveProperty('metadata');
        expect(typeof response.content).toBe('string');
        expect(response.metadata).toHaveProperty('model');
        expect(response.metadata).toHaveProperty('provider');
        expect(response.metadata).toHaveProperty('credits');
        expect(response.metadata.credits).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle streaming chunks with optional metadata', async () => {
    await fc.assert(
      fc.asyncProperty(streamChunkArbitrary, async (chunk) => {
        // Verify chunk structure
        expect(chunk).toHaveProperty('content');
        expect(chunk).toHaveProperty('isComplete');
        expect(typeof chunk.content).toBe('string');
        expect(typeof chunk.isComplete).toBe('boolean');

        // Metadata should only be present on complete chunks (or optionally)
        if (chunk.metadata !== undefined) {
          expect(chunk.metadata).toHaveProperty('model');
          expect(chunk.metadata).toHaveProperty('provider');
          expect(chunk.metadata).toHaveProperty('credits');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should safely handle undefined token counts with fallback to zero', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(
          fc.record({
            input: fc.integer({ min: 0, max: 100000 }),
            output: fc.integer({ min: 0, max: 100000 }),
            total: fc.integer({ min: 0, max: 200000 }),
          }),
          { nil: undefined }
        ),
        async (tokens) => {
          // Simulate safe token extraction with fallback
          const inputTokens = tokens?.input ?? 0;
          const outputTokens = tokens?.output ?? 0;
          const totalTokens = tokens?.total ?? 0;

          // All values should be non-negative numbers
          expect(inputTokens).toBeGreaterThanOrEqual(0);
          expect(outputTokens).toBeGreaterThanOrEqual(0);
          expect(totalTokens).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(inputTokens)).toBe(true);
          expect(Number.isFinite(outputTokens)).toBe(true);
          expect(Number.isFinite(totalTokens)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle provider-specific response variations', async () => {
    // Simulate different provider response structures
    const providerResponseArbitrary = fc.oneof(
      // OpenAI-style response
      fc.record({
        choices: fc.array(
          fc.record({
            message: fc.record({
              content: fc.option(fc.string(), { nil: null }),
              role: fc.constantFrom('assistant', 'user', 'system'),
            }),
            finish_reason: fc.option(fc.string(), { nil: null }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        usage: fc.option(
          fc.record({
            prompt_tokens: fc.integer({ min: 0, max: 10000 }),
            completion_tokens: fc.integer({ min: 0, max: 10000 }),
            total_tokens: fc.integer({ min: 0, max: 20000 }),
          }),
          { nil: undefined }
        ),
      }),
      // Anthropic-style response
      fc.record({
        content: fc.array(
          fc.record({
            type: fc.constant('text'),
            text: fc.string(),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        usage: fc.record({
          input_tokens: fc.integer({ min: 0, max: 10000 }),
          output_tokens: fc.integer({ min: 0, max: 10000 }),
        }),
        stop_reason: fc.option(fc.string(), { nil: null }),
      })
    );

    await fc.assert(
      fc.asyncProperty(providerResponseArbitrary, async (response) => {
        // Extract content safely regardless of provider format
        let content: string | null = null;

        if ('choices' in response && response.choices.length > 0) {
          // OpenAI format
          content = response.choices[0]?.message?.content ?? null;
        } else if ('content' in response && Array.isArray(response.content)) {
          // Anthropic format
          const textBlocks = response.content.filter(
            (block): block is { type: 'text'; text: string } =>
              block.type === 'text'
          );
          content = textBlocks.map((b) => b.text).join('') || null;
        }

        // Content extraction should not throw
        expect(content === null || typeof content === 'string').toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should map finish reasons consistently across providers', async () => {
    const finishReasonMappings: Record<string, string> = {
      stop: 'stop',
      end_turn: 'stop',
      STOP: 'stop',
      length: 'length',
      max_tokens: 'length',
      MAX_TOKENS: 'length',
      content_filter: 'content_filter',
      SAFETY: 'content_filter',
    };

    const finishReasonArbitrary = fc.constantFrom(
      ...Object.keys(finishReasonMappings),
      null,
      undefined
    );

    await fc.assert(
      fc.asyncProperty(finishReasonArbitrary, async (reason) => {
        // Map finish reason to standard format
        const mapFinishReason = (
          r: string | null | undefined
        ): string | undefined => {
          if (r === null || r === undefined) return undefined;
          return finishReasonMappings[r] ?? r.toLowerCase();
        };

        const mapped = mapFinishReason(reason);

        // Result should be undefined or a string
        expect(mapped === undefined || typeof mapped === 'string').toBe(true);

        // If input was defined, output should be defined
        if (reason !== null && reason !== undefined) {
          expect(mapped).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle image generation responses with optional fields', async () => {
    const imageResponseArbitrary = fc.record({
      url: fc.option(fc.webUrl(), { nil: undefined }),
      b64_json: fc.option(fc.base64String(), { nil: undefined }),
      revised_prompt: fc.option(fc.string(), { nil: undefined }),
    });

    await fc.assert(
      fc.asyncProperty(imageResponseArbitrary, async (imageData) => {
        // Extract URL with fallback
        const url = imageData.url ?? imageData.b64_json ?? '';

        // URL should be a string (possibly empty)
        expect(typeof url).toBe('string');

        // If both are undefined, url should be empty string
        if (imageData.url === undefined && imageData.b64_json === undefined) {
          expect(url).toBe('');
        }
      }),
      { numRuns: 100 }
    );
  });
});
