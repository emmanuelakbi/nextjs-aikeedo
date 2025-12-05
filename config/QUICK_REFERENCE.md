# Configuration Quick Reference

## 🚀 Quick Start

```bash
# 1. View configuration
npm run config:view

# 2. Create custom config
npm run config:init

# 3. Edit config/custom.config.ts
# 4. Validate
npm run config:validate

# 5. Restart
npm run dev
```

## 📋 Common Tasks

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
credits: {
  text: { 'gpt-4': 20 },
  trialCredits: 500,
}
```

### Adjust Rate Limits
```typescript
rateLimits: {
  api: { default: 120 },
}
```

### Customize Branding
```typescript
ui: {
  branding: {
    appName: 'My Platform',
  },
}
```

### Change Affiliate Commission
```typescript
affiliate: {
  commissionRate: 0.15,  // 15%
}
```

## 🛠️ CLI Commands

| Command | Description |
|---------|-------------|
| `npm run config:view` | View all configuration |
| `npm run config:view credits` | View specific section |
| `npm run config:validate` | Validate configuration |
| `npm run config:init` | Create custom config |
| `npm run config:diff` | Show differences |
| `npm run find:hardcoded` | Find hard-coded values |

## 📁 File Structure

```
config/
├── app.config.ts           # Default (don't edit)
├── custom.config.ts        # Your overrides (edit this)
├── config-loader.ts        # Loader (don't edit)
└── env/
    ├── development.config.ts
    ├── production.config.ts
    └── test.config.ts
```

## 🔧 Configuration Sections

| Section | What It Controls |
|---------|------------------|
| `features` | Enable/disable features |
| `aiProviders` | AI provider settings |
| `credits` | Pricing for AI operations |
| `subscriptionPlans` | Subscription tiers |
| `affiliate` | Affiliate program settings |
| `rateLimits` | API rate limits |
| `circuitBreaker` | Failure handling |
| `retry` | Retry logic |
| `session` | Session management |
| `security` | Security settings |
| `email` | Email configuration |
| `pagination` | Pagination defaults |
| `cache` | Cache TTL settings |
| `auditLog` | Audit logging |
| `moderation` | Content moderation |
| `ui` | Branding and UI |
| `development` | Dev settings |

## 💡 Usage in Code

```typescript
// Import
import { config } from '@/config/config-loader';

// Use
const credits = config.credits.trialCredits;
const rate = config.affiliate.commissionRate;
const limit = config.rateLimits.api.default;

// Check feature
import { isFeatureEnabled } from '@/config/config-loader';
if (isFeatureEnabled('affiliateProgram')) {
  // ...
}

// Get specific value
import { getConfigValue } from '@/config/config-loader';
const value = getConfigValue<number>('credits.text.gpt-4');
```

## 🎯 Priority Order

1. Default config (`app.config.ts`)
2. Environment config (`env/{NODE_ENV}.config.ts`)
3. Custom config (`custom.config.ts`)
4. Environment variables

Later overrides earlier.

## ⚠️ Important

- ✅ Edit `custom.config.ts` for customizations
- ❌ Don't edit `app.config.ts` directly
- ✅ Validate after changes: `npm run config:validate`
- ✅ Restart server after changes
- ❌ Don't commit `custom.config.ts` (gitignored)

## 📚 Full Documentation

- **Complete Guide**: `docs/CONFIGURATION.md`
- **Examples**: `config/custom.config.example.ts`
- **System Overview**: `CONFIGURATION_SYSTEM.md`
- **Config README**: `config/README.md`

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Changes not working | Restart server |
| Type errors | Check types in `app.config.ts` |
| Validation fails | Run `npm run config:validate` |
| Can't find config | Check file exists: `config/custom.config.ts` |

## 🔍 Find Hard-Coded Values

```bash
npm run find:hardcoded
```

This scans your codebase for values that should be in configuration.

## 📝 Example: Complete Customization

```typescript
// config/custom.config.ts
export const customConfig = {
  // Disable features
  features: {
    voiceCloning: false,
    affiliateProgram: false,
  },
  
  // Adjust pricing
  credits: {
    text: {
      'gpt-4': 20,
      'gpt-3.5-turbo': 1,
    },
    trialCredits: 500,
  },
  
  // Customize plans
  subscriptionPlans: {
    starter: {
      monthlyCredits: 2000,
      price: 14.99,
    },
  },
  
  // Adjust limits
  rateLimits: {
    api: {
      default: 120,
    },
  },
  
  // Customize branding
  ui: {
    branding: {
      appName: 'My AI Platform',
      tagline: 'Custom Tagline',
    },
  },
};
```

## 🎓 Best Practices

1. Always use configuration, never hard-code
2. Validate after changes
3. Test in development first
4. Document your customizations
5. Use TypeScript types
6. Keep custom.config.ts clean and organized

---

**Need Help?** Run `npm run config:help` or check `docs/CONFIGURATION.md`
