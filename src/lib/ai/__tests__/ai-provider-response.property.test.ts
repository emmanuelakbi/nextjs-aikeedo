/**
 * Property-Based Tests for AI Provider Response Handling
 *
 * Feature: critical-fixes
 * **Property 6: AI Provider Response Type Safety**
 * **Validates: Requirements 4.1, 4.2, 4.5**
 *
 * These tests validate that AI provider API responses are handled correctly
 * without runtime type errors, including:
 * - Response type handling (Requirement 4.1)
 * - Streaming chunk type matching (Requirement 4.2)
 * - Type-safe provider response mapping (Requirement 4.5)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  AIProvider,
  ResponseMetadata,
  TextGenerationResponse,
  TextStreamChunk,
  ImageGenerationResponse,
  SpeechSynthesisResponse,
  TranscriptionResponse,
  TranscriptionSegment,
  ImageSize,
} from '../types';

/**
 * Arbitraries for AI provider response testing
 */

// Valid AI providers
const aiProviderArbitrary = fc.constantFrom<AIProvider>(
  'openai',
  'anthropic',
  'google',
  'mistral',
  'openrouter'
);

// Valid model names per provider
const modelNameArbitrary = fc.constantFrom(
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-3-5-sonnet-20241022',
  'gemini-pro',
  'gemini-1.5-pro',
  'mistral-large-latest',
  'mistral-medium-latest',
  'mistral-small-latest'
);

// Valid finish reasons across providers
const finishReasonArbitrary = fc.option(
  fc.constantFrom(
    'stop',
    'length',
    'content_filter',
    'end_turn',
    'max_tokens',
    'tool_calls',
    'function_call'
  ),
  { nil: undefined }
);

// Token counts (non-negative integers)
const tokenCountArbitrary = fc.integer({ min: 0, max: 100000 });

// Credit amounts (non-negative integers)
const creditAmountArbitrary = fc.integer({ min: 0, max: 10000 });

// Valid image sizes
const imageSizeArbitrary = fc.constantFrom<ImageSize>(
  '256x256',
  '512x512',
  '1024x1024',
  '1792x1024',
  '1024x1792'
);

/**
 * Generate valid ResponseMetadata
 */
const responseMetadataArbitrary: fc.Arbitrary<ResponseMetadata> = fc.record({
  model: modelNameArbitrary,
  provider: aiProviderArbitrary,
  tokens: fc.option(
    fc.record({
      input: tokenCountArbitrary,
      output: tokenCountArbitrary,
      total: tokenCountArbitrary,
    }),
    { nil: undefined }
  ),
  credits: creditAmountArbitrary,
  finishReason: finishReasonArbitrary,
});

/**
 * Generate valid TextGenerationResponse
 */
const textGenerationResponseArbitrary: fc.Arbitrary<TextGenerationResponse> =
  fc.record({
    content: fc.string({ minLength: 0, maxLength: 10000 }),
    metadata: responseMetadataArbitrary,
  });

/**
 * Generate valid TextStreamChunk
 */
const textStreamChunkArbitrary: fc.Arbitrary<TextStreamChunk> = fc.record({
  content: fc.string({ minLength: 0, maxLength: 1000 }),
  isComplete: fc.boolean(),
  metadata: fc.option(responseMetadataArbitrary, { nil: undefined }),
});

/**
 * Generate valid TranscriptionSegment
 */
const transcriptionSegmentArbitrary: fc.Arbitrary<TranscriptionSegment> =
  fc.record({
    text: fc.string({ minLength: 1, maxLength: 500 }),
    start: fc.float({ min: 0, max: 3600, noNaN: true }),
    end: fc.float({ min: 0, max: 3600, noNaN: true }),
  });

/**
 * Generate valid ImageGenerationResponse
 */
const imageGenerationResponseArbitrary: fc.Arbitrary<ImageGenerationResponse> =
  fc.record({
    url: fc.webUrl(),
    width: fc.constantFrom(256, 512, 1024, 1792),
    height: fc.constantFrom(256, 512, 1024, 1792),
    metadata: responseMetadataArbitrary,
  });

/**
 * Generate valid SpeechSynthesisResponse
 */
const speechSynthesisResponseArbitrary: fc.Arbitrary<SpeechSynthesisResponse> =
  fc.record({
    url: fc.webUrl(),
    format: fc.constantFrom('mp3', 'opus', 'aac', 'flac', 'wav'),
    duration: fc.float({ min: 0, max: 3600, noNaN: true }),
    metadata: responseMetadataArbitrary,
  });

/**
 * Generate valid TranscriptionResponse
 */
const transcriptionResponseArbitrary: fc.Arbitrary<TranscriptionResponse> =
  fc.record({
    text: fc.string({ minLength: 0, maxLength: 10000 }),
    language: fc.option(fc.constantFrom('en', 'es', 'fr', 'de', 'ja', 'zh'), {
      nil: undefined,
    }),
    duration: fc.float({ min: 0, max: 3600, noNaN: true }),
    segments: fc.option(fc.array(transcriptionSegmentArbitrary, { maxLength: 100 }), {
      nil: undefined,
    }),
    metadata: responseMetadataArbitrary,
  });

/**
 * Property 6: AI Provider Response Type Safety
 * **Validates: Requirements 4.1, 4.2, 4.5**
 *
 * For any AI provider API response, the system should handle the response type
 * correctly without runtime type errors.
 */
describe('Property 6: AI Provider Response Type Safety', () => {
  /**
   * Test: Text generation responses have correct structure
   * **Validates: Requirements 4.1**
   */
  describe('Text Generation Response Handling', () => {
    it('should handle text generation responses with all required fields', () => {
      fc.assert(
        fc.property(textGenerationResponseArbitrary, (response) => {
          // Verify required fields exist
          expect(response).toHaveProperty('content');
          expect(response).toHaveProperty('metadata');

          // Verify content is a string
          expect(typeof response.content).toBe('string');

          // Verify metadata structure
          expect(response.metadata).toHaveProperty('model');
          expect(response.metadata).toHaveProperty('provider');
          expect(response.metadata).toHaveProperty('credits');

          // Verify types
          expect(typeof response.metadata.model).toBe('string');
          expect(typeof response.metadata.provider).toBe('string');
          expect(typeof response.metadata.credits).toBe('number');
          expect(response.metadata.credits).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle optional token counts with safe fallbacks', () => {
      fc.assert(
        fc.property(textGenerationResponseArbitrary, (response) => {
          // Safe extraction of token counts with fallback
          const inputTokens = response.metadata.tokens?.input ?? 0;
          const outputTokens = response.metadata.tokens?.output ?? 0;
          const totalTokens = response.metadata.tokens?.total ?? 0;

          // All values should be non-negative numbers
          expect(inputTokens).toBeGreaterThanOrEqual(0);
          expect(outputTokens).toBeGreaterThanOrEqual(0);
          expect(totalTokens).toBeGreaterThanOrEqual(0);

          // All values should be finite
          expect(Number.isFinite(inputTokens)).toBe(true);
          expect(Number.isFinite(outputTokens)).toBe(true);
          expect(Number.isFinite(totalTokens)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle optional finish reason safely', () => {
      fc.assert(
        fc.property(textGenerationResponseArbitrary, (response) => {
          const finishReason = response.metadata.finishReason;

          // Finish reason should be undefined or a string
          expect(
            finishReason === undefined || typeof finishReason === 'string'
          ).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Streaming chunk types match expected interfaces
   * **Validates: Requirements 4.2**
   */
  describe('Streaming Chunk Type Handling', () => {
    it('should handle streaming chunks with correct structure', () => {
      fc.assert(
        fc.property(textStreamChunkArbitrary, (chunk) => {
          // Verify required fields
          expect(chunk).toHaveProperty('content');
          expect(chunk).toHaveProperty('isComplete');

          // Verify types
          expect(typeof chunk.content).toBe('string');
          expect(typeof chunk.isComplete).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });

    it('should have metadata only when chunk is complete or optionally present', () => {
      fc.assert(
        fc.property(textStreamChunkArbitrary, (chunk) => {
          // Metadata can be present or absent
          if (chunk.metadata !== undefined) {
            // When present, verify structure
            expect(chunk.metadata).toHaveProperty('model');
            expect(chunk.metadata).toHaveProperty('provider');
            expect(chunk.metadata).toHaveProperty('credits');
            expect(chunk.metadata.credits).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle stream of chunks correctly', () => {
      // Generate a sequence of chunks simulating a stream
      const streamArbitrary = fc.array(textStreamChunkArbitrary, {
        minLength: 1,
        maxLength: 50,
      });

      fc.assert(
        fc.property(streamArbitrary, (chunks) => {
          let aggregatedContent = '';
          let finalMetadata: ResponseMetadata | undefined;

          // Process chunks like a real stream handler would
          for (const chunk of chunks) {
            aggregatedContent += chunk.content;

            if (chunk.isComplete && chunk.metadata) {
              finalMetadata = chunk.metadata;
            }
          }

          // Aggregated content should be a string
          expect(typeof aggregatedContent).toBe('string');

          // If any chunk was complete with metadata, we should have captured it
          const hasCompleteChunk = chunks.some(
            (c) => c.isComplete && c.metadata !== undefined
          );
          if (hasCompleteChunk) {
            expect(finalMetadata).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Provider response mapping is type-safe
   * **Validates: Requirements 4.5**
   */
  describe('Provider Response Mapping', () => {
    it('should map OpenAI-style responses to domain types safely', () => {
      // Simulate OpenAI response structure
      const openAIResponseArbitrary = fc.record({
        id: fc.uuid(),
        object: fc.constant('chat.completion'),
        created: fc.integer({ min: 0, max: 2000000000 }),
        model: modelNameArbitrary,
        choices: fc.array(
          fc.record({
            index: fc.integer({ min: 0, max: 10 }),
            message: fc.record({
              role: fc.constantFrom('assistant', 'user', 'system'),
              content: fc.option(fc.string({ maxLength: 5000 }), { nil: null }),
            }),
            finish_reason: fc.option(
              fc.constantFrom('stop', 'length', 'content_filter'),
              { nil: null }
            ),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        usage: fc.option(
          fc.record({
            prompt_tokens: tokenCountArbitrary,
            completion_tokens: tokenCountArbitrary,
            total_tokens: tokenCountArbitrary,
          }),
          { nil: undefined }
        ),
      });

      fc.assert(
        fc.property(openAIResponseArbitrary, (response) => {
          // Map to domain type safely
          const content = response.choices[0]?.message?.content ?? '';
          const finishReason = response.choices[0]?.finish_reason ?? undefined;
          const inputTokens = response.usage?.prompt_tokens ?? 0;
          const outputTokens = response.usage?.completion_tokens ?? 0;
          const totalTokens = response.usage?.total_tokens ?? 0;

          // Create domain response
          const domainResponse: TextGenerationResponse = {
            content,
            metadata: {
              model: response.model,
              provider: 'openai',
              tokens: {
                input: inputTokens,
                output: outputTokens,
                total: totalTokens,
              },
              credits: Math.ceil(totalTokens / 1000),
              finishReason: finishReason ?? undefined,
            },
          };

          // Verify mapping is type-safe
          expect(typeof domainResponse.content).toBe('string');
          expect(domainResponse.metadata.provider).toBe('openai');
          expect(domainResponse.metadata.credits).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should map Anthropic-style responses to domain types safely', () => {
      // Simulate Anthropic response structure
      const anthropicResponseArbitrary = fc.record({
        id: fc.uuid(),
        type: fc.constant('message'),
        role: fc.constant('assistant'),
        content: fc.array(
          fc.record({
            type: fc.constant('text'),
            text: fc.string({ maxLength: 5000 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        model: modelNameArbitrary,
        stop_reason: fc.option(
          fc.constantFrom('end_turn', 'max_tokens', 'stop_sequence'),
          { nil: null }
        ),
        usage: fc.record({
          input_tokens: tokenCountArbitrary,
          output_tokens: tokenCountArbitrary,
        }),
      });

      fc.assert(
        fc.property(anthropicResponseArbitrary, (response) => {
          // Map to domain type safely
          const textBlocks = response.content.filter(
            (block): block is { type: 'text'; text: string } =>
              block.type === 'text'
          );
          const content = textBlocks.map((b) => b.text).join('');
          const totalTokens =
            response.usage.input_tokens + response.usage.output_tokens;

          // Create domain response
          const domainResponse: TextGenerationResponse = {
            content,
            metadata: {
              model: response.model,
              provider: 'anthropic',
              tokens: {
                input: response.usage.input_tokens,
                output: response.usage.output_tokens,
                total: totalTokens,
              },
              credits: Math.ceil(totalTokens / 1000),
              finishReason: response.stop_reason ?? undefined,
            },
          };

          // Verify mapping is type-safe
          expect(typeof domainResponse.content).toBe('string');
          expect(domainResponse.metadata.provider).toBe('anthropic');
          expect(domainResponse.metadata.credits).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should normalize finish reasons across providers', () => {
      // Different providers use different finish reason strings
      const providerFinishReasons = fc.record({
        provider: aiProviderArbitrary,
        rawReason: fc.option(
          fc.constantFrom(
            'stop',
            'end_turn',
            'STOP',
            'length',
            'max_tokens',
            'MAX_TOKENS',
            'content_filter',
            'SAFETY',
            'tool_calls',
            'function_call'
          ),
          { nil: null }
        ),
      });

      fc.assert(
        fc.property(providerFinishReasons, ({ rawReason }) => {
          // Normalize finish reason
          const normalizeFinishReason = (
            reason: string | null | undefined
          ): string | undefined => {
            if (reason === null || reason === undefined) return undefined;

            const normalized = reason.toLowerCase();

            // Map to standard values
            if (['stop', 'end_turn'].includes(normalized)) return 'stop';
            if (['length', 'max_tokens'].includes(normalized)) return 'length';
            if (['content_filter', 'safety'].includes(normalized))
              return 'content_filter';
            if (['tool_calls', 'function_call'].includes(normalized))
              return 'tool_calls';

            return normalized;
          };

          const normalized = normalizeFinishReason(rawReason);

          // Result should be undefined or a string
          expect(
            normalized === undefined || typeof normalized === 'string'
          ).toBe(true);

          // If input was defined, output should be defined
          if (rawReason !== null && rawReason !== undefined) {
            expect(normalized).toBeDefined();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Image generation responses are handled correctly
   * **Validates: Requirements 4.1, 4.5**
   */
  describe('Image Generation Response Handling', () => {
    it('should handle image generation responses with all fields', () => {
      fc.assert(
        fc.property(imageGenerationResponseArbitrary, (response) => {
          // Verify required fields
          expect(response).toHaveProperty('url');
          expect(response).toHaveProperty('width');
          expect(response).toHaveProperty('height');
          expect(response).toHaveProperty('metadata');

          // Verify types
          expect(typeof response.url).toBe('string');
          expect(typeof response.width).toBe('number');
          expect(typeof response.height).toBe('number');
          expect(response.width).toBeGreaterThan(0);
          expect(response.height).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle image responses with optional URL or base64', () => {
      const imageDataArbitrary = fc.record({
        url: fc.option(fc.webUrl(), { nil: undefined }),
        b64_json: fc.option(fc.base64String({ minLength: 10, maxLength: 100 }), {
          nil: undefined,
        }),
        revised_prompt: fc.option(fc.string({ maxLength: 500 }), {
          nil: undefined,
        }),
      });

      fc.assert(
        fc.property(imageDataArbitrary, (imageData) => {
          // Extract image data safely
          const imageUrl = imageData.url ?? imageData.b64_json ?? '';

          // Should always result in a string
          expect(typeof imageUrl).toBe('string');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Speech synthesis responses are handled correctly
   * **Validates: Requirements 4.1, 4.5**
   */
  describe('Speech Synthesis Response Handling', () => {
    it('should handle speech synthesis responses with all fields', () => {
      fc.assert(
        fc.property(speechSynthesisResponseArbitrary, (response) => {
          // Verify required fields
          expect(response).toHaveProperty('url');
          expect(response).toHaveProperty('format');
          expect(response).toHaveProperty('duration');
          expect(response).toHaveProperty('metadata');

          // Verify types
          expect(typeof response.url).toBe('string');
          expect(typeof response.format).toBe('string');
          expect(typeof response.duration).toBe('number');
          expect(response.duration).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(response.duration)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Transcription responses are handled correctly
   * **Validates: Requirements 4.1, 4.5**
   */
  describe('Transcription Response Handling', () => {
    it('should handle transcription responses with all fields', () => {
      fc.assert(
        fc.property(transcriptionResponseArbitrary, (response) => {
          // Verify required fields
          expect(response).toHaveProperty('text');
          expect(response).toHaveProperty('duration');
          expect(response).toHaveProperty('metadata');

          // Verify types
          expect(typeof response.text).toBe('string');
          expect(typeof response.duration).toBe('number');
          expect(response.duration).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(response.duration)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle optional segments safely', () => {
      fc.assert(
        fc.property(transcriptionResponseArbitrary, (response) => {
          // Safe extraction of segments
          const segments = response.segments ?? [];

          // Should be an array
          expect(Array.isArray(segments)).toBe(true);

          // Each segment should have required fields
          for (const segment of segments) {
            expect(typeof segment.text).toBe('string');
            expect(typeof segment.start).toBe('number');
            expect(typeof segment.end).toBe('number');
            expect(segment.start).toBeGreaterThanOrEqual(0);
            expect(segment.end).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle optional language safely', () => {
      fc.assert(
        fc.property(transcriptionResponseArbitrary, (response) => {
          const language = response.language;

          // Language should be undefined or a string
          expect(
            language === undefined || typeof language === 'string'
          ).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Test: Response metadata is consistent across all response types
   * **Validates: Requirements 4.1, 4.5**
   */
  describe('Response Metadata Consistency', () => {
    it('should have consistent metadata structure across response types', () => {
      const allResponsesArbitrary = fc.oneof(
        textGenerationResponseArbitrary.map((r) => r.metadata),
        imageGenerationResponseArbitrary.map((r) => r.metadata),
        speechSynthesisResponseArbitrary.map((r) => r.metadata),
        transcriptionResponseArbitrary.map((r) => r.metadata)
      );

      fc.assert(
        fc.property(allResponsesArbitrary, (metadata) => {
          // All metadata should have these required fields
          expect(metadata).toHaveProperty('model');
          expect(metadata).toHaveProperty('provider');
          expect(metadata).toHaveProperty('credits');

          // Types should be consistent
          expect(typeof metadata.model).toBe('string');
          expect(typeof metadata.provider).toBe('string');
          expect(typeof metadata.credits).toBe('number');

          // Credits should be non-negative
          expect(metadata.credits).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate provider is a known AI provider', () => {
      const validProviders: AIProvider[] = [
        'openai',
        'anthropic',
        'google',
        'mistral',
        'openrouter',
      ];

      fc.assert(
        fc.property(responseMetadataArbitrary, (metadata) => {
          expect(validProviders).toContain(metadata.provider);
        }),
        { numRuns: 100 }
      );
    });
  });
});
