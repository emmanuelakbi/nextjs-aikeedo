/**
 * Next.js Instrumentation Hook
 * This file is automatically called when the Next.js server starts
 * Use it for initialization tasks like environment validation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeApp } = await import('./src/lib/init');
    initializeApp();
  }
}
