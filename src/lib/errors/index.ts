/**
 * Error handling and logging exports
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  type ErrorResponse,
} from './base';

export { handleApiError, withErrorHandler } from './handler';

export { logger, LogLevel, type LogEntry } from './logger';
