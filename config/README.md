# Configuration System

This directory contains the centralized configuration system for the application. All configurable values are defined here to avoid hard-coding throughout the codebase.

## Structure

```
config/
├── app.config.ts              # Default configuration
├── config-loader.ts           # Configuration loader with merge logic
├── custom.config.example.ts   # Example custom configuration
├── custom.config.ts           # Your custom overrides (gitignored)
├── env/
│   ├── development.config.ts  # Development environment overrides
│   ├── production.config.ts   # Production environment overrides
│   └── test.config.ts         # Test environment overrides
└── README.md                  # This file
```

## Configuration Priority

Configuration is loaded and merged in this order (later overrides earlier):

1. **Default Configuration** (`app.config.ts`)
2. **Environment-Specific Config** (`env/{NODE_ENV}.config.ts`)
3. **Custom Configuration** (`custom.config.ts`)
4. **Environment Variables** (specific overrides)

## Usage

### Basic Usage

```typescript
import { config } from '@/config/config-loader';

// Access configuration values
const trialCredits = config.credits.trialCredits;
const commissionRate = config.affiliate.commissionRate;
const isFeatureEnabled = config.features.affiliateProgram;
```

### Check Feature Flags

```typescript
import { isFeatureEnabled } from '@/config/config-loader';

if (isFeatureEnabled('affiliateProgram')) {
  // Feature is enabled
}
```

### Get Specific Values

```typescript
import { getConfigValue } from '@/config/config-loader';

const gpt4Rate = getConfigValue<number>('credits.text.gpt-4');
const appName = getConfigValue<string>('ui.branding.appName');
```

## Customization Methods

### Method 1: Custom Configuration File (Recommended)

Create a `custom.config.ts` file for your overrides:

```bash
cp config/custom.config.example.ts config/custom.config.ts
```

Edit `custom.config.ts`:

```typescript
export const customConfig = {
  credits: {
    text: {
      'gpt-4': 25, // Override GPT-4 rate
    },
    trialCredits: 200, // Give new users 200 credits
  },

  affiliate: {
    commissionRate: 0.15, // 15% commission
  },

  ui: {
    branding: {
      appName: 'My AI Platform',
      tagline: 'Custom Tagline',
    },
  },
};
```

### Method 2: Environment Variables

Set environment variables to override specific values:

```bash
# .env or .env.local
FEATURE_AFFILIATE=false
CREDIT_TRIAL_AMOUNT=500
AFFILIATE_COMMISSION_RATE=0.25
RATE_LIMIT_API=120
APP_NAME="My Custom Platform"
```

### Method 3: Environment-Specific Files

Edit files in `config/env/` for environment-specific overrides:

- `development.config.ts` - Development environment
- `production.config.ts` - Production environment
- `test.config.ts` - Test environment

## Configuration Categories

### Features

Enable/disable features without code changes:

```typescript
config.features = {
  authentication: true,
  workspaces: true,
  billing: true,
  textGeneration: true,
  imageGeneration: true,
  affiliateProgram: true,
  // ... more features
};
```

### AI Providers

Configure available AI providers and their priority:

```typescript
config.aiProviders = {
  openai: true,
  anthropic: true,
  fallbackOrder: ['openai', 'anthropic', 'google'],
  defaults: {
    text: 'openai',
    image: 'openai',
  },
};
```

### Credits

Define credit rates for all AI operations:

```typescript
config.credits = {
  text: {
    'gpt-4': 30,
    'claude-3-opus': 30,
    // ... per model
  },
  image: {
    '1024x1024': 40,
    // ... per size
  },
  speech: 5, // per 1000 chars
  transcription: 3, // per minute
};
```

### Subscription Plans

Define subscription tiers:

```typescript
config.subscriptionPlans = {
  starter: {
    name: 'Starter',
    monthlyCredits: 1000,
    price: 9.99,
    features: ['...'],
  },
  // ... more plans
};
```

### Affiliate Program

Configure affiliate settings:

```typescript
config.affiliate = {
  commissionRate: 0.2, // 20%
  minimumPayout: 50,
  cookieDuration: 30, // days
};
```

### Rate Limits

Define rate limits for operations:

```typescript
config.rateLimits = {
  api: {
    default: 60, // requests per minute
    ai: 20,
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', '...'],
  },
};
```

### Security

Configure security settings:

```typescript
config.security = {
  bcryptRounds: 12,
  passwordMinLength: 8,
  csrfEnabled: true,
};
```

### UI

Customize the user interface:

```typescript
config.ui = {
  branding: {
    appName: 'AIKEEDO',
    tagline: 'AI Services Platform',
    logo: '/logo.png',
  },
  theme: {
    defaultMode: 'light',
    allowToggle: true,
  },
};
```

## Best Practices

1. **Never hard-code values** - Always use configuration
2. **Use custom.config.ts** - Don't modify core config files
3. **Document changes** - Add comments explaining why you changed values
4. **Test thoroughly** - Test your changes in development first
5. **Version control** - Commit environment configs, not custom.config.ts
6. **Type safety** - TypeScript ensures you only set valid config values

## Examples

### Disable a Feature

```typescript
// custom.config.ts
export const customConfig = {
  features: {
    voiceCloning: false,
  },
};
```

### Change Credit Rates

```typescript
// custom.config.ts
export const customConfig = {
  credits: {
    text: {
      'gpt-4': 20, // Reduce from 30 to 20
      'gpt-3.5-turbo': 1, // Reduce from 2 to 1
    },
  },
};
```

### Add Custom Subscription Plan

```typescript
// custom.config.ts
export const customConfig = {
  subscriptionPlans: {
    enterprise: {
      name: 'Enterprise',
      monthlyCredits: 100000,
      price: 499.99,
      features: ['Unlimited access', 'Dedicated support'],
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
      default: 120, // Increase from 60 to 120
      ai: 40, // Increase from 20 to 40
    },
  },
};
```

## Migration Guide

If you have hard-coded values in your codebase:

### Before (Hard-coded)

```typescript
const TRIAL_CREDITS = 100;
const COMMISSION_RATE = 0.2;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
```

### After (Configurable)

```typescript
import { config } from '@/config/config-loader';

const trialCredits = config.credits.trialCredits;
const commissionRate = config.affiliate.commissionRate;
const maxFileSize = config.rateLimits.upload.maxFileSize;
```

## Troubleshooting

### Configuration not loading

1. Check file exists: `config/custom.config.ts`
2. Check syntax: Run `npm run type-check`
3. Check imports: Ensure proper TypeScript paths
4. Restart server: Configuration is cached

### Type errors

The configuration system is fully typed. If you get type errors:

1. Check the type definition in `app.config.ts`
2. Ensure your override matches the expected type
3. Use `DeepPartial<AppConfig>` for partial overrides

### Values not updating

Configuration is cached on first load. To reload:

```typescript
import { resetConfig, getConfig } from '@/config/config-loader';

resetConfig(); // Clear cache
const config = getConfig(); // Reload
```

## Support

For questions or issues with configuration:

1. Check this README
2. Review `app.config.ts` for available options
3. Check `custom.config.example.ts` for examples
4. Review environment-specific configs in `config/env/`
