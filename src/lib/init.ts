/**
 * Application initialization
 * This module handles startup validation and configuration
 */

import { env, isDevelopment } from './env';

/**
 * Initialize the application
 * Validates environment variables and performs startup checks
 */
export function initializeApp(): void {
  try {
    // Validate environment variables
    // This will throw if validation fails
    const validatedEnv = env;

    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log('✅ Environment validation passed');
      // eslint-disable-next-line no-console
      console.log('📝 Configuration loaded:');
      // eslint-disable-next-line no-console
      console.log(`   - NODE_ENV: ${validatedEnv.NODE_ENV}`);
      // eslint-disable-next-line no-console
      console.log(
        `   - Database: ${maskConnectionString(validatedEnv.DATABASE_URL)}`
      );
      // eslint-disable-next-line no-console
      console.log(`   - SMTP Host: ${validatedEnv.SMTP_HOST}`);
      // eslint-disable-next-line no-console
      console.log(`   - SMTP Port: ${validatedEnv.SMTP_PORT}`);
      // eslint-disable-next-line no-console
      console.log(`   - Session Max Age: ${validatedEnv.SESSION_MAX_AGE}s`);
      // eslint-disable-next-line no-console
      console.log(`   - Bcrypt Rounds: ${validatedEnv.BCRYPT_ROUNDS}`);

      if (validatedEnv.REDIS_URL) {
        // eslint-disable-next-line no-console
        console.log(
          `   - Redis: ${maskConnectionString(validatedEnv.REDIS_URL)}`
        );
      }

      if (validatedEnv.SENTRY_DSN) {
        // eslint-disable-next-line no-console
        console.log('   - Sentry: Enabled');
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Application initialization failed');
    throw error;
  }
}

/**
 * Masks sensitive parts of connection strings for logging
 */
function maskConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.password) {
      url.password = '****';
    }
    if (url.username) {
      url.username = url.username.substring(0, 3) + '***';
    }
    return url.toString();
  } catch {
    // If parsing fails, just mask the middle part
    const length = connectionString.length;
    if (length <= 20) {
      return '****';
    }
    return (
      connectionString.substring(0, 10) +
      '****' +
      connectionString.substring(length - 10)
    );
  }
}
