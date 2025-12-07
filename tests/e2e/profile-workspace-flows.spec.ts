import { test, expect, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

/**
 * End-to-End Tests for Profile and Workspace Flows
 *
 * Requirements: 7.2, 8.1, 8.3
 *
 * Tests:
 * - Profile update flow
 * - Workspace creation and switching
 */

const prisma = new PrismaClient();

// Helper function to generate unique email
function generateEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

// Helper function to create authenticated user and login
async function createAndLoginUser(
  page: Page
): Promise<{ email: string; userId: string; workspaceId: string }> {
  const email = generateEmail();
  const password = 'TestPassword123!';
  const passwordHash = await hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
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
      creditCount: 100,
      allocatedCredits: 0,
      isTrialed: false,
    },
  });

  // Update user with current workspace
  await prisma.user.update({
    where: { id: user.id },
    data: { currentWorkspaceId: workspace.id },
  });

  // Login
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

  return { email, userId: user.id, workspaceId: workspace.id };
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

test.describe('Profile Update Flow', () => {
  let testEmail: string;

  test.afterEach(async () => {
    if (testEmail) {
      await cleanupUser(testEmail);
    }
  });

  test('should update profile information', async ({ page }) => {
    const { email, userId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    // Verify current data is displayed
    await expect(page.getByLabel(/first name/i)).toHaveValue('Test');
    await expect(page.getByLabel(/last name/i)).toHaveValue('User');
    await expect(page.getByLabel(/email address/i)).toHaveValue(email);

    // Update profile information
    await page.getByLabel(/first name/i).fill('Updated');
    await page.getByLabel(/last name/i).fill('Name');
    await page.getByLabel(/phone number/i).fill('+1234567890');

    // Submit form
    await page.getByRole('button', { name: /save changes/i }).click();

    // Should show success message
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible();

    // Verify data was updated in database
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(updatedUser?.firstName).toBe('Updated');
    expect(updatedUser?.lastName).toBe('Name');
    expect(updatedUser?.phoneNumber).toBe('+1234567890');

    // Refresh page and verify changes persist
    await page.reload();
    await expect(page.getByLabel(/first name/i)).toHaveValue('Updated');
    await expect(page.getByLabel(/last name/i)).toHaveValue('Name');
    await expect(page.getByLabel(/phone number/i)).toHaveValue('+1234567890');
  });

  test('should validate profile update fields', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to profile page
    await page.goto('/profile');

    // Try to submit with invalid data
    await page.getByLabel(/first name/i).fill('');
    await page.getByLabel(/last name/i).fill('X'); // Too short
    await page.getByRole('button', { name: /save changes/i }).click();

    // Should show validation errors
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(
      page.getByText(/last name must be at least 2 characters/i)
    ).toBeVisible();
  });

  test('should not allow email change from profile form', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to profile page
    await page.goto('/profile');

    // Email field should be disabled
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeDisabled();

    // Should show helper text
    await expect(
      page.getByText(/email cannot be changed from this form/i)
    ).toBeVisible();
  });
});

test.describe('Workspace Creation and Switching', () => {
  let testEmail: string;

  test.afterEach(async () => {
    if (testEmail) {
      await cleanupUser(testEmail);
    }
  });

  test('should create a new workspace', async ({ page }) => {
    const { email, userId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to workspaces page
    await page.goto('/workspaces');
    await expect(
      page.getByRole('heading', { name: /workspaces/i })
    ).toBeVisible();

    // Should see default "Personal" workspace
    await expect(page.getByText(/personal/i)).toBeVisible();

    // Click create workspace button
    await page.getByRole('button', { name: /create workspace/i }).click();

    // Fill in workspace name
    await page.getByLabel(/workspace name/i).fill('My Team Workspace');

    // Submit form
    await page.getByRole('button', { name: /create/i }).click();

    // Should show success message
    await expect(
      page.getByText(/workspace created successfully/i)
    ).toBeVisible();

    // Should see new workspace in list
    await expect(page.getByText(/my team workspace/i)).toBeVisible();

    // Verify workspace was created in database
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
    });
    expect(workspaces.length).toBe(2); // Personal + new workspace
    expect(workspaces.some((ws) => ws.name === 'My Team Workspace')).toBe(true);
  });

  test('should switch between workspaces', async ({ page }) => {
    const { email, userId } = await createAndLoginUser(page);
    testEmail = email;

    // Create a second workspace
    const secondWorkspace = await prisma.workspace.create({
      data: {
        name: 'Second Workspace',
        ownerId: userId,
        creditCount: 50,
        allocatedCredits: 0,
        isTrialed: false,
      },
    });

    // Navigate to workspaces page
    await page.goto('/workspaces');

    // Should see both workspaces
    await expect(page.getByText(/personal/i)).toBeVisible();
    await expect(page.getByText(/second workspace/i)).toBeVisible();

    // Current workspace should be marked with "Current" badge
    await expect(page.getByText(/current/i).first()).toBeVisible();

    // Find and click switch button for second workspace
    // The switch button should be next to "Second Workspace" text
    const workspaceListItems = page.locator('li');
    const secondWorkspaceItem = workspaceListItems.filter({
      hasText: 'Second Workspace',
    });
    await secondWorkspaceItem.getByRole('button', { name: /switch/i }).click();

    // Should show success message
    await expect(
      page.getByText(/workspace switched successfully/i)
    ).toBeVisible();

    // Verify current workspace was updated in database
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(updatedUser?.currentWorkspaceId).toBe(secondWorkspace.id);

    // Refresh page and verify workspace is still active
    await page.reload();
    // The "Current" badge should now be next to "Second Workspace"
    const workspaceListItemsAfterReload = page.locator('li');
    const secondWorkspaceItemAfterReload = workspaceListItemsAfterReload.filter(
      { hasText: 'Second Workspace' }
    );
    await expect(
      secondWorkspaceItemAfterReload.getByText(/current/i)
    ).toBeVisible();
  });

  test('should display workspace information correctly', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to workspaces page
    await page.goto('/workspaces');

    // Should see workspace details
    await expect(page.getByText(/personal/i)).toBeVisible();
    await expect(page.getByText(/100.*credits/i)).toBeVisible(); // Credit count
    await expect(page.getByText(/owner/i)).toBeVisible(); // Owner badge

    // Verify workspace shows credit information
    await expect(page.getByText(/100 credits available/i)).toBeVisible();
  });

  test('should validate workspace creation', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to workspaces page
    await page.goto('/workspaces');

    // Click create workspace button
    await page.getByRole('button', { name: /create workspace/i }).click();

    // Try to submit with empty name
    await page.getByRole('button', { name: /create/i }).click();

    // Should show validation error
    await expect(page.getByText(/workspace name is required/i)).toBeVisible();

    // Try with name that's too short
    await page.getByLabel(/workspace name/i).fill('A');
    await page.getByRole('button', { name: /create/i }).click();

    // Should show validation error
    await expect(
      page.getByText(/workspace name must be at least 2 characters/i)
    ).toBeVisible();
  });

  test('should show workspace owner badge only for owned workspaces', async ({
    page,
  }) => {
    const { email, userId } = await createAndLoginUser(page);
    testEmail = email;

    // Create another workspace
    await prisma.workspace.create({
      data: {
        name: 'Owned Workspace',
        ownerId: userId,
        creditCount: 100,
        allocatedCredits: 0,
        isTrialed: false,
      },
    });

    // Navigate to workspaces page
    await page.goto('/workspaces');

    // Should see owner badges - count should match number of owned workspaces (2)
    const ownerBadges = page.getByText(/owner/i);
    await expect(ownerBadges).toHaveCount(2); // Personal + Owned Workspace
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
