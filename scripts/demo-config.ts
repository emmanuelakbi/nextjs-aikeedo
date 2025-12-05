#!/usr/bin/env tsx
/**
 * Configuration System Demo
 * 
 * Demonstrates the configuration system capabilities
 */

import { appConfig } from '../config/app.config';

console.log('\n🎯 Configuration System Demo\n');
console.log('═'.repeat(60));

// Show sections
console.log('\n📦 Configuration Sections (' + Object.keys(appConfig).length + ' total):\n');
Object.keys(appConfig).forEach((key, index) => {
  console.log(`  ${index + 1}. ${key}`);
});

// Show features
console.log('\n✨ Feature Flags:\n');
const features = Object.entries(appConfig.features).slice(0, 8);
features.forEach(([key, value]) => {
  const icon = value ? '✅' : '❌';
  console.log(`  ${icon} ${key}: ${value}`);
});
console.log(`  ... and ${Object.keys(appConfig.features).length - 8} more`);

// Show credit rates
console.log('\n💰 Credit Rates (sample):\n');
console.log('  Text Generation:');
console.log(`    - GPT-4: ${appConfig.credits.text['gpt-4']} credits/1K tokens`);
console.log(`    - GPT-3.5 Turbo: ${appConfig.credits.text['gpt-3.5-turbo']} credits/1K tokens`);
console.log(`    - Claude 3 Opus: ${appConfig.credits.text['claude-3-opus']} credits/1K tokens`);
console.log('\n  Image Generation:');
console.log(`    - 1024x1024: ${appConfig.credits.image['1024x1024']} credits`);
console.log(`    - 512x512: ${appConfig.credits.image['512x512']} credits`);
console.log('\n  Other Services:');
console.log(`    - Speech: ${appConfig.credits.speech} credits/1K chars`);
console.log(`    - Transcription: ${appConfig.credits.transcription} credits/minute`);
console.log(`    - Trial Credits: ${appConfig.credits.trialCredits} credits`);

// Show subscription plans
console.log('\n📋 Subscription Plans:\n');
Object.entries(appConfig.subscriptionPlans).forEach(([key, plan]) => {
  console.log(`  ${plan.name}:`);
  console.log(`    - Price: $${plan.price}/month`);
  console.log(`    - Credits: ${plan.monthlyCredits.toLocaleString()}`);
});

// Show affiliate settings
console.log('\n🤝 Affiliate Program:\n');
console.log(`  - Commission Rate: ${appConfig.affiliate.commissionRate * 100}%`);
console.log(`  - Minimum Payout: $${appConfig.affiliate.minimumPayout}`);
console.log(`  - Cookie Duration: ${appConfig.affiliate.cookieDuration} days`);
console.log(`  - Commission Duration: ${appConfig.affiliate.commissionDuration} days`);

// Show rate limits
console.log('\n⚡ Rate Limits:\n');
console.log('  API (requests/minute):');
console.log(`    - Default: ${appConfig.rateLimits.api.default}`);
console.log(`    - AI: ${appConfig.rateLimits.api.ai}`);
console.log(`    - Upload: ${appConfig.rateLimits.api.upload}`);
console.log(`    - Auth: ${appConfig.rateLimits.api.auth}`);

// Show branding
console.log('\n🎨 Branding:\n');
console.log(`  - App Name: ${appConfig.ui.branding.appName}`);
console.log(`  - Tagline: ${appConfig.ui.branding.tagline}`);
console.log(`  - Logo: ${appConfig.ui.branding.logo}`);
console.log(`  - Theme: ${appConfig.ui.theme.defaultMode}`);

// Show security
console.log('\n🔒 Security:\n');
console.log(`  - Bcrypt Rounds: ${appConfig.security.bcryptRounds}`);
console.log(`  - Min Password Length: ${appConfig.security.passwordMinLength}`);
console.log(`  - CSRF Enabled: ${appConfig.security.csrfEnabled}`);

console.log('\n' + '═'.repeat(60));
console.log('\n✅ Configuration system is working perfectly!\n');
console.log('💡 To customize:');
console.log('   1. Run: npm run config:init');
console.log('   2. Edit: config/custom.config.ts');
console.log('   3. Restart: npm run dev\n');
console.log('📚 Documentation: docs/CONFIGURATION.md\n');
