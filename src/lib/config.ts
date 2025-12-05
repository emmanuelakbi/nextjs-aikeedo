/**
 * Application configuration
 * Re-exports environment variables and configuration helpers
 * Use this module to access configuration throughout the application
 */

import { env as envVars } from './env';

export { env, getEnv, isProduction, isDevelopment, isTest } from './env';
export type { Env } from './env';

/**
 * Database configuration
 */
export const dbConfig = {
  url: () => envVars.DATABASE_URL,
} as const;

/**
 * Authentication configuration
 */
export const authConfig = {
  secret: () => envVars.NEXTAUTH_SECRET,
  url: () => envVars.NEXTAUTH_URL,
  sessionMaxAge: () => envVars.SESSION_MAX_AGE,
  bcryptRounds: () => envVars.BCRYPT_ROUNDS,
} as const;

/**
 * Email configuration
 */
export const emailConfig = {
  host: () => envVars.SMTP_HOST,
  port: () => envVars.SMTP_PORT,
  user: () => envVars.SMTP_USER,
  password: () => envVars.SMTP_PASSWORD,
  from: () => envVars.SMTP_FROM,
} as const;

/**
 * Application configuration
 */
export const appConfig = {
  url: () => envVars.APP_URL ?? envVars.NEXTAUTH_URL,
  nodeEnv: () => envVars.NODE_ENV,
} as const;

/**
 * Optional services configuration
 */
export const servicesConfig = {
  redis: {
    url: () => envVars.REDIS_URL,
    isEnabled: () => !!envVars.REDIS_URL,
  },
  sentry: {
    dsn: () => envVars.SENTRY_DSN,
    isEnabled: () => !!envVars.SENTRY_DSN,
  },
  rateLimit: {
    redisUrl: () => envVars.RATE_LIMIT_REDIS_URL,
    isEnabled: () => !!envVars.RATE_LIMIT_REDIS_URL,
  },
} as const;

/**
 * File storage configuration
 */
export const storageConfig = {
  provider: () => envVars.STORAGE_PROVIDER,
  region: () => envVars.STORAGE_REGION,
  bucket: () => envVars.STORAGE_BUCKET,
  accessKeyId: () => envVars.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: () => envVars.STORAGE_SECRET_ACCESS_KEY,
  endpoint: () => envVars.STORAGE_ENDPOINT,
  publicUrl: () => envVars.STORAGE_PUBLIC_URL,
  forcePathStyle: () => envVars.STORAGE_FORCE_PATH_STYLE,
  isS3: () => envVars.STORAGE_PROVIDER === 's3',
  isR2: () => envVars.STORAGE_PROVIDER === 'r2',
  isLocal: () => envVars.STORAGE_PROVIDER === 'local',
  isCloudStorage: () =>
    envVars.STORAGE_PROVIDER === 's3' || envVars.STORAGE_PROVIDER === 'r2',
} as const;

/**
 * Stripe configuration
 */
export const stripeConfig = {
  secretKey: () => envVars.STRIPE_SECRET_KEY,
  publishableKey: () => envVars.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: () => envVars.STRIPE_WEBHOOK_SECRET,
  isEnabled: () => !!envVars.STRIPE_SECRET_KEY,
} as const;
