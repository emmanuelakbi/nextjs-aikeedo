import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { User } from './User';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';

/**
 * Feature: nextjs-foundation
 * Property tests for User entity
 */

describe('User Entity', () => {
  // Helper to create valid password arbitrary
  const validPasswordArbitrary = () => {
    return fc
      .tuple(
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), {
          minLength: 2,
          maxLength: 20,
        }),
        fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
          minLength: 2,
          maxLength: 20,
        }),
        fc.array(fc.constantFrom(...'0123456789'), {
          minLength: 2,
          maxLength: 20,
        }),
        fc.array(fc.constantFrom(...'!@#$%^&*()_+-=[]{};\':"|,.<>/?'), {
          minLength: 0,
          maxLength: 10,
        })
      )
      .map(([lower, upper, numbers, special]) => {
        const combined = [...lower, ...upper, ...numbers, ...special];
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        return combined.join('').substring(0, 50);
      });
  };

  describe('Property-Based Tests', () => {
    /**
     * Feature: nextjs-foundation, Property 1: Password hashing is irreversible
     * Validates: Requirements 3.4, 12.1
     */
    it('Property 1: Password hashing is irreversible', async () => {
      // Property: For any valid password, after hashing, it should be impossible
      // to retrieve the original password from the hash alone
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary(), async (passwordStr) => {
          fc.pre(passwordStr.length >= 8 && passwordStr.length <= 72);

          const password = Password.create(passwordStr);
          const hash = await User.hashPassword(password);

          // The hash should not contain the original password
          expect(hash).not.toContain(passwordStr);

          // The hash should be different from the password
          expect(hash).not.toBe(passwordStr);

          // The hash should be a bcrypt hash (starts with $2b$ or $2a$)
          expect(hash).toMatch(/^\$2[ab]\$/);

          // The hash should be at least 60 characters (bcrypt standard)
          expect(hash.length).toBeGreaterThanOrEqual(60);
        }),
        { numRuns: 3 }
      );
    }, 30000);

    /**
     * Feature: nextjs-foundation, Property 4: Password verification correctness
     * Validates: Requirements 3.2, 3.3
     */
    it('Property 4: Password verification correctness', async () => {
      // Property: For any user with a stored password hash, verifying with the
      // correct password should succeed and verifying with any incorrect password should fail
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          validPasswordArbitrary(),
          validPasswordArbitrary(),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s.trim().length > 0),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s.trim().length > 0),
          async (
            emailStr,
            correctPasswordStr,
            wrongPasswordStr,
            firstName,
            lastName
          ) => {
            // Ensure passwords are valid and different
            fc.pre(
              correctPasswordStr.length >= 8 &&
                correctPasswordStr.length <= 72 &&
                wrongPasswordStr.length >= 8 &&
                wrongPasswordStr.length <= 72 &&
                correctPasswordStr !== wrongPasswordStr
            );

            const email = Email.create(emailStr);
            const correctPassword = Password.create(correctPasswordStr);
            const wrongPassword = Password.create(wrongPasswordStr);

            // Create user with correct password
            const user = await User.create({
              email,
              password: correctPassword,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
            });

            // Verification with correct password should succeed
            const correctVerification =
              await user.verifyPassword(correctPassword);
            expect(correctVerification).toBe(true);

            // Verification with wrong password should fail
            const wrongVerification = await user.verifyPassword(wrongPassword);
            expect(wrongVerification).toBe(false);
          }
        ),
        { numRuns: 3 }
      );
    }, 60000);

    it('should produce different hashes for the same password', async () => {
      // Property: For any password, hashing it twice should produce different hashes
      // (due to different salts)
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary(), async (passwordStr) => {
          fc.pre(passwordStr.length >= 8 && passwordStr.length <= 72);

          const password = Password.create(passwordStr);
          const hash1 = await User.hashPassword(password);
          const hash2 = await User.hashPassword(password);

          // Hashes should be different (different salts)
          expect(hash1).not.toBe(hash2);

          // But both should be valid bcrypt hashes
          expect(hash1).toMatch(/^\$2[ab]\$/);
          expect(hash2).toMatch(/^\$2[ab]\$/);
        }),
        { numRuns: 3 }
      );
    }, 30000);

    it('should verify password after user creation', async () => {
      // Property: For any valid user creation, the password should be verifiable
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          validPasswordArbitrary(),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s.trim().length > 0),
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s.trim().length > 0),
          async (emailStr, passwordStr, firstName, lastName) => {
            fc.pre(passwordStr.length >= 8 && passwordStr.length <= 72);

            const email = Email.create(emailStr);
            const password = Password.create(passwordStr);

            const user = await User.create({
              email,
              password,
              firstName,
              lastName,
            });

            // Password should be verifiable
            const isValid = await user.verifyPassword(password);
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  describe('Unit Tests - Password Management', () => {
    it('should hash password during user creation', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      // Password hash should not be the plain password
      expect(user.getPasswordHash()).not.toBe('MyP@ssw0rd');
      expect(user.getPasswordHash()).toMatch(/^\$2[ab]\$/);
    });

    it('should verify correct password', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      const isValid = await user.verifyPassword(password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      const wrongPassword = Password.create('Wr0ng!Pass');
      const isValid = await user.verifyPassword(wrongPassword);
      expect(isValid).toBe(false);
    });

    it('should update password with correct current password', async () => {
      const email = Email.create('test@example.com');
      const oldPassword = Password.create('OldP@ssw0rd');

      const user = await User.create({
        email,
        password: oldPassword,
        firstName: 'Test',
        lastName: 'User',
      });

      const newPassword = Password.create('NewP@ssw0rd');
      await user.updatePassword(oldPassword, newPassword);

      // Old password should no longer work
      const oldValid = await user.verifyPassword(oldPassword);
      expect(oldValid).toBe(false);

      // New password should work
      const newValid = await user.verifyPassword(newPassword);
      expect(newValid).toBe(true);
    });

    it('should reject password update with incorrect current password', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      const wrongPassword = Password.create('Wr0ng!Pass');
      const newPassword = Password.create('NewP@ssw0rd');

      await expect(
        user.updatePassword(wrongPassword, newPassword)
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should reset password without requiring current password', async () => {
      const email = Email.create('test@example.com');
      const oldPassword = Password.create('OldP@ssw0rd');

      const user = await User.create({
        email,
        password: oldPassword,
        firstName: 'Test',
        lastName: 'User',
      });

      const newPassword = Password.create('NewP@ssw0rd');
      await user.resetPassword(newPassword);

      // Old password should no longer work
      const oldValid = await user.verifyPassword(oldPassword);
      expect(oldValid).toBe(false);

      // New password should work
      const newValid = await user.verifyPassword(newPassword);
      expect(newValid).toBe(true);
    });
  });

  describe('Unit Tests - Email Verification', () => {
    it('should create user with unverified email', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      expect(user.isEmailVerified()).toBe(false);
      expect(user.getEmailVerified()).toBeNull();
    });

    it('should verify email', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      user.verifyEmail();

      expect(user.isEmailVerified()).toBe(true);
      expect(user.getEmailVerified()).toBeInstanceOf(Date);
    });

    it('should reject verifying already verified email', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      user.verifyEmail();

      expect(() => user.verifyEmail()).toThrow('Email is already verified');
    });

    it('should require re-verification when email is updated', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      user.verifyEmail();
      expect(user.isEmailVerified()).toBe(true);

      const newEmail = Email.create('newemail@example.com');
      user.updateEmail(newEmail);

      expect(user.isEmailVerified()).toBe(false);
      expect(user.getEmail().equals(newEmail)).toBe(true);
    });

    it('should not change verification status when updating to same email', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      user.verifyEmail();
      const verifiedDate = user.getEmailVerified();

      user.updateEmail(email);

      expect(user.getEmailVerified()).toBe(verifiedDate);
    });
  });

  describe('Unit Tests - Profile Management', () => {
    it('should create user with required fields', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.getFirstName()).toBe('John');
      expect(user.getLastName()).toBe('Doe');
      expect(user.getFullName()).toBe('John Doe');
      expect(user.getEmail().equals(email)).toBe(true);
      expect(user.getLanguage()).toBe('en-US');
      expect(user.getRole()).toBe('USER');
      expect(user.getStatus()).toBe('ACTIVE');
    });

    it('should reject empty first name', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      await expect(
        User.create({
          email,
          password,
          firstName: '',
          lastName: 'Doe',
        })
      ).rejects.toThrow('First name is required');
    });

    it('should reject empty last name', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      await expect(
        User.create({
          email,
          password,
          firstName: 'John',
          lastName: '',
        })
      ).rejects.toThrow('Last name is required');
    });

    it('should update profile information', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      user.updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+1234567890',
        language: 'es-ES',
      });

      expect(user.getFirstName()).toBe('Jane');
      expect(user.getLastName()).toBe('Smith');
      expect(user.getPhoneNumber()).toBe('+1234567890');
      expect(user.getLanguage()).toBe('es-ES');
    });

    it('should reject empty first name in update', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(() => user.updateProfile({ firstName: '' })).toThrow(
        'First name cannot be empty'
      );
    });

    it('should reject empty last name in update', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(() => user.updateProfile({ lastName: '' })).toThrow(
        'Last name cannot be empty'
      );
    });
  });

  describe('Unit Tests - User Status', () => {
    it('should create active user by default', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.isActive()).toBe(true);
      expect(user.getStatus()).toBe('ACTIVE');
    });

    it('should suspend user', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      user.suspend();

      expect(user.getStatus()).toBe('SUSPENDED');
      expect(user.isActive()).toBe(false);
    });

    it('should activate suspended user', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      user.suspend();
      user.activate();

      expect(user.getStatus()).toBe('ACTIVE');
      expect(user.isActive()).toBe(true);
    });

    it('should deactivate user', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      user.deactivate();

      expect(user.getStatus()).toBe('INACTIVE');
      expect(user.isActive()).toBe(false);
    });
  });

  describe('Unit Tests - Workspace Management', () => {
    it('should set current workspace', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      const workspaceId = 'workspace-123';
      user.setCurrentWorkspace(workspaceId);

      expect(user.getCurrentWorkspaceId()).toBe(workspaceId);
    });
  });

  describe('Unit Tests - Admin Role', () => {
    it('should create regular user by default', async () => {
      const email = Email.create('test@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.isAdmin()).toBe(false);
      expect(user.getRole()).toBe('USER');
    });

    it('should create admin user when specified', async () => {
      const email = Email.create('admin@example.com');
      const password = Password.create('MyP@ssw0rd');

      const user = await User.create({
        email,
        password,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      });

      expect(user.isAdmin()).toBe(true);
      expect(user.getRole()).toBe('ADMIN');
    });
  });
});
