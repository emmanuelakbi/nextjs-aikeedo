import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { GetUserUseCase } from '@/application/use-cases/user/GetUserUseCase';
import { UpdateProfileUseCase } from '@/application/use-cases/user/UpdateProfileUseCase';
import { User } from '../../../../../domain/user/entities/User';
import { Email } from '../../../../../domain/user/value-objects/Email';
import { Password } from '../../../../../domain/user/value-objects/Password';

/**
 * Property-Based Tests for User Profile Management
 *
 * Feature: nextjs-foundation, Property 9: Profile update requires authentication
 * Validates: Requirements 7.2
 *
 * Note: This property tests that profile operations require a valid user ID.
 * At the API layer, authentication middleware ensures the user ID comes from
 * a valid session token. Here we test that the use cases properly validate
 * user existence and authorization.
 */

describe('User Profile Management - Property Tests', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  /**
   * Property 9: Profile update requires authentication
   *
   * For any profile retrieval request, the request should only succeed if a valid
   * user ID is provided (which at the API layer comes from an authenticated session).
   * Attempting to retrieve a non-existent user should fail.
   */
  it('should require valid user ID for profile retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.uuid(),
        async (firstName, lastName, invalidUserId) => {
          // Test 1: Attempting to get profile with INVALID user ID should fail
          const getUserUseCase = new GetUserUseCase(userRepository);

          try {
            await getUserUseCase.execute({ userId: invalidUserId });
            // If we get here, the test should fail
            expect.fail('Should have failed with invalid user ID');
          } catch (error) {
            // Expected to fail - verify it's the right error
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('not found');
          }

          // Test 2: Attempting to get profile with VALID user ID should succeed
          // Create a test user
          const email = Email.create(
            `test-${Date.now()}-${Math.random()}@example.com`
          );
          const password = Password.create('TestPassword123!');
          const user = await User.create({
            email,
            password,
            firstName: firstName.trim() || 'Test',
            lastName: lastName.trim() || 'User',
          });

          const savedUser = await userRepository.save(user);
          const userId = savedUser.getId().getValue();

          // Ensure the invalid ID is different from the valid one
          fc.pre(invalidUserId !== userId);

          // Get user with valid ID
          const result = await getUserUseCase.execute({ userId });

          // Verify the correct user was retrieved
          expect(result).toBeDefined();
          expect(result.getId().getValue()).toBe(userId);
          expect(result.getEmail().getValue()).toBe(email.getValue());

          // Cleanup
          try {
            await userRepository.delete(userId);
          } catch (e) {
            /* User might already be deleted */
          }
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 120000);

  /**
   * Property 9: Profile update requires authentication (Update operation)
   *
   * For any profile update request, the request should only succeed if a valid
   * user ID is provided (which at the API layer comes from an authenticated session).
   * Attempting to update a non-existent user should fail.
   */
  it('should require valid user ID for profile updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.uuid(),
        async (
          firstName,
          lastName,
          newFirstName,
          newLastName,
          invalidUserId
        ) => {
          // Test 1: Attempting to update profile with INVALID user ID should fail
          const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

          const updateData = {
            firstName: newFirstName.trim() || 'NewFirst',
            lastName: newLastName.trim() || 'NewLast',
          };

          try {
            await updateProfileUseCase.execute({
              userId: invalidUserId,
              ...updateData,
            });
            // If we get here, the test should fail
            expect.fail('Should have failed with invalid user ID');
          } catch (error) {
            // Expected to fail - verify it's the right error
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('not found');
          }

          // Test 2: Attempting to update profile with VALID user ID should succeed
          // Create a test user
          const email = Email.create(
            `test-${Date.now()}-${Math.random()}@example.com`
          );
          const password = Password.create('TestPassword123!');
          const user = await User.create({
            email,
            password,
            firstName: firstName.trim() || 'Test',
            lastName: lastName.trim() || 'User',
          });

          const savedUser = await userRepository.save(user);
          const userId = savedUser.getId().getValue();

          // Ensure the invalid ID is different from the valid one
          fc.pre(invalidUserId !== userId);

          // Update user with valid ID
          const result = await updateProfileUseCase.execute({
            userId,
            ...updateData,
          });

          // Verify the profile was updated
          expect(result).toBeDefined();
          expect(result.getId().getValue()).toBe(userId);
          expect(result.getFirstName()).toBe(updateData.firstName);
          expect(result.getLastName()).toBe(updateData.lastName);

          // Cleanup
          try {
            await userRepository.delete(userId);
          } catch (e) {
            /* User might already be deleted */
          }
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 120000);

  /**
   * Additional property: Users can only access their own profile data
   *
   * For any user, they should only be able to access and update their own
   * profile data. The use case enforces this by requiring the correct user ID.
   */
  it('should only allow users to access their own profile data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (firstName, lastName) => {
          // Create two test users
          const email1 = Email.create(
            `test1-${Date.now()}-${Math.random()}@example.com`
          );
          const email2 = Email.create(
            `test2-${Date.now()}-${Math.random()}@example.com`
          );
          const password = Password.create('TestPassword123!');

          const user1 = await User.create({
            email: email1,
            password,
            firstName: firstName.trim() || 'User1',
            lastName: lastName.trim() || 'Test',
          });

          const user2 = await User.create({
            email: email2,
            password,
            firstName: 'User2',
            lastName: 'Test',
          });

          const savedUser1 = await userRepository.save(user1);
          const savedUser2 = await userRepository.save(user2);

          const userId1 = savedUser1.getId().getValue();
          const userId2 = savedUser2.getId().getValue();

          const getUserUseCase = new GetUserUseCase(userRepository);

          // User1 accesses their own profile - should succeed
          const result1 = await getUserUseCase.execute({ userId: userId1 });
          expect(result1).toBeDefined();
          expect(result1.getId().getValue()).toBe(userId1);
          expect(result1.getId().getValue()).not.toBe(userId2);

          // User2 accesses their own profile - should succeed
          const result2 = await getUserUseCase.execute({ userId: userId2 });
          expect(result2).toBeDefined();
          expect(result2.getId().getValue()).toBe(userId2);
          expect(result2.getId().getValue()).not.toBe(userId1);

          // Verify each user gets their own data
          expect(result1.getEmail().getValue()).toBe(email1.getValue());
          expect(result2.getEmail().getValue()).toBe(email2.getValue());

          // Cleanup
          await userRepository.delete(userId1);
          await userRepository.delete(userId2);
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 120000);
});
