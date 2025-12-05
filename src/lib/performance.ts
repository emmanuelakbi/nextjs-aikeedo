/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for monitoring and optimizing performance:
 * - Query timing
 * - Component render timing
 * - Memory usage tracking
 *
 * Requirements: Performance considerations
 */

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `[Performance] ${name} failed after ${duration.toFixed(2)}ms:`,
      error
    );
    throw error;
  }
}

/**
 * Measure execution time of a sync function
 */
export function measure<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();

  try {
    const result = fn();
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `[Performance] ${name} failed after ${duration.toFixed(2)}ms:`,
      error
    );
    throw error;
  }
}

/**
 * Create a performance timer
 */
export function createTimer(name: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }

      return duration;
    },
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize function results for performance
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  } as T;
}

/**
 * Batch multiple operations to execute together
 */
export class OperationBatcher<T, R> {
  private queue: Array<{
    input: T;
    resolve: (value: R) => void;
    reject: (error: any) => void;
  }> = [];

  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    private batchFn: (inputs: T[]) => Promise<R[]>,
    private delay: number = 10
  ) {}

  async add(input: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ input, resolve, reject });

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = setTimeout(() => {
        this.flush();
      }, this.delay);
    });
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);
    const inputs = batch.map((item) => item.input);

    try {
      const results = await this.batchFn(inputs);

      batch.forEach((item, index) => {
        const result = results[index];
        if (result !== undefined) {
          item.resolve(result);
        } else {
          item.reject(new Error('Result not found for input'));
        }
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error);
      });
    }
  }
}

/**
 * Memory usage tracker (Node.js only)
 */
export function getMemoryUsage() {
  if (typeof process === 'undefined') {
    return null;
  }

  const usage = process.memoryUsage();

  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
  };
}

/**
 * Log memory usage
 */
export function logMemoryUsage(label: string = 'Memory Usage') {
  const usage = getMemoryUsage();

  if (usage && process.env.NODE_ENV === 'development') {
    console.log(`[${label}]`, {
      heapUsed: `${usage.heapUsed}MB`,
      heapTotal: `${usage.heapTotal}MB`,
      external: `${usage.external}MB`,
      rss: `${usage.rss}MB`,
    });
  }
}
