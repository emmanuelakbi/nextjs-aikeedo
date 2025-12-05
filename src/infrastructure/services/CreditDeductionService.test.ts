import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreditDeductionService,
  InsufficientCreditsError,
  CreditAllocationNotFoundError,
} from './CreditDeductionService';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { UserRepository } from '../repositories/UserRepository';
import { Workspace } from '../../domain/workspace/entities/Workspace';
import { User } from '../../domain/user/entities/User';
import { prisma } from '../../lib/db';
import { createTestFixtures, type TestFixtures } from '../../lib/testing/test-fixtures';

/**
 * Unit tests for CreditDeductionService
 *
 * Tests credit deduction logic with transaction support and atomicity.
 * Requirements: 2.5, 7.3, 7.4
 */

describe('CreditDeductionService', () => {
  let service: CreditDeductionService;
  let workspaceRepository: WorkspaceRepository;
  let userRepository: UserRepository;
  let testWorkspace: Workspace;
  let testWorkspaceId: string;
  let testUser: User;
  let testUserId: string;
  let fixtures: TestFixtures;

  beforeEach(async () => {
    service = new CreditDeductionService();
    workspaceRepository = new WorkspaceRepository();
    userRepository = new UserRepository();

    // Use test fixtures
    fixtures = await createTestFixtures({ workspace: { credits: 1000 } });
    
    // Load workspace and user entities
    testWorkspace = (await workspaceRepository.findById(fixtures.workspace.id))!;
    testWorkspaceId = fixtures.workspace.id;
    testUser = (await userRepository.findById(fixtures.user.id))!;
    testUserId = fixtures.user.id;
  });

  afterEach(async () => {
    await fixtures.cleanup();
  });

  describe('validateCredits', () => {
    it('should return true when workspace has sufficient credits', async () => {
      const result = await service.validateCredits(testWorkspaceId, 100);
      expect(result).toBe(true);
    });

    it('should return false when workspace has insufficient credits', async () => {
      const result = await service.validateCredits(testWorkspaceId, 2000);
      expect(result).toBe(false);
    });

    it('should throw error for non-positive amounts', async () => {
      await expect(service.validateCredits(testWorkspaceId, 0)).rejects.toThrow(
        'Credit amount must be positive'
      );
      await expect(
        service.validateCredits(testWorkspaceId, -10)
      ).rejects.toThrow('Credit amount must be positive');
    });

    it('should throw error for non-integer amounts', async () => {
      await expect(
        service.validateCredits(testWorkspaceId, 10.5)
      ).rejects.toThrow('Credit amount must be an integer');
    });

    it('should throw error for non-existent workspace', async () => {
      await expect(
        service.validateCredits('non-existent-id', 100)
      ).rejects.toThrow('Workspace not found');
    });
  });

  describe('allocateCredits', () => {
    it('should allocate credits successfully', async () => {
      const result = await service.allocateCredits(testWorkspaceId, 100);

      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe(testWorkspaceId);
      expect(result.amount).toBe(100);
      expect(result.allocationId).toBeDefined();
      expect(result.remainingCredits).toBe(900); // 1000 - 100 allocated

      // Verify workspace state
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(1000);
      expect(balance.allocated).toBe(100);
      expect(balance.available).toBe(900);
    });

    it('should throw InsufficientCreditsError when credits are insufficient', async () => {
      await expect(
        service.allocateCredits(testWorkspaceId, 2000)
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('should handle multiple allocations correctly', async () => {
      await service.allocateCredits(testWorkspaceId, 300);
      await service.allocateCredits(testWorkspaceId, 200);

      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(1000);
      expect(balance.allocated).toBe(500);
      expect(balance.available).toBe(500);
    });

    it('should prevent allocation when available credits are insufficient', async () => {
      // Allocate 800 credits
      await service.allocateCredits(testWorkspaceId, 800);

      // Try to allocate 300 more (only 200 available)
      await expect(
        service.allocateCredits(testWorkspaceId, 300)
      ).rejects.toThrow(InsufficientCreditsError);
    });

    it('should throw error for non-positive amounts', async () => {
      await expect(service.allocateCredits(testWorkspaceId, 0)).rejects.toThrow(
        'Credit amount must be positive'
      );
    });

    it('should throw error for non-integer amounts', async () => {
      await expect(
        service.allocateCredits(testWorkspaceId, 10.5)
      ).rejects.toThrow('Credit amount must be an integer');
    });
  });

  describe('consumeCredits', () => {
    it('should consume allocated credits successfully', async () => {
      // First allocate
      await service.allocateCredits(testWorkspaceId, 100);

      // Then consume
      const result = await service.consumeCredits(testWorkspaceId, 100);

      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe(testWorkspaceId);
      expect(result.amount).toBe(100);
      expect(result.remainingCredits).toBe(900);

      // Verify workspace state
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(900);
      expect(balance.allocated).toBe(0);
      expect(balance.available).toBe(900);
    });

    it('should throw error when trying to consume more than allocated', async () => {
      // Allocate 100
      await service.allocateCredits(testWorkspaceId, 100);

      // Try to consume 200
      await expect(
        service.consumeCredits(testWorkspaceId, 200)
      ).rejects.toThrow('Cannot consume more credits than allocated');
    });

    it('should throw error for non-positive amounts', async () => {
      await expect(service.consumeCredits(testWorkspaceId, 0)).rejects.toThrow(
        'Credit amount must be positive'
      );
    });

    it('should throw error for non-integer amounts', async () => {
      await expect(
        service.consumeCredits(testWorkspaceId, 10.5)
      ).rejects.toThrow('Credit amount must be an integer');
    });
  });

  describe('releaseCredits', () => {
    it('should release allocated credits successfully', async () => {
      // First allocate
      await service.allocateCredits(testWorkspaceId, 100);

      // Then release
      const result = await service.releaseCredits(testWorkspaceId, 100);

      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe(testWorkspaceId);
      expect(result.amount).toBe(100);
      expect(result.remainingCredits).toBe(1000); // Back to original

      // Verify workspace state
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(1000);
      expect(balance.allocated).toBe(0);
      expect(balance.available).toBe(1000);
    });

    it('should throw error when trying to release more than allocated', async () => {
      // Allocate 100
      await service.allocateCredits(testWorkspaceId, 100);

      // Try to release 200
      await expect(
        service.releaseCredits(testWorkspaceId, 200)
      ).rejects.toThrow('Cannot release more credits than allocated');
    });

    it('should throw error for non-positive amounts', async () => {
      await expect(service.releaseCredits(testWorkspaceId, 0)).rejects.toThrow(
        'Credit amount must be positive'
      );
    });

    it('should throw error for non-integer amounts', async () => {
      await expect(
        service.releaseCredits(testWorkspaceId, 10.5)
      ).rejects.toThrow('Credit amount must be an integer');
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits in one operation', async () => {
      const result = await service.deductCredits(testWorkspaceId, 100);

      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe(testWorkspaceId);
      expect(result.amount).toBe(100);
      expect(result.allocationId).toBeDefined();
      expect(result.remainingCredits).toBe(900);

      // Verify workspace state
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(900);
      expect(balance.allocated).toBe(0);
      expect(balance.available).toBe(900);
    });

    it('should throw error when credits are insufficient', async () => {
      await expect(
        service.deductCredits(testWorkspaceId, 2000)
      ).rejects.toThrow(InsufficientCreditsError);
    });
  });

  describe('refundCredits', () => {
    it('should refund credits successfully', async () => {
      // First deduct some credits
      await service.deductCredits(testWorkspaceId, 100);

      // Then refund them
      const result = await service.refundCredits(testWorkspaceId, 100);

      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe(testWorkspaceId);
      expect(result.amount).toBe(100);
      expect(result.remainingCredits).toBe(1000); // Back to original

      // Verify workspace state
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(1000);
      expect(balance.available).toBe(1000);
    });

    it('should throw error for non-positive amounts', async () => {
      await expect(service.refundCredits(testWorkspaceId, 0)).rejects.toThrow(
        'Credit amount must be positive'
      );
    });

    it('should throw error for non-integer amounts', async () => {
      await expect(
        service.refundCredits(testWorkspaceId, 10.5)
      ).rejects.toThrow('Credit amount must be an integer');
    });
  });

  describe('getCreditBalance', () => {
    it('should return correct credit balance', async () => {
      const balance = await service.getCreditBalance(testWorkspaceId);

      expect(balance.total).toBe(1000);
      expect(balance.allocated).toBe(0);
      expect(balance.available).toBe(1000);
    });

    it('should return correct balance after allocations', async () => {
      await service.allocateCredits(testWorkspaceId, 300);

      const balance = await service.getCreditBalance(testWorkspaceId);

      expect(balance.total).toBe(1000);
      expect(balance.allocated).toBe(300);
      expect(balance.available).toBe(700);
    });

    it('should throw error for non-existent workspace', async () => {
      await expect(service.getCreditBalance('non-existent-id')).rejects.toThrow(
        'Workspace not found'
      );
    });
  });

  describe('atomicity and transaction support', () => {
    it('should maintain atomicity during allocation', async () => {
      // This test verifies that allocation is atomic
      const result = await service.allocateCredits(testWorkspaceId, 100);

      expect(result.success).toBe(true);

      // Verify the state is consistent
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.allocated).toBe(100);
    });

    it('should maintain atomicity during consumption', async () => {
      // Allocate first
      await service.allocateCredits(testWorkspaceId, 100);

      // Consume
      const result = await service.consumeCredits(testWorkspaceId, 100);

      expect(result.success).toBe(true);

      // Verify the state is consistent
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(900);
      expect(balance.allocated).toBe(0);
    });

    it('should rollback on error during allocation', async () => {
      // Try to allocate more than available
      try {
        await service.allocateCredits(testWorkspaceId, 2000);
      } catch (error) {
        // Expected to fail
      }

      // Verify no credits were allocated
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(1000);
      expect(balance.allocated).toBe(0);
      expect(balance.available).toBe(1000);
    });
  });

  describe('edge cases', () => {
    it('should handle exact credit amount allocation', async () => {
      const result = await service.allocateCredits(testWorkspaceId, 1000);

      expect(result.success).toBe(true);
      expect(result.remainingCredits).toBe(0);
    });

    it('should handle allocation of 1 credit', async () => {
      const result = await service.allocateCredits(testWorkspaceId, 1);

      expect(result.success).toBe(true);
      expect(result.remainingCredits).toBe(999);
    });

    it('should handle multiple sequential operations', async () => {
      // Allocate
      await service.allocateCredits(testWorkspaceId, 100);

      // Consume
      await service.consumeCredits(testWorkspaceId, 100);

      // Allocate again
      await service.allocateCredits(testWorkspaceId, 200);

      // Release
      await service.releaseCredits(testWorkspaceId, 200);

      // Final balance should be 900 (1000 - 100 consumed)
      const balance = await service.getCreditBalance(testWorkspaceId);
      expect(balance.total).toBe(900);
      expect(balance.allocated).toBe(0);
      expect(balance.available).toBe(900);
    });
  });
});
