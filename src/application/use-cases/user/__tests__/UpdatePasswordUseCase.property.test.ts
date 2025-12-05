import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { UpdatePasswordUseCase } from '../UpdatePasswordUseCase';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { SessionRepository } from '../../../../infrastructure/repositories/SessionRepository';
import { User } from '../../../../domain/user/entities/User';
import { Email } from '../../../../domain/user/value-objects/Email';
import { Password } from '../../../../domain/user/value-objects/Password';
import { Id } from '../../../../domain/user/value-objects/Id';

/**
 * Custom generator for valid passwords that meet strength requirements
 */
const validPasswordArbitrary = (): fc.Arbitrary<string> => {
  return fc
    .tuple(
      fc.stringMatching(/[A-Z]/), // At least one uppercase
      fc.stringMatching(/[a-z]/), // At least one lowercase
      fc.stringMatching(/[0-9]/), // At least one number
      fc.string({ minLength: 5, maxLength: 65 }) // Additional characters
    )
    .map(([upper, lower, num, rest]) => {
      // Combine and shuffle to create a valid password
      const combined = upper + lower + num + rest;
      return combined.slice(0, 72); // Ensure max length
    })
    .filter((pwd) => {
      // Ensure it meets all requirements
      try {
        Password.create(pwd);
        return true;
      } catch {
        return false;
      }
    });
};

/**
 * Property-Based Tests for UpdatePasswordUseCase
 *
 * Feature: nextjs-foundation, Property 10: Password change requires current password
 * Validates: Requirements 7.4
 */

describe('UpdatePasswordUseCase - Property Tests', () => {
  let userRepository: UserRepository;
  let sessionRepository: SessionRepository;
  let useCase: UpdatePasswordUseCase;

  beforeEach(() => {
    userRepository = new UserRepository();
    sessionRepository = new SessionRepository();
    useCase = new UpdatePasswordUseCase(userRepository, sessionRepository);
  });

  /**
   * Property 10: Password change requires current password
   *
   * For any user with a stored password, attempting to change the password
   * should only succeed if the correct current password is provided.
   */
  it('should only allow password change with correct current password', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid passwords
        validPasswordArbitrary(),
        validPasswordArbitrary(),
        validPasswordArbitrary(),
        async (correctPassword, newPassword, wrongPassword) => {
          // Ensure wrong password is different from correct password
          fc.pre(wrongPassword !== correctPassword);

          // Create a user with the correct password
          const email = Email.create(
            `test-${Date.now()}-${Math.random()}@example.com`
          );
          const password = Password.create(correctPassword);
          const user = await User.create({
            email,
            password,
            firstName: 'Test',
            lastName: 'User',
          });

          // Save user to database
          const savedUser = await userRepository.save(user);
          const userId = savedUser.getId().getValue();

          try {
            // Test 1: Attempting to change password with WRONG current password should fail
            try {
              await useCase.execute({
                userId,
                currentPassword: wrongPassword,
                newPassword,
              });
              // If we get here, the test should fail
              expect.fail(
                'Password change should have failed with wrong current password'
              );
            } catch (error) {
              // Expected to fail - verify it's the right error
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toContain(
                'Current password is incorrect'
              );
            }

            // Test 2: Attempting to change password with CORRECT current password should succeed
            const result = await useCase.execute({
              userId,
              currentPassword: correctPassword,
              newPassword,
            });

            // Verify the password was changed
            expect(result).toBeDefined();

            // Verify the new password works
            const updatedUser = await userRepository.findById(userId);
            expect(updatedUser).toBeDefined();
            const newPasswordObj = Password.create(newPassword);
            const isNewPasswordValid =
              await updatedUser!.verifyPassword(newPasswordObj);
            expect(isNewPasswordValid).toBe(true);

            // Verify the old password no longer works
            const oldPasswordObj = Password.create(correctPassword);
            const isOldPasswordValid =
              await updatedUser!.verifyPassword(oldPasswordObj);
            expect(isOldPasswordValid).toBe(false);
          } finally {
            // Cleanup - always delete the user
            try {
              await userRepository.delete(userId);
            } catch (error) {
              // Ignore cleanup errors
              console.warn('Failed to cleanup user:', error);
            }
          }
        }
      ),
      { numRuns: 3, timeout: 60000 } // Reduced runs for performance due to bcrypt overhead
    );
  }, 120000); // 120 second timeout

  /**
   * Additional property: Password change should preserve user identity
   *
   * For any user, changing their password should not affect their other properties
   * (email, name, etc.)
   */
  it('should preserve user identity when changing password', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPasswordArbitrary(),
        validPasswordArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (currentPassword, newPassword, firstName, lastName) => {
          // Create a user
          const email = Email.create(
            `test-${Date.now()}-${Math.random()}@example.com`
          );
          const password = Password.create(currentPassword);
          const user = await User.create({
            email,
            password,
            firstName: firstName.trim() || 'Test',
            lastName: lastName.trim() || 'User',
          });

          const savedUser = await userRepository.save(user);
          const userId = savedUser.getId().getValue();

          try {
            // Store original values
            const originalEmail = savedUser.getEmail().getValue();
            const originalFirstName = savedUser.getFirstName();
            const originalLastName = savedUser.getLastName();

            // Change password
            await useCase.execute({
              userId,
              currentPassword,
              newPassword,
            });

            // Verify user identity is preserved
            const updatedUser = await userRepository.findById(userId);
            expect(updatedUser).toBeDefined();
            expect(updatedUser!.getEmail().getValue()).toBe(originalEmail);
            expect(updatedUser!.getFirstName()).toBe(originalFirstName);
            expect(updatedUser!.getLastName()).toBe(originalLastName);
          } finally {
            // Cleanup - always delete the user
            try {
              await userRepository.delete(userId);
            } catch (error) {
              // Ignore cleanup errors
              console.warn('Failed to cleanup user:', error);
            }
          }
        }
      ),
      { numRuns: 3, timeout: 60000 } // Reduced runs for performance due to bcrypt overhead
    );
  }, 120000); // 120 second timeout
});
