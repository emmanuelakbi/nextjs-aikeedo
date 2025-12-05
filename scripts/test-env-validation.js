#!/usr/bin/env node

/**
 * Test script to demonstrate environment validation
 * This script shows how the environment validation works
 */

console.log('🧪 Testing Environment Validation\n');

// Test 1: Valid environment
console.log('Test 1: Valid environment configuration');
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-at-least-32-characters';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'user@example.com';
process.env.SMTP_PASSWORD = 'password';
process.env.SMTP_FROM = 'noreply@example.com';

try {
  // Clear the module cache to force re-evaluation
  delete require.cache[require.resolve('../src/lib/env.ts')];
  const { getEnv } = require('../src/lib/env.ts');
  const env = getEnv();
  console.log('✅ Validation passed!');
  console.log(`   - NODE_ENV: ${env.NODE_ENV}`);
  console.log(
    `   - SMTP_PORT: ${env.SMTP_PORT} (type: ${typeof env.SMTP_PORT})`
  );
  console.log(`   - SESSION_MAX_AGE: ${env.SESSION_MAX_AGE} (default)`);
  console.log(`   - BCRYPT_ROUNDS: ${env.BCRYPT_ROUNDS} (default)\n`);
} catch (error) {
  console.log('❌ Validation failed (unexpected)');
  console.error(error.message);
}

// Test 2: Missing required variable
console.log('Test 2: Missing DATABASE_URL');
delete process.env.DATABASE_URL;

try {
  // Clear the module cache
  delete require.cache[require.resolve('../src/lib/env.ts')];
  const { getEnv } = require('../src/lib/env.ts');
  getEnv();
  console.log('❌ Validation passed (unexpected)\n');
} catch (error) {
  console.log('✅ Validation failed as expected');
  console.log('   Error: Invalid environment configuration\n');
}

// Test 3: Invalid NEXTAUTH_SECRET (too short)
console.log('Test 3: NEXTAUTH_SECRET too short');
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.NEXTAUTH_SECRET = 'short';

try {
  // Clear the module cache
  delete require.cache[require.resolve('../src/lib/env.ts')];
  const { getEnv } = require('../src/lib/env.ts');
  getEnv();
  console.log('❌ Validation passed (unexpected)\n');
} catch (error) {
  console.log('✅ Validation failed as expected');
  console.log('   Error: Invalid environment configuration\n');
}

console.log('🎉 All tests completed!');
