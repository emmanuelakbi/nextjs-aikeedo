/**
 * Property-Based Tests for Type Export Consistency
 *
 * Feature: critical-fixes, Property 2: Type Import Resolution
 * Validates: Requirements 1.3
 *
 * Property: For any import statement in the codebase, the imported types
 * should resolve correctly and be available at compile time.
 *
 * This test validates that all domain layer exports are properly configured
 * and can be imported without conflicts or resolution errors.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Domain layer imports - User domain
import {
  User,
  Email,
  Password,
  Id,
  UserRole,
  UserStatus,
} from '../user';
import type { IUserRepository, FindAllOptions } from '../user';

// Domain layer imports - Workspace domain
import { Workspace, WorkspaceMemberRole } from '../workspace';
import type {
  WorkspaceProps,
  CreateWorkspaceProps,
  IWorkspaceRepository,
  WorkspaceMember,
} from '../workspace';

// Domain layer imports - Conversation domain
import { Conversation, Message } from '../conversation';
import type {
  ConversationProps,
  CreateConversationProps,
  MessageProps,
  MessageRole,
  IConversationRepository,
  ListConversationsOptions,
  ConversationPaginationResult,
  IMessageRepository,
  CreateMessageData,
} from '../conversation';

// Domain layer imports - Preset domain
import { Preset } from '../preset';
import type {
  PresetProps,
  CreatePresetProps,
  IPresetRepository,
  ListPresetsOptions,
} from '../preset';

// Domain types imports
import {
  UserRole as DomainUserRole,
  UserStatus as DomainUserStatus,
  GenerationType,
  GenerationStatus,
  WorkspaceMemberRole as DomainWorkspaceMemberRole,
  PlanInterval,
  SubscriptionStatus,
  InvoiceStatus,
  CreditTransactionType,
  AffiliateStatus,
  ReferralStatus,
  PayoutMethod,
  PayoutStatus,
  isUserRole,
  isUserStatus,
  isGenerationType,
  isPlanInterval,
  isSubscriptionStatus,
} from '../types';

/**
 * Feature: critical-fixes, Property 2: Type Import Resolution
 * Validates: Requirements 1.3
 */
describe('Property 2: Type Import Resolution', () => {
  describe('User Domain Exports', () => {
    it('should export User entity class correctly', () => {
      expect(User).toBeDefined();
      expect(typeof User).toBe('function');
    });

    it('should export Email value object correctly', () => {
      expect(Email).toBeDefined();
      expect(typeof Email).toBe('function');
    });

    it('should export Password value object correctly', () => {
      expect(Password).toBeDefined();
      expect(typeof Password).toBe('function');
    });

    it('should export Id value object correctly', () => {
      expect(Id).toBeDefined();
      expect(typeof Id).toBe('function');
    });

    it('should export UserRole enum correctly', () => {
      expect(UserRole).toBeDefined();
      expect(UserRole.USER).toBe('USER');
      expect(UserRole.ADMIN).toBe('ADMIN');
    });

    it('should export UserStatus enum correctly', () => {
      expect(UserStatus).toBeDefined();
      expect(UserStatus.ACTIVE).toBe('ACTIVE');
      expect(UserStatus.INACTIVE).toBe('INACTIVE');
      expect(UserStatus.SUSPENDED).toBe('SUSPENDED');
    });

    /**
     * Property: For any valid email string, Email value object should be constructible
     */
    it('should construct Email value objects for valid emails', async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (emailStr) => {
          const email = Email.create(emailStr);
          expect(email).toBeDefined();
          expect(email.getValue()).toBe(emailStr.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any valid UUID v4 string, Id value object should be constructible
     */
    it('should construct Id value objects for valid UUIDs', async () => {
      // Generate UUID v4 format strings using string manipulation
      const hexChar = fc.constantFrom(...'0123456789abcdef'.split(''));
      const hexString = (len: number) => fc.array(hexChar, { minLength: len, maxLength: len }).map(arr => arr.join(''));
      const variantChar = fc.constantFrom('8', '9', 'a', 'b');
      
      const uuidV4Arb = fc.tuple(
        hexString(8),
        hexString(4),
        hexString(3),
        variantChar,
        hexString(3),
        hexString(12)
      ).map(([p1, p2, p3, variant, p4, p5]) => 
        `${p1}-${p2}-4${p3}-${variant}${p4}-${p5}`
      );

      await fc.assert(
        fc.asyncProperty(uuidV4Arb, async (uuidStr) => {
          const id = Id.fromString(uuidStr);
          expect(id).toBeDefined();
          expect(id.getValue()).toBe(uuidStr.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Workspace Domain Exports', () => {
    it('should export Workspace entity class correctly', () => {
      expect(Workspace).toBeDefined();
      expect(typeof Workspace).toBe('function');
    });

    it('should export WorkspaceMemberRole enum correctly', () => {
      expect(WorkspaceMemberRole).toBeDefined();
      expect(WorkspaceMemberRole.OWNER).toBe('OWNER');
      expect(WorkspaceMemberRole.ADMIN).toBe('ADMIN');
      expect(WorkspaceMemberRole.MEMBER).toBe('MEMBER');
    });
  });

  describe('Conversation Domain Exports', () => {
    it('should export Conversation entity class correctly', () => {
      expect(Conversation).toBeDefined();
      expect(typeof Conversation).toBe('function');
    });

    it('should export Message entity class correctly', () => {
      expect(Message).toBeDefined();
      expect(typeof Message).toBe('function');
    });
  });

  describe('Preset Domain Exports', () => {
    it('should export Preset entity class correctly', () => {
      expect(Preset).toBeDefined();
      expect(typeof Preset).toBe('function');
    });
  });

  describe('Domain Types Exports', () => {
    it('should export all user-related enums correctly', () => {
      expect(DomainUserRole).toBeDefined();
      expect(DomainUserStatus).toBeDefined();
      expect(DomainUserRole.USER).toBe('USER');
      expect(DomainUserRole.ADMIN).toBe('ADMIN');
    });

    it('should export all generation-related enums correctly', () => {
      expect(GenerationType).toBeDefined();
      expect(GenerationStatus).toBeDefined();
      expect(GenerationType.TEXT).toBe('TEXT');
      expect(GenerationType.IMAGE).toBe('IMAGE');
      expect(GenerationType.SPEECH).toBe('SPEECH');
      expect(GenerationType.TRANSCRIPTION).toBe('TRANSCRIPTION');
      expect(GenerationType.CHAT).toBe('CHAT');
    });

    it('should export all workspace-related enums correctly', () => {
      expect(DomainWorkspaceMemberRole).toBeDefined();
      expect(DomainWorkspaceMemberRole.OWNER).toBe('OWNER');
      expect(DomainWorkspaceMemberRole.ADMIN).toBe('ADMIN');
      expect(DomainWorkspaceMemberRole.MEMBER).toBe('MEMBER');
    });

    it('should export all billing-related enums correctly', () => {
      expect(PlanInterval).toBeDefined();
      expect(SubscriptionStatus).toBeDefined();
      expect(InvoiceStatus).toBeDefined();
      expect(CreditTransactionType).toBeDefined();
      expect(PlanInterval.MONTH).toBe('MONTH');
      expect(PlanInterval.YEAR).toBe('YEAR');
    });

    it('should export all affiliate-related enums correctly', () => {
      expect(AffiliateStatus).toBeDefined();
      expect(ReferralStatus).toBeDefined();
      expect(PayoutMethod).toBeDefined();
      expect(PayoutStatus).toBeDefined();
    });

    /**
     * Property: For any UserRole enum value, isUserRole type guard should return true
     */
    it('should validate UserRole values with type guard', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...Object.values(DomainUserRole)),
          async (role) => {
            expect(isUserRole(role)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any UserStatus enum value, isUserStatus type guard should return true
     */
    it('should validate UserStatus values with type guard', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...Object.values(DomainUserStatus)),
          async (status) => {
            expect(isUserStatus(status)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any GenerationType enum value, isGenerationType type guard should return true
     */
    it('should validate GenerationType values with type guard', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...Object.values(GenerationType)),
          async (type) => {
            expect(isGenerationType(type)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any PlanInterval enum value, isPlanInterval type guard should return true
     */
    it('should validate PlanInterval values with type guard', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...Object.values(PlanInterval)),
          async (interval) => {
            expect(isPlanInterval(interval)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any SubscriptionStatus enum value, isSubscriptionStatus type guard should return true
     */
    it('should validate SubscriptionStatus values with type guard', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...Object.values(SubscriptionStatus)),
          async (status) => {
            expect(isSubscriptionStatus(status)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any random string not in enum, type guards should return false
     */
    it('should reject invalid values with type guards', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 20 }).filter(
            (s) =>
              !Object.values(DomainUserRole).includes(s as DomainUserRole) &&
              !Object.values(DomainUserStatus).includes(s as DomainUserStatus) &&
              !Object.values(GenerationType).includes(s as GenerationType) &&
              !Object.values(PlanInterval).includes(s as PlanInterval) &&
              !Object.values(SubscriptionStatus).includes(s as SubscriptionStatus)
          ),
          async (invalidValue) => {
            expect(isUserRole(invalidValue)).toBe(false);
            expect(isUserStatus(invalidValue)).toBe(false);
            expect(isGenerationType(invalidValue)).toBe(false);
            expect(isPlanInterval(invalidValue)).toBe(false);
            expect(isSubscriptionStatus(invalidValue)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Type Export Consistency', () => {
    /**
     * Property: Enum values from domain/user should match domain/types
     */
    it('should have consistent UserRole enum values across modules', () => {
      expect(UserRole.USER).toBe(DomainUserRole.USER);
      expect(UserRole.ADMIN).toBe(DomainUserRole.ADMIN);
      expect(Object.keys(UserRole).length).toBe(Object.keys(DomainUserRole).length);
    });

    /**
     * Property: Enum values from domain/user should match domain/types
     */
    it('should have consistent UserStatus enum values across modules', () => {
      expect(UserStatus.ACTIVE).toBe(DomainUserStatus.ACTIVE);
      expect(UserStatus.INACTIVE).toBe(DomainUserStatus.INACTIVE);
      expect(UserStatus.SUSPENDED).toBe(DomainUserStatus.SUSPENDED);
      expect(Object.keys(UserStatus).length).toBe(Object.keys(DomainUserStatus).length);
    });

    /**
     * Property: Enum values from domain/workspace should match domain/types
     */
    it('should have consistent WorkspaceMemberRole enum values across modules', () => {
      expect(WorkspaceMemberRole.OWNER).toBe(DomainWorkspaceMemberRole.OWNER);
      expect(WorkspaceMemberRole.ADMIN).toBe(DomainWorkspaceMemberRole.ADMIN);
      expect(WorkspaceMemberRole.MEMBER).toBe(DomainWorkspaceMemberRole.MEMBER);
      expect(Object.keys(WorkspaceMemberRole).length).toBe(
        Object.keys(DomainWorkspaceMemberRole).length
      );
    });
  });

  describe('Value Object Immutability', () => {
    /**
     * Property: For any Id, getValue should always return the same value
     */
    it('should maintain Id immutability', async () => {
      // Generate UUID v4 format strings using string manipulation
      const hexChar = fc.constantFrom(...'0123456789abcdef'.split(''));
      const hexString = (len: number) => fc.array(hexChar, { minLength: len, maxLength: len }).map(arr => arr.join(''));
      const variantChar = fc.constantFrom('8', '9', 'a', 'b');
      
      const uuidV4Arb = fc.tuple(
        hexString(8),
        hexString(4),
        hexString(3),
        variantChar,
        hexString(3),
        hexString(12)
      ).map(([p1, p2, p3, variant, p4, p5]) => 
        `${p1}-${p2}-4${p3}-${variant}${p4}-${p5}`
      );

      await fc.assert(
        fc.asyncProperty(uuidV4Arb, async (uuidStr) => {
          const id = Id.fromString(uuidStr);
          const value1 = id.getValue();
          const value2 = id.getValue();
          expect(value1).toBe(value2);
          expect(value1).toBe(uuidStr.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any Email, getValue should always return the normalized value
     */
    it('should maintain Email immutability and normalization', async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (emailStr) => {
          const email = Email.create(emailStr);
          const value1 = email.getValue();
          const value2 = email.getValue();
          expect(value1).toBe(value2);
          expect(value1).toBe(emailStr.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });
  });
});
