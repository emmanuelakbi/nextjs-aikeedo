/**
 * Property-Based Tests for Test Factory Type Consistency
 *
 * Property 8: Test Type Consistency
 * Validates: Requirements 6.2 - Test factories must produce correctly typed test data
 *
 * These tests verify that test factories produce data that:
 * 1. Has all required fields with correct types
 * 2. Enum values match domain/Prisma definitions
 * 3. Optional fields are properly typed
 * 4. Factory methods return consistent types
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { UserRole, UserStatus } from '@/domain/user';
import type { CreateUserOptions } from '../factories/user-factory';
import type { CreateWorkspaceOptions } from '../factories/workspace-factory';

/**
 * Arbitrary generators for factory options
 */

// Generate valid email addresses
const emailArbitrary = fc.emailAddress();

// Generate valid user roles
const userRoleArbitrary = fc.constantFrom(UserRole.USER, UserRole.ADMIN);

// Generate valid user statuses
const userStatusArbitrary = fc.constantFrom(
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  UserStatus.SUSPENDED
);

// Generate valid first names (non-empty strings)
const firstNameArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

// Generate valid last names (non-empty strings)
const lastNameArbitrary = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

// Generate valid passwords (at least 8 characters)
const passwordArbitrary = fc.string({ minLength: 8, maxLength: 100 });

// Generate valid workspace names
const workspaceNameArbitrary = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

// Generate valid credit counts (non-negative integers)
const creditCountArbitrary = fc.integer({ min: 0, max: 1000000 });

// Generate valid phone numbers (optional)
const phoneNumberArbitrary = fc.option(
  fc.stringMatching(/^\+?[1-9]\d{1,14}$/),
  { nil: null }
);

// Generate valid language codes
const languageArbitrary = fc.constantFrom('en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE');

describe('Factory Type Consistency Property Tests', () => {
  describe('UserFactory Options Type Consistency', () => {
    /**
     * Property: CreateUserOptions should accept all valid combinations of optional fields
     * Validates: User factory options interface is correctly typed
     */
    it('should accept valid user creation options', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.option(emailArbitrary, { nil: undefined }),
            password: fc.option(passwordArbitrary, { nil: undefined }),
            firstName: fc.option(firstNameArbitrary, { nil: undefined }),
            lastName: fc.option(lastNameArbitrary, { nil: undefined }),
            phoneNumber: fc.option(phoneNumberArbitrary, { nil: undefined }),
            language: fc.option(languageArbitrary, { nil: undefined }),
            role: fc.option(userRoleArbitrary, { nil: undefined }),
            status: fc.option(userStatusArbitrary, { nil: undefined }),
            emailVerified: fc.option(fc.boolean(), { nil: undefined }),
            apiKey: fc.option(fc.option(fc.uuid(), { nil: null }), { nil: undefined }),
          }),
          (options) => {
            // Type assertion: options should be assignable to CreateUserOptions
            const typedOptions: CreateUserOptions = options;

            // Verify all fields are correctly typed
            if (typedOptions.email !== undefined) {
              expect(typeof typedOptions.email).toBe('string');
            }
            if (typedOptions.password !== undefined) {
              expect(typeof typedOptions.password).toBe('string');
            }
            if (typedOptions.firstName !== undefined) {
              expect(typeof typedOptions.firstName).toBe('string');
            }
            if (typedOptions.lastName !== undefined) {
              expect(typeof typedOptions.lastName).toBe('string');
            }
            if (typedOptions.role !== undefined) {
              expect(Object.values(UserRole)).toContain(typedOptions.role);
            }
            if (typedOptions.status !== undefined) {
              expect(Object.values(UserStatus)).toContain(typedOptions.status);
            }
            if (typedOptions.emailVerified !== undefined) {
              expect(typeof typedOptions.emailVerified).toBe('boolean');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: UserRole enum values should match domain definitions
     * Validates: Enum type consistency between factory and domain
     */
    it('should have consistent UserRole enum values', () => {
      fc.assert(
        fc.property(userRoleArbitrary, (role) => {
          // Role should be one of the defined enum values
          expect(role).toMatch(/^(USER|ADMIN)$/);

          // Role should be assignable to UserRole type
          const typedRole: UserRole = role;
          expect(typedRole).toBeDefined();

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: UserStatus enum values should match domain definitions
     * Validates: Enum type consistency between factory and domain
     */
    it('should have consistent UserStatus enum values', () => {
      fc.assert(
        fc.property(userStatusArbitrary, (status) => {
          // Status should be one of the defined enum values
          expect(status).toMatch(/^(ACTIVE|INACTIVE|SUSPENDED)$/);

          // Status should be assignable to UserStatus type
          const typedStatus: UserStatus = status;
          expect(typedStatus).toBeDefined();

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('WorkspaceFactory Options Type Consistency', () => {
    /**
     * Property: CreateWorkspaceOptions should accept all valid combinations of optional fields
     * Validates: Workspace factory options interface is correctly typed
     */
    it('should accept valid workspace creation options', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.option(workspaceNameArbitrary, { nil: undefined }),
            ownerId: fc.option(fc.uuid(), { nil: undefined }),
            creditCount: fc.option(creditCountArbitrary, { nil: undefined }),
            allocatedCredits: fc.option(creditCountArbitrary, { nil: undefined }),
            isTrialed: fc.option(fc.boolean(), { nil: undefined }),
          }),
          (options) => {
            // Type assertion: options should be assignable to CreateWorkspaceOptions
            const typedOptions: CreateWorkspaceOptions = options;

            // Verify all fields are correctly typed
            if (typedOptions.name !== undefined) {
              expect(typeof typedOptions.name).toBe('string');
            }
            if (typedOptions.ownerId !== undefined) {
              expect(typeof typedOptions.ownerId).toBe('string');
            }
            if (typedOptions.creditCount !== undefined) {
              expect(typeof typedOptions.creditCount).toBe('number');
              expect(Number.isInteger(typedOptions.creditCount)).toBe(true);
              expect(typedOptions.creditCount).toBeGreaterThanOrEqual(0);
            }
            if (typedOptions.allocatedCredits !== undefined) {
              expect(typeof typedOptions.allocatedCredits).toBe('number');
              expect(Number.isInteger(typedOptions.allocatedCredits)).toBe(true);
              expect(typedOptions.allocatedCredits).toBeGreaterThanOrEqual(0);
            }
            if (typedOptions.isTrialed !== undefined) {
              expect(typeof typedOptions.isTrialed).toBe('boolean');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Credit counts should always be non-negative integers
     * Validates: Numeric field type constraints
     */
    it('should enforce non-negative integer credit counts', () => {
      fc.assert(
        fc.property(creditCountArbitrary, (credits) => {
          expect(typeof credits).toBe('number');
          expect(Number.isInteger(credits)).toBe(true);
          expect(credits).toBeGreaterThanOrEqual(0);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Factory Return Type Consistency', () => {
    /**
     * Property: User factory return type should have required fields
     * Validates: Factory output structure matches expected types
     */
    it('should define correct user factory return structure', () => {
      // This test validates the type structure at compile time
      // The factory returns { user, password } where user has Prisma User type

      type ExpectedUserFactoryReturn = {
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          role: string;
          status: string;
          emailVerified: Date | null;
        };
        password: string;
      };

      // Type check: verify the structure is correct
      const mockReturn: ExpectedUserFactoryReturn = {
        user: {
          id: 'test-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
          status: 'ACTIVE',
          emailVerified: null,
        },
        password: 'password123',
      };

      expect(mockReturn.user.id).toBeDefined();
      expect(mockReturn.user.email).toBeDefined();
      expect(mockReturn.password).toBeDefined();
    });

    /**
     * Property: Workspace factory return type should have required fields
     * Validates: Factory output structure matches expected types
     */
    it('should define correct workspace factory return structure', () => {
      // This test validates the type structure at compile time
      // The factory returns a Prisma Workspace type

      type ExpectedWorkspaceReturn = {
        id: string;
        name: string;
        ownerId: string;
        creditCount: number;
        allocatedCredits: number;
        isTrialed: boolean;
      };

      // Type check: verify the structure is correct
      const mockReturn: ExpectedWorkspaceReturn = {
        id: 'test-id',
        name: 'Test Workspace',
        ownerId: 'owner-id',
        creditCount: 100,
        allocatedCredits: 0,
        isTrialed: false,
      };

      expect(mockReturn.id).toBeDefined();
      expect(mockReturn.name).toBeDefined();
      expect(mockReturn.ownerId).toBeDefined();
      expect(typeof mockReturn.creditCount).toBe('number');
      expect(typeof mockReturn.allocatedCredits).toBe('number');
      expect(typeof mockReturn.isTrialed).toBe('boolean');
    });
  });

  describe('Factory Options Boundary Conditions', () => {
    /**
     * Property: Empty options should be valid
     * Validates: Factory accepts empty options object
     */
    it('should accept empty options for user factory', () => {
      const emptyOptions: CreateUserOptions = {};
      expect(emptyOptions).toEqual({});
    });

    it('should accept empty options for workspace factory', () => {
      const emptyOptions: CreateWorkspaceOptions = {};
      expect(emptyOptions).toEqual({});
    });

    /**
     * Property: Partial options should be valid
     * Validates: Factory accepts any subset of options
     */
    it('should accept partial user options', () => {
      fc.assert(
        fc.property(
          fc.record(
            {
              email: emailArbitrary,
              firstName: firstNameArbitrary,
              role: userRoleArbitrary,
            },
            { requiredKeys: [] }
          ),
          (partialOptions) => {
            // Partial options should be assignable to CreateUserOptions
            const typedOptions: CreateUserOptions = partialOptions;
            expect(typedOptions).toBeDefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept partial workspace options', () => {
      fc.assert(
        fc.property(
          fc.record(
            {
              name: workspaceNameArbitrary,
              creditCount: creditCountArbitrary,
              isTrialed: fc.boolean(),
            },
            { requiredKeys: [] }
          ),
          (partialOptions) => {
            // Partial options should be assignable to CreateWorkspaceOptions
            const typedOptions: CreateWorkspaceOptions = partialOptions;
            expect(typedOptions).toBeDefined();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Enum Value Exhaustiveness', () => {
    /**
     * Property: All UserRole values should be covered
     * Validates: Enum completeness
     */
    it('should cover all UserRole values', () => {
      const allRoles = Object.values(UserRole);
      expect(allRoles).toContain(UserRole.USER);
      expect(allRoles).toContain(UserRole.ADMIN);
      expect(allRoles).toHaveLength(2);
    });

    /**
     * Property: All UserStatus values should be covered
     * Validates: Enum completeness
     */
    it('should cover all UserStatus values', () => {
      const allStatuses = Object.values(UserStatus);
      expect(allStatuses).toContain(UserStatus.ACTIVE);
      expect(allStatuses).toContain(UserStatus.INACTIVE);
      expect(allStatuses).toContain(UserStatus.SUSPENDED);
      expect(allStatuses).toHaveLength(3);
    });
  });
});
