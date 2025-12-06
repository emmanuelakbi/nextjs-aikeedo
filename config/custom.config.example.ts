/**
 * Custom Configuration Example
 *
 * Copy this file to custom.config.ts and modify as needed.
 * This file is ignored by git and allows you to customize
 * the application without modifying core configuration files.
 *
 * Usage:
 * 1. Copy: cp config/custom.config.example.ts config/custom.config.ts
 * 2. Edit config/custom.config.ts with your custom values
 * 3. Restart the application
 */

import type { AppConfig } from './app.config';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const customConfig: DeepPartial<AppConfig> = {
  // Example: Disable specific features
  // features: {
  //   affiliateProgram: false,
  //   voiceCloning: false,
  // },
  // Example: Customize credit rates
  // credits: {
  //   text: {
  //     'gpt-4': 25,
  //     'gpt-3.5-turbo': 1,
  //   },
  //   trialCredits: 200,
  // },
  // Example: Customize subscription plans
  // subscriptionPlans: {
  //   starter: {
  //     monthlyCredits: 2000,
  //     price: 14.99,
  //   },
  // },
  // Example: Customize affiliate settings
  // affiliate: {
  //   commissionRate: 0.15, // 15%
  //   minimumPayout: 100,
  // },
  // Example: Customize rate limits
  // rateLimits: {
  //   api: {
  //     default: 120,
  //     ai: 30,
  //   },
  // },
  // Example: Customize UI branding
  // ui: {
  //   branding: {
  //     appName: 'My AI Platform',
  //     tagline: 'Your Custom Tagline',
  //   },
  // },
};

export default customConfig;
