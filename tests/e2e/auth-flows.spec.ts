import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

/**
 * End-to-End Tests for Authentication Flows
 *
 * Requirements: 3.1, 4.1, 5.1
 *
 * Tests:
 * - Complete registration flow
 * - Complete login flow
 * - Password reset flow
 */

const prisma = new PrismaClient();

// Helper function to generate unique email
function generateEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

// Helper function to clean up test user
async function cleanupUser(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
      await prisma.workspace.deleteMany({ where: { ownerId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

test.describe('Registration Flow', () => {
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = generateEmail();
  });

  test.afterEach(async () => {
    await cleanupUser(testEmail);
  });

  test('should complete full registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register/);
    await expect(
      page.getByRole('heading', { name: /create your account/i })
    ).toBeVisible();

    // Fill in registration form
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to verification request page
    await expect(page).toHaveURL(/.*verify-request/);
    await expect(page.getByText(/check your email/i)).toBeVisible();

    // Verify user was created in database
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeTruthy();
    expect(user?.firstName).toBe('John');
    expect(user?.lastName).toBe('Doe');
    expect(user?.emailVerified).toBeNull();

    // Verify verification token was created
    const token = await prisma.verificationToken.findFirst({
      where: { identifier: testEmail, type: 'EMAIL_VERIFICATION' },
    });
    expect(token).toBeTruthy();
  });

  test('should show validation errors for invalid registration data', async ({
    page,
  }) => {
    await page.goto('/register');

    // Try to submit with empty fields
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
    await expect(page.getByText(/first name is required/i)).toBeVisible();

    // Try with weak password
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await page.getByLabel(/confirm password/i).fill('weak');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password strength error
    await expect(
      page.getByText(/password must be at least 8 characters/i)
    ).toBeVisible();
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // Create a user first
    const passwordHash = await hash('TestPassword123!', 12);
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Existing',
        lastName: 'User',
        language: 'en',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // Try to register with same email
    await page.goto('/register');
    await page.getByLabel(/first name/i).fill('John');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('TestPassword123!');
    await page.getByLabel(/confirm password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error message
    await expect(page.getByText(/email already exists/i)).toBeVisible();
  });
});

test.describe('Login Flow', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123!';

  test.beforeEach(async () => {
    testEmail = generateEmail();

    // Create a verified user
    const passwordHash = await hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: new Date(),
        language: 'en',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // Create default workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Personal',
        ownerId: user.id,
        creditCount: 0,
        allocatedCredits: 0,
        isTrialed: false,
      },
    });

    // Update user with current workspace
    await prisma.user.update({
      where: { id: user.id },
      data: { currentWorkspaceId: workspace.id },
    });
  });

  test.afterEach(async () => {
    await cleanupUser(testEmail);
  });

  test('should complete full login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    await expect(
      page.getByRole('heading', { name: /sign in to your account/i })
    ).toBeVisible();

    // Fill in login form
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should see dashboard content
    await expect(page.getByText(/dashboard/i)).toBeVisible();

    // Verify session was created
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const session = await prisma.session.findFirst({
      where: { userId: user!.id },
    });
    expect(session).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try with wrong password
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('WrongPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit with empty fields
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should persist session across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});

test.describe('Password Reset Flow', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123!';

  test.beforeEach(async () => {
    testEmail = generateEmail();

    // Create a verified user
    const passwordHash = await hash(testPassword, 12);
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: new Date(),
        language: 'en',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
  });

  test.afterEach(async () => {
    await cleanupUser(testEmail);
  });

  test('should complete password reset request flow', async ({ page }) => {
    // Navigate to password reset request page
    await page.goto('/auth/request-reset');
    await expect(
      page.getByRole('heading', { name: /reset your password/i })
    ).toBeVisible();

    // Fill in email
    await page.getByLabel(/email address/i).fill(testEmail);

    // Submit form
    await page.getByRole('button', { name: /send reset link/i }).click();

    // Should show success message
    await expect(page.getByText(/check your email/i)).toBeVisible();

    // Verify reset token was created
    const token = await prisma.verificationToken.findFirst({
      where: { identifier: testEmail, type: 'PASSWORD_RESET' },
    });
    expect(token).toBeTruthy();
  });

  test('should complete full password reset flow', async ({ page }) => {
    // Create a reset token
    const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await prisma.verificationToken.create({
      data: {
        identifier: testEmail,
        token: resetToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'PASSWORD_RESET',
      },
    });

    // Navigate to reset password page with token
    await page.goto(`/auth/reset-password?token=${resetToken}`);
    await expect(
      page.getByRole('heading', { name: /set new password/i })
    ).toBeVisible();

    // Fill in new password
    const newPassword = 'NewPassword123!';
    await page.getByLabel('New Password', { exact: true }).fill(newPassword);
    await page.getByLabel(/confirm password/i).fill(newPassword);

    // Submit form
    await page.getByRole('button', { name: /reset password/i }).click();

    // Should redirect to login with success message
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByText(/password reset successful/i)).toBeVisible();

    // Verify can login with new password
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(newPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Verify old sessions were invalidated
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    const oldSessions = await prisma.session.findMany({
      where: {
        userId: user!.id,
        createdAt: { lt: new Date(Date.now() - 1000) }, // Sessions created before reset
      },
    });
    expect(oldSessions.length).toBe(0);
  });

  test('should reject expired reset token', async ({ page }) => {
    // Create an expired reset token
    const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await prisma.verificationToken.create({
      data: {
        identifier: testEmail,
        token: resetToken,
        expires: new Date(Date.now() - 1000), // Expired
        type: 'PASSWORD_RESET',
      },
    });

    // Navigate to reset password page with expired token
    await page.goto(`/auth/reset-password?token=${resetToken}`);

    // Try to reset password
    await page
      .getByLabel('New Password', { exact: true })
      .fill('NewPassword123!');
    await page.getByLabel(/confirm password/i).fill('NewPassword123!');
    await page.getByRole('button', { name: /reset password/i }).click();

    // Should show error message
    await expect(page.getByText(/token has expired/i)).toBeVisible();
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
