import { test, expect } from '@playwright/test';

/**
 * Example E2E Test
 *
 * This is a placeholder test to verify Playwright is configured correctly.
 * Replace with actual e2e tests as per the implementation plan.
 */

test.describe('Example E2E Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads
    await expect(page).toHaveTitle(/AIKEEDO/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Look for login link or button
    const loginLink = page.getByRole('link', { name: /login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
