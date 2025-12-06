/**
 * Configuration Loader
 *
 * Loads and merges configuration from multiple sources:
 * 1. Default configuration (app.config.ts)
 * 2. Environment-specific overrides (config/env/*.ts)
 * 3. Custom configuration file (config/custom.config.ts)
 * 4. Environment variables
 *
 * This allows easy customization without modifying core files.
 */

import { appConfig, type AppConfig } from './app.config';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: DeepPartial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as any;
    }
  }

  return result;
}

/**
 * Load environment-specific configuration
 */
function loadEnvConfig(): DeepPartial<AppConfig> {
  const nodeEnv = process.env.NODE_ENV || 'development';

  try {
    // Try to load environment-specific config
    const envConfig = require(`./env/${nodeEnv}.config`);
    return envConfig.default || envConfig;
  } catch {
    // No environment-specific config found
    return {};
  }
}

/**
 * Load custom configuration
 */
function loadCustomConfig(): DeepPartial<AppConfig> {
  try {
    // Try to load custom config (optional file)
    // Using dynamic require to avoid build warnings when file doesn't exist
    const customConfig = eval('require')('./custom.config');
    return customConfig.default || customConfig;
  } catch {
    // No custom config found - this is expected and OK
    return {};
  }
}

/**
 * Load configuration from environment variables
 * Maps specific env vars to config values
 */
function loadEnvVarOverrides(): DeepPartial<AppConfig> {
  const overrides: any = {};

  // Feature flags from env
  if (process.env.FEATURE_AFFILIATE === 'false') {
    if (!overrides.features) overrides.features = {};
    overrides.features.affiliateProgram = false;
  }
  if (process.env.FEATURE_SUBSCRIPTIONS === 'false') {
    if (!overrides.features) overrides.features = {};
    overrides.features.subscriptions = false;
  }

  // Credit rates from env
  if (process.env.CREDIT_TRIAL_AMOUNT) {
    if (!overrides.credits) overrides.credits = {};
    overrides.credits.trialCredits = parseInt(
      process.env.CREDIT_TRIAL_AMOUNT,
      10
    );
  }

  // Affiliate commission from env
  if (process.env.AFFILIATE_COMMISSION_RATE) {
    if (!overrides.affiliate) overrides.affiliate = {};
    overrides.affiliate.commissionRate = parseFloat(
      process.env.AFFILIATE_COMMISSION_RATE
    );
  }

  // Rate limits from env
  if (process.env.RATE_LIMIT_API) {
    if (!overrides.rateLimits) overrides.rateLimits = {};
    if (!overrides.rateLimits.api) overrides.rateLimits.api = {};
    overrides.rateLimits.api.default = parseInt(process.env.RATE_LIMIT_API, 10);
  }

  // UI branding from env
  if (process.env.APP_NAME) {
    if (!overrides.ui) overrides.ui = {};
    if (!overrides.ui.branding) overrides.ui.branding = {};
    overrides.ui.branding.appName = process.env.APP_NAME;
  }

  return overrides as DeepPartial<AppConfig>;
}

/**
 * Load and merge all configuration sources
 */
function loadConfig(): AppConfig {
  let config = { ...appConfig };

  // 1. Apply environment-specific config
  const envConfig = loadEnvConfig();
  if (Object.keys(envConfig).length > 0) {
    config = deepMerge(config, envConfig);
  }

  // 2. Apply custom config
  const customConfig = loadCustomConfig();
  if (Object.keys(customConfig).length > 0) {
    config = deepMerge(config, customConfig);
  }

  // 3. Apply environment variable overrides
  const envVarOverrides = loadEnvVarOverrides();
  if (Object.keys(envVarOverrides).length > 0) {
    config = deepMerge(config, envVarOverrides);
  }

  return config;
}

/**
 * Cached configuration instance
 */
let cachedConfig: AppConfig | null = null;

/**
 * Get the application configuration
 * Configuration is loaded once and cached
 */
export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfig(): void {
  cachedConfig = null;
}

/**
 * Get a specific configuration value by path
 * Example: getConfigValue('credits.text.gpt-4') returns 30
 */
export function getConfigValue<T = any>(path: string): T | undefined {
  const config = getConfig();
  const parts = path.split('.');
  let value: any = config;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value as T;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof AppConfig['features']
): boolean {
  const config = getConfig();
  return config.features[feature] === true;
}

/**
 * Export the loaded configuration as default
 */
export const config = getConfig();
