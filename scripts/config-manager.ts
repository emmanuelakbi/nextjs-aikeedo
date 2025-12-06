#!/usr/bin/env ts-node
/**
 * Configuration Manager CLI
 *
 * Utility to view, validate, and manage application configuration
 *
 * Usage:
 *   npm run config:view              # View current configuration
 *   npm run config:view credits      # View specific section
 *   npm run config:validate          # Validate configuration
 *   npm run config:init              # Initialize custom config
 *   npm run config:diff              # Show differences from default
 */

import * as fs from 'fs';
import * as path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'config');
const CUSTOM_CONFIG_PATH = path.join(CONFIG_DIR, 'custom.config.ts');
const EXAMPLE_CONFIG_PATH = path.join(CONFIG_DIR, 'custom.config.example.ts');

/**
 * View configuration
 */
function viewConfig(section?: string) {
  try {
    const { config } = require('../config/config-loader');

    if (section) {
      if (section in config) {
        console.log(`\n📋 Configuration: ${section}\n`);
        console.log(JSON.stringify(config[section], null, 2));
      } else {
        console.error(`❌ Section '${section}' not found`);
        console.log('\nAvailable sections:');
        Object.keys(config).forEach((key) => console.log(`  - ${key}`));
        process.exit(1);
      }
    } else {
      console.log('\n📋 Full Configuration\n');
      console.log(JSON.stringify(config, null, 2));
    }
  } catch (error) {
    console.error('❌ Error loading configuration:', error);
    process.exit(1);
  }
}

/**
 * Validate configuration
 */
function validateConfig() {
  console.log('🔍 Validating configuration...\n');

  try {
    const { config } = require('../config/config-loader');

    const checks = [
      {
        name: 'Credit rates are positive',
        test: () => {
          const rates = Object.values(config.credits.text);
          return rates.every(
            (rate: any) => typeof rate === 'number' && rate > 0
          );
        },
      },
      {
        name: 'Commission rate is valid (0-1)',
        test: () => {
          const rate = config.affiliate.commissionRate;
          return rate >= 0 && rate <= 1;
        },
      },
      {
        name: 'Rate limits are positive',
        test: () => {
          const limits = Object.values(config.rateLimits.api);
          return limits.every(
            (limit: any) => typeof limit === 'number' && limit > 0
          );
        },
      },
      {
        name: 'Session max age is positive',
        test: () => config.session.maxAge > 0,
      },
      {
        name: 'Bcrypt rounds in valid range (10-15)',
        test: () => {
          const rounds = config.security.bcryptRounds;
          return rounds >= 10 && rounds <= 15;
        },
      },
    ];

    let passed = 0;
    let failed = 0;

    checks.forEach((check) => {
      try {
        if (check.test()) {
          console.log(`✅ ${check.name}`);
          passed++;
        } else {
          console.log(`❌ ${check.name}`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${check.name} - Error: ${error}`);
        failed++;
      }
    });

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed > 0) {
      console.error('❌ Configuration validation failed');
      process.exit(1);
    } else {
      console.log('✅ Configuration is valid');
    }
  } catch (error) {
    console.error('❌ Error validating configuration:', error);
    process.exit(1);
  }
}

/**
 * Initialize custom configuration
 */
function initConfig() {
  if (fs.existsSync(CUSTOM_CONFIG_PATH)) {
    console.log('⚠️  custom.config.ts already exists');
    console.log('   Delete it first if you want to reinitialize');
    process.exit(1);
  }

  try {
    fs.copyFileSync(EXAMPLE_CONFIG_PATH, CUSTOM_CONFIG_PATH);
    console.log('✅ Created custom.config.ts from example');
    console.log(
      '   Edit config/custom.config.ts to customize your configuration'
    );
  } catch (error) {
    console.error('❌ Error creating custom config:', error);
    process.exit(1);
  }
}

/**
 * Show differences from default
 */
function showDiff() {
  try {
    const { appConfig } = require('../config/app.config');
    const { config } = require('../config/config-loader');

    console.log('🔍 Configuration differences from default:\n');

    const differences: string[] = [];

    function findDifferences(obj1: any, obj2: any, path: string = '') {
      for (const key in obj2) {
        const newPath = path ? `${path}.${key}` : key;

        if (
          typeof obj2[key] === 'object' &&
          !Array.isArray(obj2[key]) &&
          obj2[key] !== null
        ) {
          if (obj1[key]) {
            findDifferences(obj1[key], obj2[key], newPath);
          }
        } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
          differences.push(
            `  ${newPath}:\n    Default: ${JSON.stringify(obj1[key])}\n    Current: ${JSON.stringify(obj2[key])}`
          );
        }
      }
    }

    findDifferences(appConfig, config);

    if (differences.length === 0) {
      console.log('  No differences found - using default configuration');
    } else {
      console.log(differences.join('\n\n'));
      console.log(`\n📊 Total differences: ${differences.length}`);
    }
  } catch (error) {
    console.error('❌ Error comparing configurations:', error);
    process.exit(1);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Configuration Manager CLI

Usage:
  npm run config:view [section]    View current configuration
  npm run config:validate           Validate configuration
  npm run config:init               Initialize custom config
  npm run config:diff               Show differences from default
  npm run config:help               Show this help

Examples:
  npm run config:view               # View all configuration
  npm run config:view credits       # View credits configuration
  npm run config:view features      # View feature flags
  npm run config:validate           # Validate configuration
  npm run config:init               # Create custom.config.ts
  npm run config:diff               # Show what's been customized

Available sections:
  - features
  - aiProviders
  - credits
  - subscriptionPlans
  - affiliate
  - rateLimits
  - circuitBreaker
  - retry
  - session
  - security
  - email
  - pagination
  - cache
  - auditLog
  - moderation
  - ui
  - development
`);
}

/**
 * Main CLI handler
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'view':
      viewConfig(args[1]);
      break;
    case 'validate':
      validateConfig();
      break;
    case 'init':
      initConfig();
      break;
    case 'diff':
      showDiff();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.error(`❌ Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

main();
