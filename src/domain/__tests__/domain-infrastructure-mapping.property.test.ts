/**
 * Property-Based Tests for Domain-Infrastructure Type Mapping
 *
 * Feature: critical-fixes, Property 4: Domain-Infrastructure Type Mapping
 * Validates: Requirements 2.4, 5.2
 *
 * Property: For any data transformation between domain and infrastructure layers,
 * the mapping should preserve data integrity and type safety.
 *
 * This test validates that domain entities can be correctly mapped to and from
 * infrastructure (Prisma) types without data loss or type errors.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Domain layer imports
import { User, UserProps, UserRole, UserStatus } from '../user/entities/User';
import { Email } from '../user/value-objects/Email';
import { Password } from '../user/value-objects/Password';
import { Id } from '../user/value-objects/Id';
import { Workspace, WorkspaceProps } from '../workspace/entities/Workspace';

/**
 * Arbitrary generators for domain types
 */

// UUID v4 generator
const uuidV4Arb = (): fc.Arbitrary<string> => {
  const hexChar = fc.constantFrom(...'0123456789abcdef'.split(''));
  const hexString = (len: number) =>
    fc.array(hexChar, { minLength: len, maxLength: len }).map((arr) => arr.join(''));
  const variantChar = fc.constantFrom('8', '9', 'a', 'b');

  return fc
    .tuple(hexString(8), hexString(4), hexString(3), variantChar, hexString(3), hexString(12))
    .map(([p1, p2, p3, variant, p4, p5]) => `${p1}-${p2}-4${p3}-${variant}${p4}-${p5}`);
};

// Valid email generator - use built-in emailAddress
const validEmailArb = (): fc.Arbitrary<string> => {
  return fc.emailAddress();
};

// Valid password generator (meets strength requirements: min 8 chars, 3 of 4 criteria)
const validPasswordArb = (): fc.Arbitrary<string> => {
  const upperChars = fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const lowerChars = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split(''));
  const numChars = fc.constantFrom(...'0123456789'.split(''));
  const specialChars = fc.constantFrom(...'!@#$%^&*'.split(''));

  // Ensure minimum 8 characters: 3 upper + 3 lower + 2 num + 1 special = 9 minimum
  return fc
    .tuple(
      fc.array(upperChars, { minLength: 3, maxLength: 5 }),
      fc.array(lowerChars, { minLength: 3, maxLength: 5 }),
      fc.array(numChars, { minLength: 2, maxLength: 4 }),
      fc.array(specialChars, { minLength: 1, maxLength: 2 })
    )
    .map(([upper, lower, num, special]) => `${upper.join('')}${lower.join('')}${num.join('')}${special.join('')}`);
};

// User role generator
const userRoleArb = (): fc.Arbitrary<UserRole> => {
  return fc.constantFrom<UserRole>('USER', 'ADMIN');
};

// User status generator
const userStatusArb = (): fc.Arbitrary<UserStatus> => {
  return fc.constantFrom<UserStatus>('ACTIVE', 'INACTIVE', 'SUSPENDED');
};

// Name generator (non-empty string with letters only)
const nameArb = (): fc.Arbitrary<string> => {
  const letterChars = fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''));
  return fc.array(letterChars, { minLength: 1, maxLength: 50 }).map((arr) => arr.join(''));
};

// Phone number generator (optional)
const phoneNumberArb = (): fc.Arbitrary<string | null> => {
  const digitChars = fc.constantFrom(...'0123456789'.split(''));
  return fc.option(
    fc.array(digitChars, { minLength: 10, maxLength: 15 }).map((arr) => arr.join('')),
    { nil: null }
  );
};

// Language code generator
const languageArb = (): fc.Arbitrary<string> => {
  return fc.constantFrom('en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN');
};

// Date generator
const dateArb = (): fc.Arbitrary<Date> => {
  return fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });
};

// Optional date generator
const optionalDateArb = (): fc.Arbitrary<Date | null> => {
  return fc.option(dateArb(), { nil: null });
};

// Credit count generator (non-negative integer)
const creditCountArb = (): fc.Arbitrary<number> => {
  return fc.integer({ min: 0, max: 1000000 });
};

/**
 * Feature: critical-fixes, Property 4: Domain-Infrastructure Type Mapping
 * Validates: Requirements 2.4, 5.2
 */
describe('Property 4: Domain-Infrastructure Type Mapping', () => {
  describe('User Entity Mapping', () => {
    /**
     * Property: For any valid User entity, converting to persistence and back
     * should preserve all data fields.
     */
    it('should preserve User data through toPersistence round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidV4Arb(),
          validEmailArb(),
          nameArb(),
          nameArb(),
          phoneNumberArb(),
          languageArb(),
          userRoleArb(),
          userStatusArb(),
          optionalDateArb(),
          optionalDateArb(),
          dateArb(),
          dateArb(),
          async (
            uuid,
            emailStr,
            firstName,
            lastName,
            phoneNumber,
            language,
            role,
            status,
            emailVerified,
            lastSeenAt,
            createdAt,
            updatedAt
          ) => {
            // Create domain value objects
            const id = Id.fromString(uuid);
            const email = Email.create(emailStr);

            // Create UserProps for reconstitution
            const props: UserProps = {
              id,
              email,
              emailVerified,
              passwordHash: 'hashed_password_placeholder',
              firstName,
              lastName,
              phoneNumber,
              language,
              role,
              status,
              apiKey: null,
              currentWorkspaceId: null,
              lastSeenAt,
              createdAt,
              updatedAt,
            };

            // Create User from persistence
            const user = User.fromPersistence(props);

            // Convert back to persistence
            const persistedProps = user.toPersistence();

            // Verify all fields are preserved
            expect(persistedProps.id.getValue()).toBe(uuid.toLowerCase());
            expect(persistedProps.email.getValue()).toBe(emailStr.toLowerCase());
            expect(persistedProps.emailVerified).toEqual(emailVerified);
            expect(persistedProps.passwordHash).toBe('hashed_password_placeholder');
            expect(persistedProps.firstName).toBe(firstName);
            expect(persistedProps.lastName).toBe(lastName);
            expect(persistedProps.phoneNumber).toBe(phoneNumber);
            expect(persistedProps.language).toBe(language);
            expect(persistedProps.role).toBe(role);
            expect(persistedProps.status).toBe(status);
            expect(persistedProps.apiKey).toBeNull();
            expect(persistedProps.currentWorkspaceId).toBeNull();
            expect(persistedProps.lastSeenAt).toEqual(lastSeenAt);
            expect(persistedProps.createdAt).toEqual(createdAt);
            expect(persistedProps.updatedAt).toEqual(updatedAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any User entity, getter methods should return the same
     * values as the original props.
     */
    it('should maintain User getter consistency with props', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidV4Arb(),
          validEmailArb(),
          nameArb(),
          nameArb(),
          phoneNumberArb(),
          languageArb(),
          userRoleArb(),
          userStatusArb(),
          async (uuid, emailStr, firstName, lastName, phoneNumber, language, role, status) => {
            const id = Id.fromString(uuid);
            const email = Email.create(emailStr);
            const now = new Date();

            const props: UserProps = {
              id,
              email,
              emailVerified: null,
              passwordHash: 'hash',
              firstName,
              lastName,
              phoneNumber,
              language,
              role,
              status,
              apiKey: null,
              currentWorkspaceId: null,
              lastSeenAt: null,
              createdAt: now,
              updatedAt: now,
            };

            const user = User.fromPersistence(props);

            // Verify getters return correct values
            expect(user.getId().getValue()).toBe(uuid.toLowerCase());
            expect(user.getEmail().getValue()).toBe(emailStr.toLowerCase());
            expect(user.getFirstName()).toBe(firstName);
            expect(user.getLastName()).toBe(lastName);
            expect(user.getFullName()).toBe(`${firstName} ${lastName}`);
            expect(user.getPhoneNumber()).toBe(phoneNumber);
            expect(user.getLanguage()).toBe(language);
            expect(user.getRole()).toBe(role);
            expect(user.getStatus()).toBe(status);
            expect(user.isAdmin()).toBe(role === 'ADMIN');
            expect(user.isActive()).toBe(status === 'ACTIVE');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Workspace Entity Mapping', () => {
    /**
     * Property: For any valid Workspace entity, converting to persistence and back
     * should preserve all data fields.
     */
    it('should preserve Workspace data through toPersistence round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidV4Arb(),
          nameArb(),
          uuidV4Arb(),
          creditCountArb(),
          creditCountArb(),
          fc.boolean(),
          dateArb(),
          dateArb(),
          optionalDateArb(),
          async (
            uuid,
            name,
            ownerId,
            creditCount,
            allocatedCredits,
            isTrialed,
            createdAt,
            updatedAt,
            creditsAdjustedAt
          ) => {
            // Ensure allocatedCredits <= creditCount for valid state
            const validAllocatedCredits = Math.min(allocatedCredits, creditCount);

            const id = Id.fromString(uuid);

            const props: WorkspaceProps = {
              id,
              name,
              ownerId,
              creditCount,
              allocatedCredits: validAllocatedCredits,
              isTrialed,
              createdAt,
              updatedAt,
              creditsAdjustedAt,
            };

            // Create Workspace from persistence
            const workspace = Workspace.fromPersistence(props);

            // Convert back to persistence
            const persistedProps = workspace.toPersistence();

            // Verify all fields are preserved
            expect(persistedProps.id.getValue()).toBe(uuid.toLowerCase());
            expect(persistedProps.name).toBe(name);
            expect(persistedProps.ownerId).toBe(ownerId);
            expect(persistedProps.creditCount).toBe(creditCount);
            expect(persistedProps.allocatedCredits).toBe(validAllocatedCredits);
            expect(persistedProps.isTrialed).toBe(isTrialed);
            expect(persistedProps.createdAt).toEqual(createdAt);
            expect(persistedProps.updatedAt).toEqual(updatedAt);
            expect(persistedProps.creditsAdjustedAt).toEqual(creditsAdjustedAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any Workspace entity, getter methods should return the same
     * values as the original props.
     */
    it('should maintain Workspace getter consistency with props', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidV4Arb(),
          nameArb(),
          uuidV4Arb(),
          creditCountArb(),
          creditCountArb(),
          fc.boolean(),
          async (uuid, name, ownerId, creditCount, allocatedCredits, isTrialed) => {
            const validAllocatedCredits = Math.min(allocatedCredits, creditCount);
            const id = Id.fromString(uuid);
            const now = new Date();

            const props: WorkspaceProps = {
              id,
              name,
              ownerId,
              creditCount,
              allocatedCredits: validAllocatedCredits,
              isTrialed,
              createdAt: now,
              updatedAt: now,
              creditsAdjustedAt: null,
            };

            const workspace = Workspace.fromPersistence(props);

            // Verify getters return correct values
            expect(workspace.getId().getValue()).toBe(uuid.toLowerCase());
            expect(workspace.getName()).toBe(name);
            expect(workspace.getOwnerId()).toBe(ownerId);
            expect(workspace.getCreditCount()).toBe(creditCount);
            expect(workspace.getAllocatedCredits()).toBe(validAllocatedCredits);
            expect(workspace.getAvailableCredits()).toBe(creditCount - validAllocatedCredits);
            expect(workspace.getIsTrialed()).toBe(isTrialed);
            expect(workspace.isOwnedBy(ownerId)).toBe(true);
            expect(workspace.isOwnedBy('other-user-id')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Value Object Mapping', () => {
    /**
     * Property: For any valid Id, the value should be preserved through getValue()
     */
    it('should preserve Id value through getValue()', async () => {
      await fc.assert(
        fc.asyncProperty(uuidV4Arb(), async (uuid) => {
          const id = Id.fromString(uuid);
          expect(id.getValue()).toBe(uuid.toLowerCase());
          expect(id.toString()).toBe(uuid.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any two Ids with the same value, equals() should return true
     */
    it('should correctly compare Id equality', async () => {
      await fc.assert(
        fc.asyncProperty(uuidV4Arb(), async (uuid) => {
          const id1 = Id.fromString(uuid);
          const id2 = Id.fromString(uuid);
          expect(id1.equals(id2)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any two different UUIDs, equals() should return false
     */
    it('should correctly detect Id inequality', async () => {
      await fc.assert(
        fc.asyncProperty(uuidV4Arb(), uuidV4Arb(), async (uuid1, uuid2) => {
          fc.pre(uuid1.toLowerCase() !== uuid2.toLowerCase());
          const id1 = Id.fromString(uuid1);
          const id2 = Id.fromString(uuid2);
          expect(id1.equals(id2)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any valid Email, the value should be normalized (lowercase)
     */
    it('should normalize Email to lowercase', async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArb(), async (emailStr) => {
          const email = Email.create(emailStr);
          expect(email.getValue()).toBe(emailStr.toLowerCase());
          expect(email.toString()).toBe(emailStr.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any two Emails with the same normalized value, equals() should return true
     */
    it('should correctly compare Email equality (case-insensitive)', async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArb(), async (emailStr) => {
          const email1 = Email.create(emailStr);
          const email2 = Email.create(emailStr.toUpperCase());
          expect(email1.equals(email2)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any valid Password, getValue() should return the original value
     */
    it('should preserve Password value through getValue()', async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArb(), async (passwordStr) => {
          const password = Password.create(passwordStr);
          expect(password.getValue()).toBe(passwordStr);
          expect(password.getLength()).toBe(passwordStr.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Infrastructure Type Compatibility', () => {
    /**
     * Property: For any User entity, the persistence format should be compatible
     * with Prisma's expected input types.
     */
    it('should produce Prisma-compatible User persistence format', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidV4Arb(),
          validEmailArb(),
          nameArb(),
          nameArb(),
          userRoleArb(),
          userStatusArb(),
          async (uuid, emailStr, firstName, lastName, role, status) => {
            const id = Id.fromString(uuid);
            const email = Email.create(emailStr);
            const now = new Date();

            const props: UserProps = {
              id,
              email,
              emailVerified: null,
              passwordHash: 'hash',
              firstName,
              lastName,
              phoneNumber: null,
              language: 'en-US',
              role,
              status,
              apiKey: null,
              currentWorkspaceId: null,
              lastSeenAt: null,
              createdAt: now,
              updatedAt: now,
            };

            const user = User.fromPersistence(props);
            const persisted = user.toPersistence();

            // Verify types are compatible with Prisma expectations
            expect(typeof persisted.id.getValue()).toBe('string');
            expect(typeof persisted.email.getValue()).toBe('string');
            expect(typeof persisted.passwordHash).toBe('string');
            expect(typeof persisted.firstName).toBe('string');
            expect(typeof persisted.lastName).toBe('string');
            expect(typeof persisted.language).toBe('string');
            expect(['USER', 'ADMIN']).toContain(persisted.role);
            expect(['ACTIVE', 'INACTIVE', 'SUSPENDED']).toContain(persisted.status);
            expect(persisted.createdAt instanceof Date).toBe(true);
            expect(persisted.updatedAt instanceof Date).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any Workspace entity, the persistence format should be compatible
     * with Prisma's expected input types.
     */
    it('should produce Prisma-compatible Workspace persistence format', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidV4Arb(),
          nameArb(),
          uuidV4Arb(),
          creditCountArb(),
          fc.boolean(),
          async (uuid, name, ownerId, creditCount, isTrialed) => {
            const id = Id.fromString(uuid);
            const now = new Date();

            const props: WorkspaceProps = {
              id,
              name,
              ownerId,
              creditCount,
              allocatedCredits: 0,
              isTrialed,
              createdAt: now,
              updatedAt: now,
              creditsAdjustedAt: null,
            };

            const workspace = Workspace.fromPersistence(props);
            const persisted = workspace.toPersistence();

            // Verify types are compatible with Prisma expectations
            expect(typeof persisted.id.getValue()).toBe('string');
            expect(typeof persisted.name).toBe('string');
            expect(typeof persisted.ownerId).toBe('string');
            expect(typeof persisted.creditCount).toBe('number');
            expect(Number.isInteger(persisted.creditCount)).toBe(true);
            expect(typeof persisted.allocatedCredits).toBe('number');
            expect(Number.isInteger(persisted.allocatedCredits)).toBe(true);
            expect(typeof persisted.isTrialed).toBe('boolean');
            expect(persisted.createdAt instanceof Date).toBe(true);
            expect(persisted.updatedAt instanceof Date).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
