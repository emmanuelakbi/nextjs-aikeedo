import { cleanupExpiredSessions } from './session-manager';
import { tokenManager } from './token-manager';

/**
 * Session and Token Cleanup Utilities
 *
 * Provides utilities for cleaning up expired sessions and tokens.
 * Requirements: 4.3, 5.2, 6.4, 6.5
 */

/**
 * Runs session cleanup and logs the results
 * This should be called periodically (e.g., via cron job or scheduled task)
 * Requirements: 6.4, 6.5
 */
export async function runSessionCleanup(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    const deletedCount = await cleanupExpiredSessions();

    console.log(`[Session Cleanup] Deleted ${deletedCount} expired sessions`);

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Session Cleanup] Failed:', errorMessage);

    return {
      success: false,
      deletedCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Runs token cleanup and logs the results
 * This should be called periodically (e.g., via cron job or scheduled task)
 * Requirements: 4.3, 5.2
 */
export async function runTokenCleanup(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    const deletedCount = await tokenManager.cleanupExpiredTokens();

    console.log(`[Token Cleanup] Deleted ${deletedCount} expired tokens`);

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[Token Cleanup] Failed:', errorMessage);

    return {
      success: false,
      deletedCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Runs both session and token cleanup
 * Requirements: 4.3, 5.2, 6.4, 6.5
 */
export async function runAllCleanup(): Promise<{
  success: boolean;
  sessionsDeleted: number;
  tokensDeleted: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let sessionsDeleted = 0;
  let tokensDeleted = 0;

  // Run session cleanup
  const sessionResult = await runSessionCleanup();
  if (sessionResult.success) {
    sessionsDeleted = sessionResult.deletedCount;
  } else if (sessionResult.error) {
    errors.push(`Session cleanup: ${sessionResult.error}`);
  }

  // Run token cleanup
  const tokenResult = await runTokenCleanup();
  if (tokenResult.success) {
    tokensDeleted = tokenResult.deletedCount;
  } else if (tokenResult.error) {
    errors.push(`Token cleanup: ${tokenResult.error}`);
  }

  return {
    success: errors.length === 0,
    sessionsDeleted,
    tokensDeleted,
    errors,
  };
}

/**
 * Creates a cleanup interval that runs periodically
 * Requirements: 6.4, 6.5
 *
 * @param intervalMs - Interval in milliseconds (default: 1 hour)
 * @returns Cleanup interval ID that can be used to stop the cleanup
 */
export function startSessionCleanupInterval(
  intervalMs: number = 60 * 60 * 1000 // 1 hour default
): NodeJS.Timeout {
  console.log(
    `[Session Cleanup] Starting cleanup interval (every ${intervalMs}ms)`
  );

  // Run immediately
  runSessionCleanup();

  // Then run periodically
  return setInterval(() => {
    runSessionCleanup();
  }, intervalMs);
}

/**
 * Creates a token cleanup interval that runs periodically
 * Requirements: 4.3, 5.2
 *
 * @param intervalMs - Interval in milliseconds (default: 1 hour)
 * @returns Cleanup interval ID that can be used to stop the cleanup
 */
export function startTokenCleanupInterval(
  intervalMs: number = 60 * 60 * 1000 // 1 hour default
): NodeJS.Timeout {
  console.log(
    `[Token Cleanup] Starting cleanup interval (every ${intervalMs}ms)`
  );

  // Run immediately
  runTokenCleanup();

  // Then run periodically
  return setInterval(() => {
    runTokenCleanup();
  }, intervalMs);
}

/**
 * Creates a combined cleanup interval for both sessions and tokens
 * Requirements: 4.3, 5.2, 6.4, 6.5
 *
 * @param intervalMs - Interval in milliseconds (default: 1 hour)
 * @returns Cleanup interval ID that can be used to stop the cleanup
 */
export function startAllCleanupInterval(
  intervalMs: number = 60 * 60 * 1000 // 1 hour default
): NodeJS.Timeout {
  console.log(
    `[Cleanup] Starting combined cleanup interval (every ${intervalMs}ms)`
  );

  // Run immediately
  runAllCleanup();

  // Then run periodically
  return setInterval(() => {
    runAllCleanup();
  }, intervalMs);
}

/**
 * Stops the cleanup interval
 */
export function stopCleanupInterval(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('[Cleanup] Stopped cleanup interval');
}
