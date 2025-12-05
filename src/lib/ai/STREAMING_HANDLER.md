# Streaming Response Handler

The Streaming Response Handler provides a robust solution for handling streaming AI responses with comprehensive error handling, cancellation support, and progress tracking.

## Features

- **Chunk Aggregation**: Automatically aggregates streaming chunks into complete content
- **Progress Tracking**: Real-time progress updates with token estimation
- **Error Handling**: Graceful handling of timeouts, interruptions, and errors
- **Cancellation Support**: Ability to cancel streams mid-flight
- **Buffer Management**: Prevents memory issues with configurable buffer limits
- **SSE Support**: Built-in Server-Sent Events parsing and generation

## Basic Usage

### Simple Aggregation

```typescript
import { aggregateStream } from '@/lib/ai';
import { OpenAITextGenerationService } from '@/lib/ai/providers';

const service = new OpenAITextGenerationService('gpt-4o-mini');
const stream = service.streamCompletion('Tell me a story');

// Get the complete content
const content = await aggregateStream(stream);
console.log(content);
```

### With Progress Tracking

```typescript
import { StreamingHandler } from '@/lib/ai';

const handler = new StreamingHandler({
  onChunk: (chunk) => {
    console.log('Received:', chunk);
  },
  onProgress: (progress) => {
    console.log(`Progress: ${progress.chunksReceived} chunks`);
    console.log(`Estimated tokens: ${progress.estimatedTokens}`);
  },
  onComplete: (result) => {
    console.log('Completed:', result.content);
    console.log('Total time:', result.totalTime, 'ms');
  },
  onError: (error) => {
    console.error('Error:', error.message);
    if (error.partialContent) {
      console.log('Partial content:', error.partialContent);
    }
  },
});

const stream = service.streamCompletion('Write an essay');
const result = await handler.processStream(stream);
```

### With Cancellation

```typescript
const handler = new StreamingHandler({
  onChunk: (chunk) => {
    console.log('Chunk:', chunk);
  },
});

const stream = service.streamCompletion('Long generation...');

// Cancel after 5 seconds
setTimeout(() => {
  handler.cancel();
}, 5000);

try {
  await handler.processStream(stream);
} catch (error) {
  console.log('Cancelled. Partial:', handler.getAggregatedContent());
}
```

## HTTP Streaming (API Routes)

### Server-Side (Next.js API Route)

```typescript
import { toReadableStream } from '@/lib/ai';
import { OpenAITextGenerationService } from '@/lib/ai/providers';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const service = new OpenAITextGenerationService('gpt-4o-mini');
  const stream = service.streamCompletion(prompt);

  // Convert to HTTP streaming response
  const readableStream = toReadableStream(stream);

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### Client-Side (Consuming SSE)

```typescript
import { parseSSEStream } from '@/lib/ai';

async function streamFromAPI(prompt: string) {
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  let fullContent = '';

  for await (const chunk of parseSSEStream(response)) {
    fullContent += chunk.content;
    console.log('Received:', chunk.content);

    if (chunk.isComplete) {
      console.log('Metadata:', chunk.metadata);
      break;
    }
  }

  return fullContent;
}
```

## Configuration Options

### StreamingHandlerOptions

```typescript
interface StreamingHandlerOptions {
  // Callback for each chunk received
  onChunk?: (chunk: string) => void;

  // Callback for progress updates
  onProgress?: (progress: StreamProgress) => void;

  // Callback when stream completes
  onComplete?: (result: StreamResult) => void;

  // Callback for errors
  onError?: (error: StreamError) => void;

  // Timeout in milliseconds for stream inactivity (default: 30000)
  timeout?: number;

  // Maximum number of chunks to buffer (default: 10000)
  maxBufferSize?: number;
}
```

### StreamProgress

```typescript
interface StreamProgress {
  chunksReceived: number; // Number of chunks received so far
  totalContent: string; // Aggregated content
  estimatedTokens: number; // Estimated token count
  elapsedTime: number; // Time elapsed in milliseconds
}
```

### StreamResult

```typescript
interface StreamResult {
  content: string; // Complete aggregated content
  metadata?: ResponseMetadata; // Final metadata from provider
  chunksReceived: number; // Total chunks received
  totalTime: number; // Total time in milliseconds
}
```

### StreamError

```typescript
interface StreamError {
  code: 'TIMEOUT' | 'INTERRUPTED' | 'CANCELLED' | 'BUFFER_OVERFLOW' | 'UNKNOWN';
  message: string;
  partialContent?: string; // Content received before error
  chunksReceived?: number; // Chunks received before error
}
```

## Error Handling

### Timeout Handling

```typescript
const handler = new StreamingHandler({
  timeout: 10000, // 10 second timeout
  onError: (error) => {
    if (error.code === 'TIMEOUT') {
      console.log('Stream timed out');
      console.log('Partial content:', error.partialContent);
    }
  },
});
```

### Retry Logic

```typescript
async function streamWithRetry(prompt: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const handler = new StreamingHandler({
        timeout: 30000,
      });

      const stream = service.streamCompletion(prompt);
      return await handler.processStream(stream);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

### Buffer Overflow Protection

```typescript
const handler = new StreamingHandler({
  maxBufferSize: 1000, // Limit to 1000 chunks
  onError: (error) => {
    if (error.code === 'BUFFER_OVERFLOW') {
      console.error('Too many chunks received');
    }
  },
});
```

## Advanced Usage

### Custom Chunk Processing

````typescript
const codeBlocks: string[] = [];
let currentBlock = '';
let inCodeBlock = false;

const handler = new StreamingHandler({
  onChunk: (chunk) => {
    currentBlock += chunk;

    if (chunk.includes('```')) {
      if (inCodeBlock) {
        codeBlocks.push(currentBlock);
        currentBlock = '';
      }
      inCodeBlock = !inCodeBlock;
    }
  },
});

await handler.processStream(stream);
console.log('Extracted code blocks:', codeBlocks);
````

### Multiple Concurrent Streams

```typescript
const prompts = ['Question 1', 'Question 2', 'Question 3'];

const results = await Promise.all(
  prompts.map(async (prompt) => {
    const handler = new StreamingHandler();
    const stream = service.streamCompletion(prompt);
    return handler.processStream(stream);
  })
);
```

### UI Integration (React)

```typescript
function StreamingChat() {
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(0);
  const handlerRef = useRef<StreamingHandler>();

  const startStream = async (prompt: string) => {
    const handler = new StreamingHandler({
      onChunk: (chunk) => {
        setContent(prev => prev + chunk);
      },
      onProgress: (progress) => {
        const percentage = Math.min(
          (progress.estimatedTokens / 1000) * 100,
          99
        );
        setProgress(percentage);
      },
      onComplete: () => {
        setProgress(100);
      },
    });

    handlerRef.current = handler;

    const stream = service.streamCompletion(prompt);
    await handler.processStream(stream);
  };

  const cancelStream = () => {
    handlerRef.current?.cancel();
  };

  return (
    <div>
      <div>{content}</div>
      <progress value={progress} max={100} />
      <button onClick={cancelStream}>Cancel</button>
    </div>
  );
}
```

## Best Practices

1. **Always handle errors**: Use the `onError` callback to handle stream failures gracefully
2. **Set appropriate timeouts**: Configure timeouts based on expected generation time
3. **Monitor buffer size**: For long-running streams, monitor buffer usage
4. **Clean up resources**: Cancel streams when components unmount or users navigate away
5. **Provide feedback**: Use progress callbacks to show users that generation is happening
6. **Handle partial content**: Save partial content on errors for better UX
7. **Test edge cases**: Test timeout, cancellation, and error scenarios

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 2.2**: Streaming responses for text generation
- **Requirement 12.1**: Send partial responses as they arrive
- **Requirement 12.2**: Handle connection drops gracefully
- **Requirement 12.3**: Send final message with metadata
- **Requirement 12.4**: Fall back to non-streaming on failure
- **Requirement 12.5**: Handle user cancellation and deduct partial credits

## See Also

- [AI Services Documentation](./README.md)
- [Provider Implementations](./providers/README.md)
- [Usage Examples](./examples/streaming-handler-usage.ts)
