/**
 * Circuit Breaker Pattern Implementation
 * Requirements: 11.1, 11.2
 *
 * Prevents cascading failures by temporarily disabling failing services
 */

import { logger } from '../errors/logger';
import { CircuitBreakerOpenError } from './errors';
import type { AIProvider } from './types';

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Circuit is open, requests fail immediately
  HALF_OPEN = 'half_open', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time to wait before trying half-open (ms)
  monitoringPeriod: number; // Time window for counting failures (ms)
}

/**
 * Load default circuit breaker configuration from centralized config
 */
function loadDefaultCircuitConfig(): CircuitBreakerConfig {
  try {
    const { config } = require('../../../config/config-loader');
    return {
      failureThreshold: config.circuitBreaker.failureThreshold,
      successThreshold: config.circuitBreaker.successThreshold,
      timeout: config.circuitBreaker.timeout,
      monitoringPeriod: config.circuitBreaker.monitoringPeriod,
    };
  } catch {
    // Fallback if config not available
    return {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      monitoringPeriod: 120000,
    };
  }
}

export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig =
  loadDefaultCircuitConfig();

interface CircuitMetrics {
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  state: CircuitState;
  nextAttemptTime: number;
}

/**
 * Circuit Breaker for AI services
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private metrics: Map<AIProvider, CircuitMetrics>;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
    this.metrics = new Map();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, provider: AIProvider): Promise<T> {
    const metrics = this.getMetrics(provider);

    // Check if circuit is open
    if (metrics.state === CircuitState.OPEN) {
      const now = Date.now();

      // Check if timeout has passed to try half-open
      if (now >= metrics.nextAttemptTime) {
        this.transitionToHalfOpen(provider);
      } else {
        logger.warn('Circuit breaker is open', {
          provider,
          nextAttemptTime: new Date(metrics.nextAttemptTime).toISOString(),
        });
        throw new CircuitBreakerOpenError(provider, {
          nextAttemptTime: metrics.nextAttemptTime,
          state: metrics.state,
        });
      }
    }

    try {
      const result = await fn();
      this.recordSuccess(provider);
      return result;
    } catch (error) {
      this.recordFailure(provider);
      throw error;
    }
  }

  /**
   * Get or initialize metrics for a provider
   */
  private getMetrics(provider: AIProvider): CircuitMetrics {
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, {
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        state: CircuitState.CLOSED,
        nextAttemptTime: 0,
      });
    }
    return this.metrics.get(provider)!;
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(provider: AIProvider): void {
    const metrics = this.getMetrics(provider);
    const now = Date.now();

    metrics.successes++;
    metrics.lastSuccessTime = now;

    // If in half-open state, check if we can close the circuit
    if (metrics.state === CircuitState.HALF_OPEN) {
      if (metrics.successes >= this.config.successThreshold) {
        this.transitionToClosed(provider);
      }
    } else if (metrics.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      metrics.failures = 0;
    }

    logger.debug('Circuit breaker recorded success', {
      provider,
      state: metrics.state,
      successes: metrics.successes,
      failures: metrics.failures,
    });
  }

  /**
   * Record a failed operation
   */
  private recordFailure(provider: AIProvider): void {
    const metrics = this.getMetrics(provider);
    const now = Date.now();

    // Clean up old failures outside monitoring period
    if (now - metrics.lastFailureTime > this.config.monitoringPeriod) {
      metrics.failures = 0;
    }

    metrics.failures++;
    metrics.lastFailureTime = now;

    logger.warn('Circuit breaker recorded failure', {
      provider,
      state: metrics.state,
      failures: metrics.failures,
      threshold: this.config.failureThreshold,
    });

    // If in half-open state, immediately open on failure
    if (metrics.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen(provider);
      return;
    }

    // Check if we should open the circuit
    if (
      metrics.state === CircuitState.CLOSED &&
      metrics.failures >= this.config.failureThreshold
    ) {
      this.transitionToOpen(provider);
    }
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(provider: AIProvider): void {
    const metrics = this.getMetrics(provider);
    const now = Date.now();

    metrics.state = CircuitState.OPEN;
    metrics.nextAttemptTime = now + this.config.timeout;
    metrics.successes = 0;

    logger.error('Circuit breaker opened', {
      provider,
      failures: metrics.failures,
      nextAttemptTime: new Date(metrics.nextAttemptTime).toISOString(),
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(provider: AIProvider): void {
    const metrics = this.getMetrics(provider);

    metrics.state = CircuitState.HALF_OPEN;
    metrics.successes = 0;
    metrics.failures = 0;

    logger.info('Circuit breaker half-open', {
      provider,
      successThreshold: this.config.successThreshold,
    });
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(provider: AIProvider): void {
    const metrics = this.getMetrics(provider);

    metrics.state = CircuitState.CLOSED;
    metrics.failures = 0;
    metrics.successes = 0;

    logger.info('Circuit breaker closed', {
      provider,
    });
  }

  /**
   * Get current state for a provider
   */
  getState(provider: AIProvider): CircuitState {
    return this.getMetrics(provider).state;
  }

  /**
   * Get metrics for a provider
   */
  getProviderMetrics(provider: AIProvider): Readonly<CircuitMetrics> {
    return { ...this.getMetrics(provider) };
  }

  /**
   * Reset circuit breaker for a provider
   */
  reset(provider: AIProvider): void {
    this.metrics.delete(provider);
    logger.info('Circuit breaker reset', { provider });
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.metrics.clear();
    logger.info('All circuit breakers reset');
  }
}

/**
 * Global circuit breaker instance
 */
export const globalCircuitBreaker = new CircuitBreaker();
