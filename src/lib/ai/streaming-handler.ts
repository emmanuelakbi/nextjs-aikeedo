/**
 * Streaming Response Handler
 *
 * Provides utilities for handling streaming AI responses with:
 * - Chunk parsing and aggregation
 * - Error handling for interrupted streams
 * - Cancellation support
 * - Progress tracking
 */

import type { TextStreamChunk, ResponseMetadata } from './types';

/**
 * Options for streaming handler
 */
export interface StreamingHandlerOptions {
  /**
   * Callback for each chunk received
   */
  onChunk?: (chunk: string) => void;

  /**
   * Callback for progress updates
   */
  onProgress?: (progress: StreamProgress) => void;

  /**
   * Callback when stream completes
   */
  onComplete?: (result: StreamResult) => void;

  /**
   * Callback for errors
   */
  onError?: (error: StreamError) => void;

  /**
   * Timeout in milliseconds for stream inactivity
   */
  timeout?: number;

  /**
   * Maximum number of chunks to buffer
   */
  maxBufferSize?: number;
}

/**
 * Progress information for streaming
 */
export interface StreamProgress {
  chunksReceived: number;
  totalContent: string;
  estimatedTokens: number;
  elapsedTime: number;
}

/**
 * Result of completed stream
 */
export interface StreamResult {
  content: string;
  metadata?: ResponseMetadata;
  chunksReceived: number;
  totalTime: number;
}

/**
 * Stream error information
 */
export interface StreamError {
  code: 'TIMEOUT' | 'INTERRUPTED' | 'CANCELLED' | 'BUFFER_OVERFLOW' | 'UNKNOWN';
  message: string;
  partialContent?: string;
  chunksReceived?: number;
}

/**
 * Streaming Response Handler
 *
 * Handles streaming responses from AI providers with error handling,
 * cancellation support, and chunk aggregation.
 */
export class StreamingHandler {
  private options: Required<StreamingHandlerOptions>;
  private abortController: AbortController;
  private startTime: number = 0;
  private lastChunkTime: number = 0;
  private timeoutId?: NodeJS.Timeout;
  private buffer: string[] = [];
  private chunksReceived: number = 0;
  private isCancelled: boolean = false;
  private isCompleted: boolean = false;

  constructor(options: StreamingHandlerOptions = {}) {
    this.options = {
      onChunk: options.onChunk || (() => {}),
      onProgress: options.onProgress || (() => {}),
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || (() => {}),
      timeout: options.timeout || 30000, // 30 seconds default
      maxBufferSize: options.maxBufferSize || 10000, // 10k chunks max
    };
    this.abortController = new AbortController();
  }

  /**
   * Process a stream of text chunks
   *
   * @param stream - AsyncIterable of text chunks
   * @returns Promise resolving to the complete result
   */
  async processStream(
    stream: AsyncIterable<TextStreamChunk>
  ): Promise<StreamResult> {
    this.startTime = Date.now();
    this.lastChunkTime = this.startTime;
    this.resetTimeout();

    try {
      let totalContent = '';
      let finalMetadata: ResponseMetadata | undefined;

      for await (const chunk of stream) {
        // Check if cancelled
        if (this.isCancelled) {
          throw this.createError(
            'CANCELLED',
            'Stream was cancelled by user',
            totalContent
          );
        }

        // Check abort signal
        if (this.abortController.signal.aborted) {
          throw this.createError(
            'CANCELLED',
            'Stream was aborted',
            totalContent
          );
        }

        // Update timing
        this.lastChunkTime = Date.now();
        this.resetTimeout();

        // Process chunk
        if (chunk.content) {
          totalContent += chunk.content;
          this.buffer.push(chunk.content);
          this.chunksReceived++;

          // Check buffer overflow
          if (this.buffer.length > this.options.maxBufferSize) {
            throw this.createError(
              'BUFFER_OVERFLOW',
              `Buffer exceeded maximum size of ${this.options.maxBufferSize} chunks`,
              totalContent
            );
          }

          // Notify chunk callback
          this.options.onChunk(chunk.content);

          // Notify progress
          this.options.onProgress({
            chunksReceived: this.chunksReceived,
            totalContent,
            estimatedTokens: this.estimateTokens(totalContent),
            elapsedTime: Date.now() - this.startTime,
          });
        }

        // Check if complete
        if (chunk.isComplete) {
          finalMetadata = chunk.metadata;
          break;
        }
      }

      // Clear timeout
      this.clearTimeout();

      // Mark as completed
      this.isCompleted = true;

      const result: StreamResult = {
        content: totalContent,
        metadata: finalMetadata,
        chunksReceived: this.chunksReceived,
        totalTime: Date.now() - this.startTime,
      };

      // Notify completion
      this.options.onComplete(result);

      return result;
    } catch (error) {
      this.clearTimeout();

      // Handle different error types
      if (this.isStreamError(error)) {
        this.options.onError(error);
        throw error;
      }

      // Convert unknown errors
      const streamError = this.createError(
        'UNKNOWN',
        error instanceof Error ? error.message : 'Unknown error occurred',
        this.getAggregatedContent()
      );
      this.options.onError(streamError);
      throw streamError;
    }
  }

  /**
   * Cancel the stream
   */
  cancel(): void {
    if (this.isCompleted) {
      return;
    }

    this.isCancelled = true;
    this.abortController.abort();
    this.clearTimeout();
  }

  /**
   * Get the abort signal for external use
   */
  getAbortSignal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Get current aggregated content
   */
  getAggregatedContent(): string {
    return this.buffer.join('');
  }

  /**
   * Get current progress
   */
  getProgress(): StreamProgress {
    return {
      chunksReceived: this.chunksReceived,
      totalContent: this.getAggregatedContent(),
      estimatedTokens: this.estimateTokens(this.getAggregatedContent()),
      elapsedTime: Date.now() - this.startTime,
    };
  }

  /**
   * Check if stream is cancelled
   */
  isCancelledStream(): boolean {
    return this.isCancelled;
  }

  /**
   * Check if stream is completed
   */
  isCompletedStream(): boolean {
    return this.isCompleted;
  }

  /**
   * Reset the inactivity timeout
   */
  private resetTimeout(): void {
    this.clearTimeout();

    this.timeoutId = setTimeout(() => {
      const error = this.createError(
        'TIMEOUT',
        `Stream timed out after ${this.options.timeout}ms of inactivity`,
        this.getAggregatedContent()
      );
      this.options.onError(error);
      this.cancel();
    }, this.options.timeout);
  }

  /**
   * Clear the timeout
   */
  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  /**
   * Create a stream error
   */
  private createError(
    code: StreamError['code'],
    message: string,
    partialContent?: string
  ): StreamError {
    return {
      code,
      message,
      partialContent,
      chunksReceived: this.chunksReceived,
    };
  }

  /**
   * Check if error is a StreamError
   */
  private isStreamError(error: unknown): error is StreamError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Utility function to aggregate a stream into a single result
 *
 * @param stream - AsyncIterable of text chunks
 * @param options - Optional streaming handler options
 * @returns Promise resolving to the complete content
 */
export async function aggregateStream(
  stream: AsyncIterable<TextStreamChunk>,
  options?: StreamingHandlerOptions
): Promise<string> {
  const handler = new StreamingHandler(options);
  const result = await handler.processStream(stream);
  return result.content;
}

/**
 * Utility function to convert a stream to a ReadableStream for HTTP responses
 *
 * @param stream - AsyncIterable of text chunks
 * @returns ReadableStream for HTTP streaming
 */
export function toReadableStream(
  stream: AsyncIterable<TextStreamChunk>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const handler = new StreamingHandler();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (handler.isCancelledStream()) {
            controller.close();
            return;
          }

          if (chunk.content) {
            // Send as Server-Sent Events format
            const data = JSON.stringify({
              content: chunk.content,
              isComplete: chunk.isComplete,
              metadata: chunk.metadata,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          if (chunk.isComplete) {
            controller.close();
            return;
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      handler.cancel();
    },
  });
}

/**
 * Parse Server-Sent Events stream
 *
 * @param response - Fetch Response with SSE stream
 * @returns AsyncIterable of parsed chunks
 */
export async function* parseSSEStream(
  response: Response
): AsyncIterable<TextStreamChunk> {
  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const chunk = JSON.parse(data) as TextStreamChunk;
            yield chunk;
          } catch (error) {
            console.error('Failed to parse SSE data:', error);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
