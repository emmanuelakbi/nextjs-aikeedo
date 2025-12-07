import { z } from 'zod';

/**
 * Environment variable schema definition
 * This schema validates all required and optional environment variables
 * and provides type-safe access throughout the application
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL'),

  // NextAuth Configuration
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z
    .string()
    .min(1, 'NEXTAUTH_URL is required')
    .url('NEXTAUTH_URL must be a valid URL'),

  // Email (SMTP) Configuration - Optional for deployment
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required').optional(),
  SMTP_PORT: z
    .string()
    .regex(/^\d+$/, 'SMTP_PORT must be a number')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 65535, {
      message: 'SMTP_PORT must be between 1 and 65535',
    })
    .optional(),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required').optional(),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required').optional(),
  SMTP_FROM: z
    .string()
    .min(1, 'SMTP_FROM is required')
    .email('SMTP_FROM must be a valid email address')
    .optional(),

  // Optional: Redis for caching
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),

  // Optional: Error tracking
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),

  // Optional: Rate limiting
  RATE_LIMIT_REDIS_URL: z
    .string()
    .url('RATE_LIMIT_REDIS_URL must be a valid URL')
    .optional(),

  // AI Provider API Keys
  OPENAI_API_KEY: z
    .string()
    .min(1, 'OPENAI_API_KEY is required for OpenAI services')
    .optional(),
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, 'ANTHROPIC_API_KEY is required for Anthropic services')
    .optional(),
  GOOGLE_AI_API_KEY: z
    .string()
    .min(1, 'GOOGLE_AI_API_KEY is required for Google AI services')
    .optional(),
  MISTRAL_API_KEY: z
    .string()
    .min(1, 'MISTRAL_API_KEY is required for Mistral AI services')
    .optional(),
  OPENROUTER_API_KEY: z
    .string()
    .min(1, 'OPENROUTER_API_KEY is required for OpenRouter services')
    .optional(),

  // Stripe Configuration
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required for payment processing')
    .optional(),
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'STRIPE_PUBLISHABLE_KEY is required for client-side Stripe')
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required for webhook verification')
    .optional(),

  // Session Configuration
  SESSION_MAX_AGE: z
    .string()
    .regex(/^\d+$/, 'SESSION_MAX_AGE must be a number')
    .default('2592000') // 30 days in seconds
    .transform((val) => parseInt(val, 10)),

  // Security
  BCRYPT_ROUNDS: z
    .string()
    .regex(/^\d+$/, 'BCRYPT_ROUNDS must be a number')
    .default('12')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 10 && val <= 15, {
      message: 'BCRYPT_ROUNDS must be between 10 and 15',
    }),

  // Application URL (for email links)
  APP_URL: z
    .string()
    .min(1, 'APP_URL is required')
    .url('APP_URL must be a valid URL')
    .optional()
    .transform((val) => val ?? process.env.NEXTAUTH_URL),

  // File Storage Configuration (S3/R2)
  STORAGE_PROVIDER: z
    .enum(['s3', 'r2', 'local'])
    .default('local')
    .describe('Storage provider: s3, r2, or local'),
  STORAGE_REGION: z
    .string()
    .default('us-east-1')
    .describe('S3/R2 region (e.g., us-east-1 for S3, auto for R2)'),
  STORAGE_BUCKET: z
    .string()
    .default('aikeedo-uploads')
    .describe('S3/R2 bucket name'),
  STORAGE_ACCESS_KEY_ID: z
    .string()
    .min(1, 'STORAGE_ACCESS_KEY_ID is required for S3/R2')
    .optional(),
  STORAGE_SECRET_ACCESS_KEY: z
    .string()
    .min(1, 'STORAGE_SECRET_ACCESS_KEY is required for S3/R2')
    .optional(),
  STORAGE_ENDPOINT: z
    .string()
    .url('STORAGE_ENDPOINT must be a valid URL')
    .optional()
    .describe('S3/R2 endpoint URL (required for R2)'),
  STORAGE_PUBLIC_URL: z
    .string()
    .url('STORAGE_PUBLIC_URL must be a valid URL')
    .optional()
    .describe('Public URL for accessing files (CDN URL or bucket URL)'),
  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .describe('Force path style for S3 (required for R2 and MinIO)'),
});

/**
 * Parsed and validated environment variables
 * This type is inferred from the Zod schema
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed configuration
 * Throws an error if validation fails with detailed error messages
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err: z.ZodIssue) => {
          const path = err.path.join('.');
          return `  - ${path}: ${err.message}`;
        })
        .join('\n');

      console.error('❌ Environment validation failed:\n');
      console.error(errorMessages);
      console.error(
        '\n💡 Please check your .env file and ensure all required variables are set correctly.'
      );

      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 * This is a singleton that validates on first access
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  cachedEnv ??= validateEnv();
  return cachedEnv;
}

/**
 * Type-safe environment variable access
 * Use this throughout the application instead of process.env
 */
export const env = getEnv();

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';
