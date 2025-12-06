# Configuration Guide

This guide explains how to customize and configure the AIKEEDO platform without modifying core code.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration System](#configuration-system)
- [Customization Methods](#customization-methods)
- [Common Customizations](#common-customizations)
- [Advanced Configuration](#advanced-configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The platform uses a centralized configuration system that allows you to:

- Enable/disable features without code changes
- Customize pricing and credit rates
- Adjust rate limits and security settings
- Configure AI providers and fallback behavior
- Customize branding and UI elements
- Set environment-specific overrides

**Key Principle**: Never hard-code values. Always use configuration.

## Quick Start

### 1. View Current Configuration

```bash
# View all configuration
npm run config:view

# View specific section
npm run config:view credits
npm run config:view features
npm run config:view affiliate
```

### 2. Create Custom Configuration

```bash
# Initialize custom config from example
npm run config:init

# Edit the file
nano config/custom.config.ts
```

### 3. Validate Configuration

```bash
# Validate your changes
npm run config:validate

# See what you've changed
npm run config:diff
```

### 4. Restart Application

```bash
npm run dev
```

## Configuration System

### Architecture

```
┌─────────────────────────────────────────┐
│  1. Default Config (app.config.ts)     │
│     ↓                                   │
│  2. Environment Config (env/*.ts)      │
│     ↓                                   │
│  3. Custom Config (custom.config.ts)   │
│     ↓                                   │
│  4. Environment Variables              │
│     ↓                                   │
│  Final Merged Configuration            │
└─────────────────────────────────────────┘
```

### File Structure

```
config/
├── app.config.ts              # Default configuration
├── config-loader.ts           # Configuration loader
├── custom.config.ts           # Your customizations (gitignored)
├── custom.config.example.ts   # Example template
├── env/
│   ├── development.config.ts  # Dev overrides
│   ├── production.config.ts   # Prod overrides
│   └── test.config.ts         # Test overrides
└── README.md                  # Configuration docs
```

## Customization Methods

### Method 1: Custom Configuration File (Recommended)

**Best for**: Permanent customizations, multiple related changes

```bash
# Create custom config
npm run config:init
```

Edit `config/custom.config.ts`:

```typescript
export const customConfig = {
  // Disable features
  features: {
    voiceCloning: false,
    affiliateProgram: false,
  },

  // Customize credit rates
  credits: {
    text: {
      'gpt-4': 25, // Reduce from 30
      'gpt-3.5-turbo': 1, // Reduce from 2
    },
    trialCredits: 200, // Increase from 100
  },

  // Adjust affiliate settings
  affiliate: {
    commissionRate: 0.15, // 15% instead of 20%
    minimumPayout: 100, // Increase from 50
  },

  // Customize branding
  ui: {
    branding: {
      appName: 'My AI Platform',
      tagline: 'Your Custom Tagline',
    },
  },
};
```

### Method 2: Environment Variables

**Best for**: Deployment-specific settings, secrets

Add to `.env` or `.env.local`:

```bash
# Feature flags
FEATURE_AFFILIATE=false
FEATURE_SUBSCRIPTIONS=true

# Credit settings
CREDIT_TRIAL_AMOUNT=500

# Affiliate settings
AFFILIATE_COMMISSION_RATE=0.25

# Rate limits
RATE_LIMIT_API=120

# Branding
APP_NAME="My Custom Platform"
```

### Method 3: Environment-Specific Files

**Best for**: Different settings per environment

Edit `config/env/production.config.ts`:

```typescript
export const productionConfig = {
  rateLimits: {
    api: {
      default: 30, // Stricter in production
    },
  },

  security: {
    bcryptRounds: 13, // More secure in production
  },
};
```

## Common Customizations

### Disable Features

```typescript
// custom.config.ts
export const customConfig = {
  features: {
    voiceCloning: false,
    imageGeneration: false,
    affiliateProgram: false,
  },
};
```

### Change Credit Rates

```typescript
// custom.config.ts
export const customConfig = {
  credits: {
    // Text generation rates
    text: {
      'gpt-4': 20,
      'claude-3-opus': 25,
      default: 8,
    },

    // Image generation rates
    image: {
      '1024x1024': 30,
      '512x512': 15,
    },

    // Other services
    speech: 3,
    transcription: 2,

    // Trial credits
    trialCredits: 500,
  },
};
```

### Customize Subscription Plans

```typescript
// custom.config.ts
export const customConfig = {
  subscriptionPlans: {
    // Modify existing plan
    starter: {
      monthlyCredits: 2000,
      price: 14.99,
    },

    // Add new plan
    enterprise: {
      name: 'Enterprise',
      monthlyCredits: 100000,
      price: 499.99,
      features: [
        '100,000 credits/month',
        'Priority support',
        'Custom integrations',
      ],
    },
  },
};
```

### Adjust Rate Limits

```typescript
// custom.config.ts
export const customConfig = {
  rateLimits: {
    api: {
      default: 120, // requests per minute
      ai: 40,
      upload: 20,
    },

    upload: {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    },
  },
};
```

### Configure AI Providers

```typescript
// custom.config.ts
export const customConfig = {
  aiProviders: {
    // Disable providers
    mistral: false,
    google: false,

    // Change fallback order
    fallbackOrder: ['openai', 'anthropic'],

    // Change defaults
    defaults: {
      text: 'anthropic',
      image: 'openai',
    },
  },
};
```

### Customize Affiliate Program

```typescript
// custom.config.ts
export const customConfig = {
  affiliate: {
    commissionRate: 0.15, // 15%
    minimumPayout: 100, // $100
    cookieDuration: 60, // 60 days
    commissionDuration: 180, // 6 months
  },
};
```

### Change Security Settings

```typescript
// custom.config.ts
export const customConfig = {
  security: {
    bcryptRounds: 13,
    passwordMinLength: 10,
    passwordRequireSpecialChars: true,
    csrfEnabled: true,
  },
};
```

### Customize UI/Branding

```typescript
// custom.config.ts
export const customConfig = {
  ui: {
    branding: {
      appName: 'My AI Platform',
      tagline: 'Powered by AI',
      logo: '/custom-logo.png',
      favicon: '/custom-favicon.ico',
    },

    theme: {
      defaultMode: 'dark',
      allowToggle: true,
    },

    toast: {
      duration: 3000,
      position: 'top-right',
    },
  },
};
```

## Advanced Configuration

### Dynamic Configuration

Load configuration from external sources:

```typescript
// custom.config.ts
import { loadFromDatabase } from './loaders/database-loader';

export const customConfig = await loadFromDatabase();
```

### Feature Flags with Conditions

```typescript
// In your code
import { isFeatureEnabled } from '@/config/config-loader';

if (isFeatureEnabled('affiliateProgram')) {
  // Show affiliate dashboard
}
```

### Environment-Specific Overrides

```typescript
// config/env/production.config.ts
export const productionConfig = {
  // Stricter limits in production
  rateLimits: {
    api: { default: 30 },
  },

  // More secure in production
  security: {
    bcryptRounds: 13,
  },

  // Longer cache in production
  cache: {
    ttl: {
      session: 7200,
      user: 600,
    },
  },
};
```

### Per-Model Credit Rates

```typescript
// custom.config.ts
export const customConfig = {
  credits: {
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

      // Custom model
      'my-custom-model': 10,
    },
  },
};
```

## Best Practices

### 1. Use Custom Config for Permanent Changes

✅ **Good**: Use `custom.config.ts` for business logic changes

```typescript
// custom.config.ts
export const customConfig = {
  credits: { trialCredits: 200 },
};
```

❌ **Bad**: Modify `app.config.ts` directly

### 2. Use Environment Variables for Secrets

✅ **Good**: Store API keys in `.env`

```bash
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
```

❌ **Bad**: Hard-code secrets in config files

### 3. Validate After Changes

```bash
# Always validate after making changes
npm run config:validate

# Check what changed
npm run config:diff
```

### 4. Document Your Changes

```typescript
// custom.config.ts
export const customConfig = {
  // Reduced rates for promotional period (Q1 2024)
  credits: {
    text: {
      'gpt-4': 20, // Reduced from 30
    },
  },
};
```

### 5. Test in Development First

```bash
# Test in development
NODE_ENV=development npm run dev

# Validate
npm run config:validate

# Then deploy to production
```

### 6. Version Control

- ✅ Commit: `app.config.ts`, `env/*.config.ts`
- ✅ Commit: `custom.config.example.ts`
- ❌ Don't commit: `custom.config.ts` (gitignored)

### 7. Use Type Safety

TypeScript ensures you only set valid values:

```typescript
// ✅ Type-safe
export const customConfig = {
  credits: {
    trialCredits: 200, // number
  },
};

// ❌ Type error
export const customConfig = {
  credits: {
    trialCredits: '200', // Error: should be number
  },
};
```

## Troubleshooting

### Configuration Not Loading

**Problem**: Changes not taking effect

**Solutions**:

1. Restart the development server
2. Check file exists: `config/custom.config.ts`
3. Validate syntax: `npm run config:validate`
4. Check for TypeScript errors: `npm run type-check`

### Type Errors

**Problem**: TypeScript errors in custom config

**Solutions**:

1. Check the type in `app.config.ts`
2. Use correct type (number vs string, etc.)
3. Use `DeepPartial<AppConfig>` for partial overrides

```typescript
import type { AppConfig } from './app.config';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const customConfig: DeepPartial<AppConfig> = {
  // Your overrides
};
```

### Values Not Updating

**Problem**: Old values still being used

**Solutions**:

1. Clear cache: Delete `.next` folder
2. Restart server: `npm run dev`
3. Check merge order: Later configs override earlier ones

### Environment Variables Not Working

**Problem**: Env vars not being applied

**Solutions**:

1. Check variable name matches expected format
2. Restart server after changing `.env`
3. Check `config-loader.ts` for supported env vars

### Validation Failures

**Problem**: `npm run config:validate` fails

**Solutions**:

1. Check error message for specific issue
2. Ensure values are in valid ranges
3. Check required fields are present

```bash
# See detailed validation errors
npm run config:validate
```

## CLI Commands

```bash
# View configuration
npm run config:view              # All config
npm run config:view credits      # Specific section

# Validate configuration
npm run config:validate          # Run validation checks

# Initialize custom config
npm run config:init              # Create custom.config.ts

# Compare configurations
npm run config:diff              # Show differences from default

# Help
npm run config:help              # Show CLI help
```

## Migration from Hard-Coded Values

### Before (Hard-Coded)

```typescript
// ❌ Hard-coded in component
const TRIAL_CREDITS = 100;
const COMMISSION_RATE = 0.2;

function MyComponent() {
  const credits = TRIAL_CREDITS;
  // ...
}
```

### After (Configurable)

```typescript
// ✅ Using configuration
import { config } from '@/config/config-loader';

function MyComponent() {
  const credits = config.credits.trialCredits;
  const commission = config.affiliate.commissionRate;
  // ...
}
```

### Migration Steps

1. **Identify hard-coded values** in your codebase
2. **Add to configuration** in `app.config.ts` if not present
3. **Import and use** from config system
4. **Test thoroughly** in development
5. **Deploy** to production

## Support

For help with configuration:

1. Read this guide
2. Check `config/README.md`
3. View examples in `custom.config.example.ts`
4. Run `npm run config:help`
5. Check environment-specific configs in `config/env/`

## Examples Repository

See `config/custom.config.example.ts` for complete examples of:

- Feature toggles
- Credit rate customization
- Subscription plan modifications
- Rate limit adjustments
- UI/branding customization
- Security settings
- And more...
