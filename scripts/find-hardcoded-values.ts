#!/usr/bin/env ts-node
/**
 * Find Hard-Coded Values Script
 *
 * Scans the codebase for potential hard-coded values that should be in configuration
 *
 * Usage:
 *   npm run find:hardcoded
 */

import * as fs from 'fs';
import * as path from 'path';

interface Finding {
  file: string;
  line: number;
  code: string;
  type: string;
  suggestion: string;
}

const findings: Finding[] = [];

// Patterns to detect hard-coded values
const patterns = [
  {
    regex: /const\s+\w*CREDIT\w*\s*=\s*\d+/gi,
    type: 'Credit Value',
    suggestion: 'Use config.credits instead',
  },
  {
    regex: /const\s+\w*RATE\w*\s*=\s*0\.\d+/gi,
    type: 'Rate Value',
    suggestion: 'Use config.affiliate.commissionRate or config.credits',
  },
  {
    regex: /const\s+\w*LIMIT\w*\s*=\s*\d+/gi,
    type: 'Rate Limit',
    suggestion: 'Use config.rateLimits',
  },
  {
    regex: /const\s+\w*PRICE\w*\s*=\s*\d+\.?\d*/gi,
    type: 'Price Value',
    suggestion: 'Use config.subscriptionPlans',
  },
  {
    regex: /const\s+\w*COMMISSION\w*\s*=\s*0\.\d+/gi,
    type: 'Commission Rate',
    suggestion: 'Use config.affiliate.commissionRate',
  },
  {
    regex: /const\s+\w*TIMEOUT\w*\s*=\s*\d+/gi,
    type: 'Timeout Value',
    suggestion: 'Use config.retry.timeout or config.circuitBreaker.timeout',
  },
  {
    regex: /const\s+\w*MAX_\w*\s*=\s*\d+/gi,
    type: 'Max Value',
    suggestion: 'Use appropriate config section',
  },
  {
    regex: /const\s+\w*MIN_\w*\s*=\s*\d+/gi,
    type: 'Min Value',
    suggestion: 'Use appropriate config section',
  },
];

// Directories to scan
const dirsToScan = ['src', 'app'];

// Files to exclude
const excludePatterns = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.test\./,
  /\.spec\./,
];

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath: string): boolean {
  return excludePatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Scan a file for hard-coded values
 */
function scanFile(filePath: string): void {
  if (shouldExclude(filePath)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      patterns.forEach((pattern) => {
        const matches = line.match(pattern.regex);
        if (matches) {
          findings.push({
            file: filePath,
            line: index + 1,
            code: line.trim(),
            type: pattern.type,
            suggestion: pattern.suggestion,
          });
        }
      });
    });
  } catch (error) {
    // Ignore files that can't be read
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath: string): void {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    // Ignore directories that can't be read
  }
}

/**
 * Group findings by type
 */
function groupByType(findings: Finding[]): Map<string, Finding[]> {
  const grouped = new Map<string, Finding[]>();

  findings.forEach((finding) => {
    const existing = grouped.get(finding.type) || [];
    existing.push(finding);
    grouped.set(finding.type, existing);
  });

  return grouped;
}

/**
 * Display findings
 */
function displayFindings(): void {
  if (findings.length === 0) {
    console.log('✅ No hard-coded values found!\n');
    return;
  }

  console.log(`\n🔍 Found ${findings.length} potential hard-coded values:\n`);

  const grouped = groupByType(findings);

  grouped.forEach((items, type) => {
    console.log(`\n📌 ${type} (${items.length} found)`);
    console.log('─'.repeat(60));

    items.forEach((finding) => {
      console.log(`\n  File: ${finding.file}:${finding.line}`);
      console.log(`  Code: ${finding.code}`);
      console.log(`  💡 ${finding.suggestion}`);
    });
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Summary: ${findings.length} potential issues found`);
  console.log('\n💡 Consider moving these values to config/app.config.ts\n');
}

/**
 * Main function
 */
function main(): void {
  console.log('🔍 Scanning codebase for hard-coded values...\n');

  dirsToScan.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`  Scanning ${dir}/...`);
      scanDirectory(dirPath);
    }
  });

  displayFindings();
}

main();
