/**
 * Application Configuration
 *
 * Centralized configuration system for the entire application.
 * All configurable values should be defined here to avoid hard-coding.
 *
 * This file serves as the single source of truth for:
 * - Feature flags
 * - Business rules
 * - Service limits
 * - Pricing models
 * - UI settings
 * - Integration settings
 */

import type { ImageSize } from '@/lib/ai/types';

/**
 * Feature Flags
 * Enable/disable features without code changes
 */
export const features = {
  // Core features
  authentication: true,
  workspaces: true,
  billing: true,

  // AI services
  textGeneration: true,
  imageGeneration: true,
  speechSynthesis: true,
  transcription: true,
  voiceCloning: true,

  // Business features
  affiliateProgram: true,
  subscriptions: true,
  oneTimePurchases: true,
  trialPeriod: true,

  // Admin features
  adminDashboard: true,
  userImpersonation: true,
  auditLogging: true,
  contentModeration: true,

  // Advanced features
  fileUpload: true,
  documentManagement: true,
  presets: true,
  usageAnalytics: true,
} as const;

/**
 * AI Provider Configuration
 * Configure which providers are available and their priority
 */
export const aiProviders = {
  // Available providers (set to false to disable)
  openai: true,
  anthropic: true,
  google: true,
  mistral: true,
  openrouter: true,

  // Fallback order when primary provider fails
  fallbackOrder: ['openai', 'anthropic', 'google', 'mistral'] as const,

  // Default provider for each service type
  defaults: {
    text: 'openai',
    image: 'openai',
    speech: 'openai',
    transcription: 'openai',
  },
} as const;

/**
 * Credit System Configuration
 * Define how credits are calculated and consumed
 */
export const credits = {
  // Text generation rates (credits per 1000 tokens)
  text: {
    // OpenAI models
    'gpt-4': 30,
    'gpt-4-turbo': 20,
    'gpt-4o': 15,
    'gpt-3.5-turbo': 2,

    // Anthropic models
    'claude-3-opus': 30,
    'claude-3-sonnet': 15,
    'claude-3-haiku': 5,
    'claude-3-5-sonnet': 15,

    // Google models
    'gemini-pro': 10,
    'gemini-1.5-pro': 15,
    'gemini-1.5-flash': 5,

    // Mistral models
    'mistral-large': 20,
    'mistral-medium': 10,
    'mistral-small': 5,

    // Default fallback
    default: 10,
  } as Record<string, number>,

  // Image generation rates (credits per image)
  image: {
    '256x256': 10,
    '512x512': 20,
    '1024x1024': 40,
    '1792x1024': 60,
    '1024x1792': 60,
  } as Record<ImageSize, number>,

  // Speech synthesis (credits per 1000 characters)
  speech: 5,

  // Transcription (credits per minute)
  transcription: 3,

  // Minimum credit balance to use services
  minimumBalance: 1,

  // Free trial credits for new users
  trialCredits: 100,
} as const;

/**
 * Subscription Plans Configuration
 * Define available subscription tiers and their benefits
 */
export const subscriptionPlans = {
  free: {
    name: 'Free',
    monthlyCredits: 0,
    price: 0,
    features: ['Basic AI access', 'Limited usage'],
  },
  starter: {
    name: 'Starter',
    monthlyCredits: 1000,
    price: 9.99,
    features: ['1,000 credits/month', 'All AI models', 'Email support'],
  },
  pro: {
    name: 'Pro',
    monthlyCredits: 5000,
    price: 29.99,
    features: ['5,000 credits/month', 'Priority access', 'Advanced features'],
  },
  business: {
    name: 'Business',
    monthlyCredits: 20000,
    price: 99.99,
    features: ['20,000 credits/month', 'Team features', 'Priority support'],
  },
} as const;

/**
 * Affiliate Program Configuration
 * Define commission rates and payout rules
 */
export const affiliate = {
  // Commission rates (percentage)
  commissionRate: 0.2, // 20%

  // Minimum payout amount
  minimumPayout: 50,

  // Cookie duration (days)
  cookieDuration: 30,

  // Commission duration (days after signup)
  commissionDuration: 365,

  // Payout methods
  payoutMethods: ['paypal', 'bank_transfer', 'stripe'] as const,
} as const;

/**
 * Rate Limiting Configuration
 * Define rate limits for different operations
 */
export const rateLimits = {
  // API endpoints (requests per minute)
  api: {
    default: 60,
    ai: 20,
    upload: 10,
    auth: 5,
  },

  // AI operations (per hour)
  aiOperations: {
    text: 100,
    image: 50,
    speech: 50,
    transcription: 20,
  },

  // File uploads
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'text/plain',
    ],
  },
} as const;

/**
 * Circuit Breaker Configuration
 * Prevent cascading failures
 */
export const circuitBreaker = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  monitoringPeriod: 120000, // 2 minutes
} as const;

/**
 * Retry Configuration
 * Automatic retry for failed operations
 */
export const retry = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  timeout: 60000, // 60 seconds
} as const;

/**
 * Session Configuration
 */
export const session = {
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  updateAge: 24 * 60 * 60, // Update session every 24 hours
} as const;

/**
 * Security Configuration
 */
export const security = {
  bcryptRounds: 12,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,

  // CSRF protection
  csrfEnabled: true,

  // Content Security Policy
  cspEnabled: true,
} as const;

/**
 * Email Configuration
 */
export const email = {
  // Email templates
  templates: {
    welcome: 'welcome',
    verification: 'verification',
    passwordReset: 'password-reset',
    invoice: 'invoice',
    payoutRequest: 'payout-request',
  },

  // Email sending limits
  rateLimit: {
    perHour: 100,
    perDay: 1000,
  },
} as const;

/**
 * Pagination Configuration
 */
export const pagination = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100] as const,
} as const;

/**
 * Cache Configuration
 */
export const cache = {
  // Cache TTL (seconds)
  ttl: {
    session: 3600, // 1 hour
    user: 300, // 5 minutes
    workspace: 300, // 5 minutes
    usage: 60, // 1 minute
  },

  // Enable/disable caching
  enabled: true,
} as const;

/**
 * Audit Logging Configuration
 */
export const auditLog = {
  // Events to log
  events: {
    auth: true,
    billing: true,
    admin: true,
    aiUsage: true,
    fileUpload: true,
  },

  // Retention period (days)
  retentionDays: 90,
} as const;

/**
 * Content Moderation Configuration
 */
export const moderation = {
  // Auto-moderation enabled
  enabled: true,

  // Moderation providers
  providers: ['openai'] as const,

  // Actions on flagged content
  autoBlock: false,
  requireReview: true,
} as const;

/**
 * UI Configuration
 */
export const ui = {
  // Theme
  theme: {
    defaultMode: 'light' as 'light' | 'dark' | 'system',
    allowToggle: true,
  },

  // Branding
  branding: {
    appName: 'AIKEEDO',
    tagline: 'AI Services Platform',
    logo: '/logo.png',
    favicon: '/favicon.ico',
  },

  // Toast notifications
  toast: {
    duration: 5000, // 5 seconds
    position: 'bottom-right' as const,
  },
} as const;

/**
 * Development Configuration
 */
export const development = {
  // Enable debug mode
  debug: process.env.NODE_ENV === 'development',

  // Mock external services
  mockServices: false,

  // Seed database on startup
  autoSeed: false,
} as const;

/**
 * Export all configuration
 */
export const appConfig = {
  features,
  aiProviders,
  credits,
  subscriptionPlans,
  affiliate,
  rateLimits,
  circuitBreaker,
  retry,
  session,
  security,
  email,
  pagination,
  cache,
  auditLog,
  moderation,
  ui,
  development,
} as const;

export type AppConfig = typeof appConfig;
