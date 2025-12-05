// Vitest setup file
// This file runs before all tests
import { config } from 'dotenv';
import { resolve } from 'path';
import { afterAll } from 'vitest';

// Load .env file from the project root
config({ path: resolve(__dirname, '.env') });

// Ensure DATABASE_URL is set for tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://aikeedo:password@localhost:5433/aikeedo_dev';
}

// Set other required environment variables for tests
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test';
}
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'test-secret-key-at-least-32-characters-long-for-development';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Email configuration for tests (use console transport)
process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost';
process.env.SMTP_PORT = process.env.SMTP_PORT || '1025';
process.env.SMTP_USER = process.env.SMTP_USER || 'test';
process.env.SMTP_PASSWORD = process.env.SMTP_PASSWORD || 'test';
process.env.SMTP_FROM = process.env.SMTP_FROM || 'test@example.com';

// Global cleanup after all tests
afterAll(async () => {
  // Disconnect Prisma client to prevent hanging
  try {
    const { prisma } = await import('./src/lib/db');
    await prisma.$disconnect();
  } catch (error) {
    // Ignore errors during cleanup
  }
});
