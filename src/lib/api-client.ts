/**
 * Optimized API Client
 *
 * Provides optimized API fetching with:
 * - Request deduplication
 * - Automatic retries
 * - Request batching
 * - Error handling
 *
 * Requirements: Performance considerations
 */

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request deduplication cache
 * Prevents duplicate requests for the same resource
 */
const requestCache = new Map<string, Promise<any>>();

/**
 * Fetch with deduplication
 * Multiple calls to the same URL will share the same request
 */
export async function fetchWithDedup<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const cacheKey = `${options?.method || 'GET'}:${url}`;

  // Check if request is already in flight
  const cachedRequest = requestCache.get(cacheKey);
  if (cachedRequest) {
    return cachedRequest;
  }

  // Create new request
  const request = fetch(url, options)
    .then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || 'Request failed',
          response.status,
          error
        );
      }
      return response.json();
    })
    .finally(() => {
      // Remove from cache after completion
      requestCache.delete(cacheKey);
    });

  // Cache the request
  requestCache.set(cacheKey, request);

  return request;
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit & {
    retries?: number;
    retryDelay?: number;
    retryOn?: (error: ApiError) => boolean;
  }
): Promise<T> {
  const {
    retries = 3,
    retryDelay = 1000,
    retryOn = (error: ApiError) => error.status >= 500,
    ...fetchOptions
  } = options || {};

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithDedup<T>(url, fetchOptions);
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt === retries) {
        break;
      }

      // Check if we should retry
      if (error instanceof ApiError && !retryOn(error)) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * API client with optimized fetching
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return fetchWithRetry<T>(url, {
      ...options,
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return fetchWithRetry<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    return fetchWithRetry<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return fetchWithRetry<T>(url, {
      ...options,
      method: 'DELETE',
    });
  },
};

/**
 * Batch API requests
 * Combines multiple requests into a single batch request
 */
export class RequestBatcher {
  private queue: Array<{
    url: string;
    options?: RequestInit;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private timeoutId: NodeJS.Timeout | null = null;
  private batchDelay: number;

  constructor(batchDelay: number = 10) {
    this.batchDelay = batchDelay;
  }

  /**
   * Add a request to the batch
   */
  async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });

      // Schedule batch execution
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = setTimeout(() => {
        this.executeBatch();
      }, this.batchDelay);
    });
  }

  /**
   * Execute all queued requests
   */
  private async executeBatch(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0);

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      batch.map(({ url, options }) => fetchWithDedup(url, options))
    );

    // Resolve/reject individual promises
    results.forEach((result, index) => {
      const item = batch[index];
      if (!item) return;

      const { resolve, reject } = item;

      if (result.status === 'fulfilled') {
        resolve(result.value);
      } else {
        reject(result.reason);
      }
    });
  }
}

/**
 * Create a request batcher
 */
export function createRequestBatcher(batchDelay?: number): RequestBatcher {
  return new RequestBatcher(batchDelay);
}

/**
 * Parallel request executor
 * Executes multiple requests in parallel with concurrency limit
 */
export async function fetchParallel<T>(
  requests: Array<() => Promise<T>>,
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const request of requests) {
    const promise = request().then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
