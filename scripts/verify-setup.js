#!/usr/bin/env node

/**
 * Verification script to ensure all core dependencies and configurations are properly set up
 */

const fs = require('fs');
const path = require('path');

const checks = {
  passed: [],
  failed: [],
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    checks.passed.push(`✓ ${description}`);
    return true;
  } else {
    checks.failed.push(`✗ ${description}`);
    return false;
  }
}

function checkDependency(packageName, description) {
  try {
    require.resolve(packageName);
    checks.passed.push(`✓ ${description}`);
    return true;
  } catch (e) {
    checks.failed.push(`✗ ${description}`);
    return false;
  }
}

console.log('🔍 Verifying Next.js Foundation Setup...\n');

// Check configuration files
console.log('Configuration Files:');
checkFile('package.json', 'package.json exists');
checkFile('tsconfig.json', 'TypeScript configuration exists');
checkFile('next.config.mjs', 'Next.js configuration exists');
checkFile('tailwind.config.ts', 'Tailwind CSS configuration exists');
checkFile('.eslintrc.json', 'ESLint configuration exists');
checkFile('.prettierrc.json', 'Prettier configuration exists');
checkFile('.env.example', 'Environment example file exists');

console.log('\nCore Dependencies:');
checkDependency('next', 'Next.js 14');
checkDependency('react', 'React');
checkDependency('typescript', 'TypeScript');
checkDependency('tailwindcss', 'Tailwind CSS');
checkDependency('@prisma/client', 'Prisma Client');
checkDependency('next-auth', 'NextAuth.js');
checkDependency('zod', 'Zod validation');
checkDependency('bcrypt', 'bcrypt password hashing');

console.log('\nDevelopment Tools:');
checkDependency('eslint', 'ESLint');
checkDependency('prettier', 'Prettier');
checkDependency('@typescript-eslint/eslint-plugin', 'TypeScript ESLint plugin');

console.log('\nApp Router Structure:');
checkFile('app/layout.tsx', 'Root layout exists');
checkFile('app/page.tsx', 'Home page exists');
checkFile('app/globals.css', 'Global styles exist');

console.log('\n' + '='.repeat(50));
console.log(`\n✅ Passed: ${checks.passed.length}`);
console.log(`❌ Failed: ${checks.failed.length}\n`);

if (checks.failed.length > 0) {
  console.log('Failed checks:');
  checks.failed.forEach((check) => console.log(`  ${check}`));
  process.exit(1);
} else {
  console.log('🎉 All checks passed! Setup is complete.\n');
  console.log('Next steps:');
  console.log('  1. Copy .env.example to .env and configure');
  console.log('  2. Set up your PostgreSQL database');
  console.log('  3. Run: npm run db:generate');
  console.log('  4. Run: npm run db:migrate');
  console.log('  5. Run: npm run dev\n');
  process.exit(0);
}
