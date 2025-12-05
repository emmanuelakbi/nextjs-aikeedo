/**
 * Tests for Streaming Handler
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  StreamingHandler,
  aggregateStream,
  toReadableStream,
  parseSSEStream,
  
  type StreamProgress,
  type StreamResult,
  type StreamError,
} from '../streaming-handler';
import type { TextStreamChunk } from '../types';

describe('StreamingHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processStream', () => {
    it('should process a complete stream successfully', async () => {
      const chunks: TextStreamChunk[] = [
        { content: 'Hello', isComplete: false },
        { content: ' ', isComplete: false },
        { content: 'world', isComplete: false },
        {
          content: '!',
          isComplete: true,
          metadata: {
            model: 'gpt-4',
            provider: 'openai',
            tokens: { input: 5, output: 6, total: 11 },
            credits: 1,
          },
        },
      ];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const handler = new StreamingHandler();
      const result = await handler.processStream(mockStream());

      expect(result.content).toBe('Hello world!');
      expect(result.chunksReceived).toBe(4);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.model).toBe('gpt-4');
    });

    it('should call onChunk callback for each chunk', async () => {
      const chunks: TextStreamChunk[] = [
        { content: 'A', isComplete: false },
        { content: 'B', isComplete: false },
        { content: 'C', isComplete: true },
      ];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const onChunk = vi.fn();
      const handler = new StreamingHandler({ onChunk });
      await handler.processStream(mockStream());

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'A');
      expect(onChunk).toHaveBeenNthCalledWith(2, 'B');
      expect(onChunk).toHaveBeenNthCalledWith(3, 'C');
    });

    it('should call onProgress callback with progress updates', async () => {
      const chunks: TextStreamChunk[] = [
        { content: 'Hello', isComplete: false },
        { content: ' world', isComplete: true },
      ];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const onProgress = vi.fn();
      const handler = new StreamingHandler({ onProgress });
      await handler.processStream(mockStream());

      expect(onProgress).toHaveBeenCalledTimes(2);

      const firstCall = onProgress.mock.calls[0]?.[0] as StreamProgress;
      expect(firstCall.chunksReceived).toBe(1);
      expect(firstCall.totalContent).toBe('Hello');

      const secondCall = onProgress.mock.calls[1]?.[0] as StreamProgress;
      expect(secondCall.chunksReceived).toBe(2);
      expect(secondCall.totalContent).toBe('Hello world');
    });

    it('should call onComplete callback when stream finishes', async () => {
      const chunks: TextStreamChunk[] = [{ content: 'Done', isComplete: true }];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const onComplete = vi.fn();
      const handler = new StreamingHandler({ onComplete });
      await handler.processStream(mockStream());

      expect(onComplete).toHaveBeenCalledTimes(1);
      const result = onComplete.mock.calls[0]?.[0] as StreamResult;
      expect(result.content).toBe('Done');
      expect(result.chunksReceived).toBe(1);
    });

    it('should handle timeout for inactive streams', async () => {
      async function* mockStream() {
        yield { content: 'Start', isComplete: false };
        // Simulate long delay that exceeds timeout
        await new Promise((resolve) => setTimeout(resolve, 2000));
        yield { content: 'End', isComplete: true };
      }

      const onError = vi.fn();
      const handler = new StreamingHandler({ timeout: 100, onError });

      await expect(handler.processStream(mockStream())).rejects.toThrow();
      expect(onError).toHaveBeenCalled();

      const error = onError.mock.calls[0]?.[0] as StreamError;
      expect(error.code).toBe('TIMEOUT');
      expect(error.partialContent).toBe('Start');
    }, 5000);

    it('should handle cancellation', async () => {
      let yieldCount = 0;
      async function* mockStream() {
        while (yieldCount < 10) {
          yield { content: `chunk${yieldCount}`, isComplete: false };
          yieldCount++;
          // Small delay to allow cancellation to happen
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        yield { content: 'end', isComplete: true };
      }

      const handler = new StreamingHandler();
      const resultPromise = handler.processStream(mockStream());

      // Cancel immediately
      handler.cancel();

      await expect(resultPromise).rejects.toThrow('Stream was cancelled');
      expect(handler.isCancelledStream()).toBe(true);
    });

    it('should handle buffer overflow', async () => {
      async function* mockStream() {
        for (let i = 0; i < 150; i++) {
          yield { content: `chunk${i}`, isComplete: false };
        }
        yield { content: 'end', isComplete: true };
      }

      const onError = vi.fn();
      const handler = new StreamingHandler({ maxBufferSize: 100, onError });

      await expect(handler.processStream(mockStream())).rejects.toThrow();
      expect(onError).toHaveBeenCalled();

      const error = onError.mock.calls[0]?.[0] as StreamError;
      expect(error.code).toBe('BUFFER_OVERFLOW');
    });

    it('should handle stream errors gracefully', async () => {
      async function* mockStream() {
        yield { content: 'Start', isComplete: false };
        throw new Error('Stream error');
      }

      const onError = vi.fn();
      const handler = new StreamingHandler({ onError });

      await expect(handler.processStream(mockStream())).rejects.toThrow();
      expect(onError).toHaveBeenCalled();

      const error = onError.mock.calls[0]?.[0] as StreamError;
      expect(error.code).toBe('UNKNOWN');
      expect(error.partialContent).toBe('Start');
    });
  });

  describe('getAggregatedContent', () => {
    it('should return aggregated content from all chunks', async () => {
      const chunks: TextStreamChunk[] = [
        { content: 'Hello', isComplete: false },
        { content: ' ', isComplete: false },
        { content: 'world', isComplete: true },
      ];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const handler = new StreamingHandler();
      await handler.processStream(mockStream());

      expect(handler.getAggregatedContent()).toBe('Hello world');
    });
  });

  describe('getProgress', () => {
    it('should return current progress information', async () => {
      const chunks: TextStreamChunk[] = [
        { content: 'Test', isComplete: false },
        { content: ' content', isComplete: true },
      ];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const handler = new StreamingHandler();
      await handler.processStream(mockStream());

      const progress = handler.getProgress();
      expect(progress.chunksReceived).toBe(2);
      expect(progress.totalContent).toBe('Test content');
      expect(progress.estimatedTokens).toBeGreaterThan(0);
    });
  });

  describe('cancel', () => {
    it('should not throw error when cancelling completed stream', async () => {
      const chunks: TextStreamChunk[] = [{ content: 'Done', isComplete: true }];

      async function* mockStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const handler = new StreamingHandler();
      await handler.processStream(mockStream());

      expect(() => handler.cancel()).not.toThrow();
      expect(handler.isCompletedStream()).toBe(true);
    });
  });
});

describe('aggregateStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should aggregate stream into single string', async () => {
    const chunks: TextStreamChunk[] = [
      { content: 'Hello', isComplete: false },
      { content: ' ', isComplete: false },
      { content: 'world', isComplete: true },
    ];

    async function* mockStream() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    const result = await aggregateStream(mockStream());

    expect(result).toBe('Hello world');
  });

  it('should call callbacks if provided', async () => {
    const chunks: TextStreamChunk[] = [
      { content: 'A', isComplete: false },
      { content: 'B', isComplete: true },
    ];

    async function* mockStream() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    const onChunk = vi.fn();
    const onComplete = vi.fn();

    await aggregateStream(mockStream(), { onChunk, onComplete });

    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('toReadableStream', () => {
  it('should convert AsyncIterable to ReadableStream', async () => {
    const chunks: TextStreamChunk[] = [
      { content: 'Hello', isComplete: false },
      { content: ' world', isComplete: true },
    ];

    async function* mockStream() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    const readableStream = toReadableStream(mockStream());
    expect(readableStream).toBeInstanceOf(ReadableStream);

    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
    }

    expect(result).toContain('Hello');
    expect(result).toContain('world');
  });
});

describe('parseSSEStream', () => {
  it('should parse Server-Sent Events stream', async () => {
    const sseData = `data: ${JSON.stringify({ content: 'Hello', isComplete: false })}\n\ndata: ${JSON.stringify({ content: ' world', isComplete: true })}\n\n`;

    const mockResponse = new Response(sseData, {
      headers: { 'Content-Type': 'text/event-stream' },
    });

    const chunks: TextStreamChunk[] = [];
    for await (const _chunk of parseSSEStream(mockResponse)) {
      chunks.push(_chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.content).toBe('Hello');
    expect(chunks[0]?.isComplete).toBe(false);
    expect(chunks[1]?.content).toBe(' world');
    expect(chunks[1]?.isComplete).toBe(true);
  });

  it('should handle malformed SSE data gracefully', async () => {
    const sseData = `data: ${JSON.stringify({ content: 'Valid', isComplete: false })}\n\ndata: invalid json\n\ndata: ${JSON.stringify({ content: 'Also valid', isComplete: true })}\n\n`;

    const mockResponse = new Response(sseData, {
      headers: { 'Content-Type': 'text/event-stream' },
    });

    const chunks: TextStreamChunk[] = [];
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    for await (const _chunk of parseSSEStream(mockResponse)) {
      chunks.push(_chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.content).toBe('Valid');
    expect(chunks[1]?.content).toBe('Also valid');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should throw error if response body is null', async () => {
    const mockResponse = new Response(null);

    await expect(async () => {
      for await (const _chunk of parseSSEStream(mockResponse)) {
        // Should not reach here
      }
    }).rejects.toThrow('Response body is null');
  });
});
