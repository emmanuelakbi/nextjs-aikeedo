import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Workspace } from './Workspace';

/**
 * Feature: nextjs-foundation
 * Property tests for Workspace entity
 */

describe('Workspace Entity', () => {
  describe('Property-Based Tests', () => {
    /**
     * Feature: nextjs-foundation, Property 15: Workspace credit allocation
     * Validates: Requirements 8.5
     */
    it('Property 15: Workspace credit allocation', () => {
      // Property: For any workspace, the sum of allocated credits should never exceed
      // the total available credits
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.uuid(),
          fc.integer({ min: 0, max: 10000 }),
          fc.array(fc.integer({ min: 1, max: 100 }), {
            minLength: 0,
            maxLength: 20,
          }),
          (name, ownerId, initialCredits, allocations) => {
            const workspace = Workspace.create({
              name,
              ownerId,
              creditCount: initialCredits,
            });

            // Try to allocate credits in sequence
            let totalAllocated = 0;
            for (const amount of allocations) {
              const availableCredits = workspace.getAvailableCredits();

              if (availableCredits >= amount) {
                // Should succeed
                workspace.allocateCredits(amount);
                totalAllocated += amount;

                // Verify invariant: allocated <= total
                expect(workspace.getAllocatedCredits()).toBeLessThanOrEqual(
                  workspace.getCreditCount()
                );
                expect(workspace.getAllocatedCredits()).toBe(totalAllocated);
              } else {
                // Should fail
                expect(() => workspace.allocateCredits(amount)).toThrow(
                  'Insufficient available credits'
                );
              }

              // Invariant must always hold
              expect(workspace.getAllocatedCredits()).toBeLessThanOrEqual(
                workspace.getCreditCount()
              );
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain credit invariant after adding credits', () => {
      // Property: For any workspace, after adding credits, allocated should still be <= total
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.uuid(),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 500 }),
          (name, ownerId, initialCredits, allocateAmount, addAmount) => {
            const workspace = Workspace.create({
              name,
              ownerId,
              creditCount: initialCredits,
            });

            // Allocate some credits
            workspace.allocateCredits(allocateAmount);

            // Add more credits
            workspace.addCredits(addAmount);

            // Invariant must hold
            expect(workspace.getAllocatedCredits()).toBeLessThanOrEqual(
              workspace.getCreditCount()
            );
            expect(workspace.getCreditCount()).toBe(initialCredits + addAmount);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain credit invariant after releasing credits', () => {
      // Property: For any workspace, after releasing credits, allocated should still be <= total
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.uuid(),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (name, ownerId, initialCredits, allocateAmount, releaseAmount) => {
            fc.pre(releaseAmount <= allocateAmount);

            const workspace = Workspace.create({
              name,
              ownerId,
              creditCount: initialCredits,
            });

            // Allocate some credits
            workspace.allocateCredits(allocateAmount);

            // Release some credits
            workspace.releaseCredits(releaseAmount);

            // Invariant must hold
            expect(workspace.getAllocatedCredits()).toBeLessThanOrEqual(
              workspace.getCreditCount()
            );
            expect(workspace.getAllocatedCredits()).toBe(
              allocateAmount - releaseAmount
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain credit invariant after consuming credits', () => {
      // Property: For any workspace, after consuming credits, allocated should still be <= total
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.uuid(),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (name, ownerId, initialCredits, allocateAmount, consumeAmount) => {
            fc.pre(consumeAmount <= allocateAmount);

            const workspace = Workspace.create({
              name,
              ownerId,
              creditCount: initialCredits,
            });

            // Allocate some credits
            workspace.allocateCredits(allocateAmount);

            // Consume some credits
            workspace.consumeCredits(consumeAmount);

            // Invariant must hold
            expect(workspace.getAllocatedCredits()).toBeLessThanOrEqual(
              workspace.getCreditCount()
            );
            expect(workspace.getAllocatedCredits()).toBe(
              allocateAmount - consumeAmount
            );
            expect(workspace.getCreditCount()).toBe(
              initialCredits - consumeAmount
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should correctly calculate available credits', () => {
      // Property: For any workspace, available credits = total - allocated
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc.uuid(),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 0, max: 50 }),
          (name, ownerId, totalCredits, allocatedAmount) => {
            fc.pre(allocatedAmount <= totalCredits);

            const workspace = Workspace.create({
              name,
              ownerId,
              creditCount: totalCredits,
            });

            if (allocatedAmount > 0) {
              workspace.allocateCredits(allocatedAmount);
            }

            const available = workspace.getAvailableCredits();
            expect(available).toBe(totalCredits - allocatedAmount);
            expect(workspace.hasAvailableCredits(available)).toBe(true);
            expect(workspace.hasAvailableCredits(available + 1)).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Unit Tests - Credit Management', () => {
    it('should create workspace with zero credits by default', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
      });

      expect(workspace.getCreditCount()).toBe(0);
      expect(workspace.getAllocatedCredits()).toBe(0);
      expect(workspace.getAvailableCredits()).toBe(0);
    });

    it('should create workspace with initial credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      expect(workspace.getCreditCount()).toBe(100);
      expect(workspace.getAllocatedCredits()).toBe(0);
      expect(workspace.getAvailableCredits()).toBe(100);
    });

    it('should add credits to workspace', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.addCredits(50);

      expect(workspace.getCreditCount()).toBe(150);
      expect(workspace.getCreditsAdjustedAt()).toBeInstanceOf(Date);
    });

    it('should reject adding zero or negative credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      expect(() => workspace.addCredits(0)).toThrow(
        'Credit amount must be positive'
      );
      expect(() => workspace.addCredits(-10)).toThrow(
        'Credit amount must be positive'
      );
    });

    it('should reject adding non-integer credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      expect(() => workspace.addCredits(10.5)).toThrow(
        'Credit amount must be an integer'
      );
    });

    it('should remove credits from workspace', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.removeCredits(30);

      expect(workspace.getCreditCount()).toBe(70);
      expect(workspace.getCreditsAdjustedAt()).toBeInstanceOf(Date);
    });

    it('should reject removing more credits than available', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      expect(() => workspace.removeCredits(150)).toThrow(
        'Insufficient credits'
      );
    });

    it('should allocate credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.allocateCredits(30);

      expect(workspace.getAllocatedCredits()).toBe(30);
      expect(workspace.getAvailableCredits()).toBe(70);
      expect(workspace.getCreditCount()).toBe(100);
    });

    it('should reject allocating more than available credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.allocateCredits(60);

      expect(() => workspace.allocateCredits(50)).toThrow(
        'Insufficient available credits'
      );
    });

    it('should release allocated credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.allocateCredits(50);
      workspace.releaseCredits(20);

      expect(workspace.getAllocatedCredits()).toBe(30);
      expect(workspace.getAvailableCredits()).toBe(70);
      expect(workspace.getCreditCount()).toBe(100);
    });

    it('should reject releasing more than allocated', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.allocateCredits(30);

      expect(() => workspace.releaseCredits(50)).toThrow(
        'Cannot release more credits than allocated'
      );
    });

    it('should consume allocated credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.allocateCredits(50);
      workspace.consumeCredits(20);

      expect(workspace.getAllocatedCredits()).toBe(30);
      expect(workspace.getCreditCount()).toBe(80);
      expect(workspace.getAvailableCredits()).toBe(50);
    });

    it('should reject consuming more than allocated', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.allocateCredits(30);

      expect(() => workspace.consumeCredits(50)).toThrow(
        'Cannot consume more credits than allocated'
      );
    });

    it('should check if workspace has available credits', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      workspace.allocateCredits(60);

      expect(workspace.hasAvailableCredits(40)).toBe(true);
      expect(workspace.hasAvailableCredits(50)).toBe(false);
    });
  });

  describe('Unit Tests - Workspace Management', () => {
    it('should create workspace with required fields', () => {
      const workspace = Workspace.create({
        name: 'My Workspace',
        ownerId: 'user-123',
      });

      expect(workspace.getName()).toBe('My Workspace');
      expect(workspace.getOwnerId()).toBe('user-123');
      expect(workspace.getIsTrialed()).toBe(false);
      expect(workspace.getCreatedAt()).toBeInstanceOf(Date);
      expect(workspace.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should reject empty workspace name', () => {
      expect(() =>
        Workspace.create({
          name: '',
          ownerId: 'user-123',
        })
      ).toThrow('Workspace name is required');
    });

    it('should reject empty owner ID', () => {
      expect(() =>
        Workspace.create({
          name: 'Test Workspace',
          ownerId: '',
        })
      ).toThrow('Workspace owner ID is required');
    });

    it('should update workspace name', () => {
      const workspace = Workspace.create({
        name: 'Old Name',
        ownerId: 'user-123',
      });

      workspace.updateName('New Name');

      expect(workspace.getName()).toBe('New Name');
    });

    it('should reject empty name in update', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
      });

      expect(() => workspace.updateName('')).toThrow(
        'Workspace name cannot be empty'
      );
    });

    it('should transfer ownership', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
      });

      workspace.transferOwnership('user-456');

      expect(workspace.getOwnerId()).toBe('user-456');
    });

    it('should not transfer ownership to same owner', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
      });

      const updatedAtBefore = workspace.getUpdatedAt();
      workspace.transferOwnership('user-123');

      expect(workspace.getOwnerId()).toBe('user-123');
      expect(workspace.getUpdatedAt()).toBe(updatedAtBefore);
    });

    it('should check if user is owner', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
      });

      expect(workspace.isOwnedBy('user-123')).toBe(true);
      expect(workspace.isOwnedBy('user-456')).toBe(false);
    });

    it('should mark workspace as trialed', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
      });

      expect(workspace.getIsTrialed()).toBe(false);

      workspace.markAsTrialed();

      expect(workspace.getIsTrialed()).toBe(true);
    });

    it('should not change state when marking already trialed workspace', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        isTrialed: true,
      });

      const updatedAtBefore = workspace.getUpdatedAt();
      workspace.markAsTrialed();

      expect(workspace.getIsTrialed()).toBe(true);
      expect(workspace.getUpdatedAt()).toBe(updatedAtBefore);
    });
  });

  describe('Unit Tests - Persistence', () => {
    it('should convert to persistence format', () => {
      const workspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
      });

      const persistence = workspace.toPersistence();

      expect(persistence.name).toBe('Test Workspace');
      expect(persistence.ownerId).toBe('user-123');
      expect(persistence.creditCount).toBe(100);
      expect(persistence.allocatedCredits).toBe(0);
      expect(persistence.isTrialed).toBe(false);
    });

    it('should reconstitute from persistence', () => {
      const props = {
        id: {
          toString: () => 'workspace-id',
          getValue: () => 'workspace-id',
          equals: () => false,
        } as any,
        name: 'Test Workspace',
        ownerId: 'user-123',
        creditCount: 100,
        allocatedCredits: 30,
        isTrialed: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        creditsAdjustedAt: new Date('2024-01-02'),
      };

      const workspace = Workspace.fromPersistence(props);

      expect(workspace.getName()).toBe('Test Workspace');
      expect(workspace.getOwnerId()).toBe('user-123');
      expect(workspace.getCreditCount()).toBe(100);
      expect(workspace.getAllocatedCredits()).toBe(30);
      expect(workspace.getIsTrialed()).toBe(true);
    });
  });
});
