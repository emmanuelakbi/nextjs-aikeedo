/**
 * Application logger with context support
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { isDevelopment, isProduction } from '../config';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry structure
 */
export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
};

/**
 * Logger class for structured logging
 */
class Logger {
  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (isDevelopment) {
      // Pretty format for development
      const contextStr = entry.context
        ? `\n${JSON.stringify(entry.context, null, 2)}`
        : '';
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;
    }

    // JSON format for production (easier to parse by log aggregators)
    return JSON.stringify(entry);
  }

  /**
   * Write log entry to console
   */
  private write(entry: LogEntry): void {
    const formatted = this.formatLog(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (!isProduction) {
      this.write(this.createEntry(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.write(this.createEntry(LogLevel.INFO, message, context));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.write(this.createEntry(LogLevel.WARN, message, context));
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.write(this.createEntry(LogLevel.ERROR, message, context));
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();
