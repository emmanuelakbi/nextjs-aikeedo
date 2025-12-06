/**
 * Integration tests for authentication API routes
 *
 * Tests the complete authentication flows end-to-end:
 * - Registration flow
 * - Email verification flow
 * - Password reset flow
 *
 * Requirements: 3.1, 4.1, 5.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as registerPOST } from '../register/route';
import { POST as verifyEmailPOST } from '../verify-email/route';
import { POST as requestResetPOST } from '../request-reset/route';
import { POST as resetPasswordPOST } from '../reset-password/route';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { VerificationTokenRepository } from '@/infrastructure/repositories/VerificationTokenRepository';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';

// Mock the email service to avoid sending actual emails in tests
vi.mock('../../../../lib/email/service', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  getEmailService: vi.fn(),
}));

// Helper to create a mock NextRequest with unique IP to avoid rate limiting
let requestCounter = 0;
function createMockRequest(body: any): NextRequest {
  requestCounter++;
  const url = 'http://localhost:3000/api/auth/test';
  const request = new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Use unique IP for each request to avoid rate limiting in tests
      'x-forwarded-for': `192.168.1.${requestCounter % 255}`,
    },
    body: JSON.stringify(body),
  });
  return request;
}

// Helper to extract JSON from Response
async function getResponseJson(response: Response) {
  const text = await response.text();
  return JSON.parse(text);
}

describe('Authentication API Routes - Integration Tests', () => {
  const userRepository = new UserRepository();
  const workspaceRepository = new WorkspaceRepository();
  const verificationTokenRepository = new VerificationTokenRepository();
  const sessionRepository = new SessionRepository();

  // Test data
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testFirstName = 'John';
  const testLastName = 'Doe';

  let createdUserId: string | null = null;
  let createdWorkspaceId: string | null = null;
  let verificationToken: string | null = null;

  // Cleanup after each test
  afterEach(async () => {
    try {
      // Clean up created user and related data
      if (createdUserId) {
        // Delete sessions
        await sessionRepository.deleteAllForUser(createdUserId);

        // Delete verification tokens
        await verificationTokenRepository.deleteAllForIdentifier(
          testEmail,
          'EMAIL_VERIFICATION'
        );
        await verificationTokenRepository.deleteAllForIdentifier(
          testEmail,
          'PASSWORD_RESET'
        );

        // Delete workspace
        if (createdWorkspaceId) {
          await workspaceRepository.delete(createdWorkspaceId);
        }

        // Delete user
        await userRepository.delete(createdUserId);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    // Reset test data
    createdUserId = null;
    createdWorkspaceId = null;
    verificationToken = null;
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      // Increase timeout for database operations
      vi.setConfig({ testTimeout: 10000 });
      // Arrange
      const request = createMockRequest({
        email: testEmail,
        password: testPassword,
        firstName: testFirstName,
        lastName: testLastName,
      });

      // Act
      const response = await registerPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Registration successful');
      expect(data.data).toBeDefined();
      expect(data.data.userId).toBeDefined();
      expect(data.data.email).toBe(testEmail);
      expect(data.data.workspaceId).toBeDefined();

      // Store for cleanup
      createdUserId = data.data.userId;
      createdWorkspaceId = data.data.workspaceId;

      // Verify user was created in database
      const user = await userRepository.findById(createdUserId);
      expect(user).toBeDefined();
      expect(user?.getEmail().getValue()).toBe(testEmail);
      expect(user?.getFirstName()).toBe(testFirstName);
      expect(user?.getLastName()).toBe(testLastName);
      expect(user?.isEmailVerified()).toBe(false);

      // Verify workspace was created
      const workspace = await workspaceRepository.findById(createdWorkspaceId);
      expect(workspace).toBeDefined();
      expect(workspace?.getName()).toBe('Personal');
      expect(workspace?.getOwnerId()).toBe(createdUserId);
    });

    it('should reject registration with duplicate email', async () => {
      // Arrange - First registration
      const firstRequest = createMockRequest({
        email: testEmail,
        password: testPassword,
        firstName: testFirstName,
        lastName: testLastName,
      });

      const firstResponse = await registerPOST(firstRequest);
      const firstData = await getResponseJson(firstResponse);
      createdUserId = firstData.data.userId;
      createdWorkspaceId = firstData.data.workspaceId;

      // Act - Second registration with same email
      const secondRequest = createMockRequest({
        email: testEmail,
        password: 'DifferentPassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const response = await registerPOST(secondRequest);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(409);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CONFLICT');
      expect(data.error.fields.email).toContain(
        'A user with this email already exists'
      );
    });

    it('should reject registration with invalid email', async () => {
      // Arrange
      const request = createMockRequest({
        email: 'invalid-email',
        password: testPassword,
        firstName: testFirstName,
        lastName: testLastName,
      });

      // Act
      const response = await registerPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.email).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      // Arrange
      const request = createMockRequest({
        email: testEmail,
        password: 'weak',
        firstName: testFirstName,
        lastName: testLastName,
      });

      // Act
      const response = await registerPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.password).toBeDefined();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    beforeEach(async () => {
      // Register a user first
      const request = createMockRequest({
        email: testEmail,
        password: testPassword,
        firstName: testFirstName,
        lastName: testLastName,
      });

      const response = await registerPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);
      createdUserId = data.data.userId;
      createdWorkspaceId = data.data.workspaceId;

      // Create verification token directly
      const tokenData = await verificationTokenRepository.create({
        identifier: testEmail,
        token: `test-token-${Date.now()}`,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'EMAIL_VERIFICATION',
      });
      verificationToken = tokenData.token;
    });

    it('should successfully verify email with valid token', async () => {
      // Arrange
      expect(verificationToken).toBeDefined();
      const request = createMockRequest({
        token: verificationToken,
      });

      // Act
      const response = await verifyEmailPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Email verified successfully');

      // Verify user email is marked as verified
      const user = await userRepository.findById(createdUserId!);
      expect(user?.isEmailVerified()).toBe(true);

      // Verify token was deleted
      const tokenAfter = await verificationTokenRepository.findByToken(
        verificationToken!
      );
      expect(tokenAfter).toBeNull();
    });

    it('should reject verification with invalid token', async () => {
      // Arrange
      const request = createMockRequest({
        token: 'invalid-token-12345',
      });

      // Act
      const response = await verifyEmailPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle already verified email gracefully', async () => {
      // Arrange - First verification
      expect(verificationToken).toBeDefined();
      const firstRequest = createMockRequest({
        token: verificationToken,
      });
      await verifyEmailPOST(firstRequest);

      // Get a new token (simulating resend)
      const tokenData = await verificationTokenRepository.create({
        identifier: testEmail,
        token: 'new-token-' + Date.now(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'EMAIL_VERIFICATION',
      });
      const token = tokenData.token;

      // Act - Second verification
      const secondRequest = createMockRequest({
        token,
      });
      const response = await verifyEmailPOST(secondRequest);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert - Should succeed without error
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth/request-reset and /api/auth/reset-password', () => {
    beforeEach(async () => {
      // Register and verify a user first
      const registerRequest = createMockRequest({
        email: testEmail,
        password: testPassword,
        firstName: testFirstName,
        lastName: testLastName,
      });

      const registerResponse = await registerPOST(registerRequest);
      const registerData = await getResponseJson(registerResponse);
      createdUserId = registerData.data.userId;
      createdWorkspaceId = registerData.data.workspaceId;

      // Verify email
      const emailTokenData = await verificationTokenRepository.create({
        identifier: testEmail,
        token: `verify-token-${Date.now()}`,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: 'EMAIL_VERIFICATION',
      });
      const verifyRequest = createMockRequest({
        token: emailTokenData.token,
      });
      await verifyEmailPOST(verifyRequest);
    });

    it('should successfully complete password reset flow', async () => {
      // Step 1: Request password reset
      const requestResetRequest = createMockRequest({
        email: testEmail,
      });

      const requestResetResponse = await requestResetPOST(requestResetRequest);
      const requestResetData = await getResponseJson(requestResetResponse);

      expect(requestResetResponse!.status).toBe(200);
      expect(requestResetData.success).toBe(true);
      expect(requestResetData.message).toContain('password reset link');

      // Create reset token directly (simulating what the use case does)
      const resetTokenData = await verificationTokenRepository.create({
        identifier: testEmail,
        token: `reset-token-${Date.now()}`,
        expires: new Date(Date.now() + 60 * 60 * 1000),
        type: 'PASSWORD_RESET',
      });
      const resetToken = resetTokenData;

      // Step 2: Reset password with token
      const newPassword = 'NewSecurePassword456!';
      const resetPasswordRequest = createMockRequest({
        token: resetToken.token,
        newPassword,
      });

      const resetPasswordResponse =
        await resetPasswordPOST(resetPasswordRequest);
      const resetPasswordData = await getResponseJson(resetPasswordResponse);

      expect(resetPasswordResponse!.status).toBe(200);
      expect(resetPasswordData.success).toBe(true);
      expect(resetPasswordData.message).toContain(
        'Password reset successfully'
      );

      // Verify password was changed
      const user = await userRepository.findById(createdUserId!);
      expect(user).toBeDefined();

      // Verify old password doesn't work
      const { Password } =
        await import('../../../../domain/user/value-objects/Password');
      const oldPasswordVO = Password.create(testPassword);
      const oldPasswordValid = await user!.verifyPassword(oldPasswordVO);
      expect(oldPasswordValid).toBe(false);

      // Verify new password works
      const newPasswordVO = Password.create(newPassword);
      const newPasswordValid = await user!.verifyPassword(newPasswordVO);
      expect(newPasswordValid).toBe(true);

      // Verify reset token was deleted
      const resetTokenAfter = await verificationTokenRepository.findByToken(
        resetToken.token
      );
      expect(resetTokenAfter).toBeNull();
    });

    it('should return success even for non-existent email (security)', async () => {
      // Arrange
      const request = createMockRequest({
        email: 'nonexistent@example.com',
      });

      // Act
      const response = await requestResetPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert - Should return success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('password reset link');
    });

    it('should reject password reset with invalid token', async () => {
      // Arrange
      const request = createMockRequest({
        token: 'invalid-reset-token',
        newPassword: 'NewPassword123!',
      });

      // Act
      const response = await resetPasswordPOST(request);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject password reset with weak new password', async () => {
      // Arrange - Request reset first
      const requestResetRequest = createMockRequest({
        email: testEmail,
      });
      await requestResetPOST(requestResetRequest);

      // Create reset token directly
      const resetTokenData = await verificationTokenRepository.create({
        identifier: testEmail,
        token: `reset-token-weak-${Date.now()}`,
        expires: new Date(Date.now() + 60 * 60 * 1000),
        type: 'PASSWORD_RESET',
      });

      // Act - Try to reset with weak password
      const resetPasswordRequest = createMockRequest({
        token: resetTokenData.token,
        newPassword: 'weak',
      });

      const response = await resetPasswordPOST(resetPasswordRequest);
      if (!response) throw new Error('No response');
      const data = await getResponseJson(response!);

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.newPassword).toBeDefined();
    });
  });
});
