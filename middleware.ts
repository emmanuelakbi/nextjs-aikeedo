/**
 * Next.js Middleware
 *
 * Applies authentication middleware to protect routes.
 * Requirements: 6.1, 6.2
 */

export {
  authMiddleware as middleware,
  config,
} from './src/lib/auth/middleware';
