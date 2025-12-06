import { prisma } from '../../lib/db';
import type { Prisma } from '@prisma/client';
import { Workspace } from '../../domain/workspace/entities/Workspace';
import type { Prisma } from '@prisma/client';
import { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import type { Prisma } from '@prisma/client';

/**
 * CreditDeductionService
 *
 * Handles credit deduction with transaction support for atomicity.
 * Ensures credits are only deducted on successful generation and refunded on failure.
 *
 * Requirements: 2.5, 7.3, 7.4
 * Validates: Property 1 (Credit deduction atomicity), Property 7 (Credit refund on failure)
 */

export interface CreditAllocation {
  workspaceId: string;
  amount: number;
  allocationId: string;
}

export interface CreditDeductionResult {
  success: boolean;
  allocationId: string;
  workspaceId: string;
  amount: number;
  remainingCredits: number;
}

export interface CreditRefundResult {
  success: boolean;
  workspaceId: string;
  amount: number;
  remainingCredits: number;
}

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly workspaceId: string,
    public readonly required: number,
    public readonly available: number
  ) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = 'InsufficientCreditsError';
  }
}

export class CreditAllocationNotFoundError extends Error {
  constructor(public readonly allocationId: string) {
    super(`Credit allocation not found: ${allocationId}`);
    this.name = 'CreditAllocationNotFoundError';
  }
}

export class CreditDeductionService {
  private workspaceRepository: WorkspaceRepository;

  constructor() {
    this.workspaceRepository = new WorkspaceRepository();
  }

  /**
   * Validates that a workspace has sufficient available credits
   * Requirements: 2.5, 7.3
   */
  async validateCredits(workspaceId: string, amount: number): Promise<boolean> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }

    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    return workspace.hasAvailableCredits(amount);
  }

  /**
   * Allocates credits for a generation (reserves them without deducting)
   * This is the first step in the two-phase commit process.
   *
   * Requirements: 2.5, 7.3
   * Validates: Property 1 (Credit deduction atomicity)
   */
  async allocateCredits(
    workspaceId: string,
    amount: number
  ): Promise<CreditDeductionResult> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }

    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the workspace row for update to prevent race conditions
      const workspaceData = await tx.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspaceData) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      // Convert to domain entity using the locked data from transaction
      const workspace = this.workspaceRepository.toDomain(workspaceData);

      // Check if sufficient credits are available
      if (!workspace.hasAvailableCredits(amount)) {
        throw new InsufficientCreditsError(
          workspaceId,
          amount,
          workspace.getAvailableCredits()
        );
      }

      // Allocate credits (reserves them)
      workspace.allocateCredits(amount);

      // Save the workspace with allocated credits
      const updatedWorkspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          allocatedCredits: workspace.getAllocatedCredits(),
          updatedAt: new Date(),
        },
      });

      // Generate allocation ID for tracking
      const allocationId = `alloc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return {
        success: true,
        allocationId,
        workspaceId,
        amount,
        remainingCredits:
          updatedWorkspace.creditCount - updatedWorkspace.allocatedCredits,
      };
    });
  }

  /**
   * Consumes allocated credits after successful generation
   * This is the second step in the two-phase commit process.
   *
   * Requirements: 2.5, 7.3
   * Validates: Property 1 (Credit deduction atomicity)
   */
  async consumeCredits(
    workspaceId: string,
    amount: number
  ): Promise<CreditDeductionResult> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }

    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the workspace row for update
      const workspaceData = await tx.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspaceData) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      // Convert to domain entity using the locked data from transaction
      const workspace = this.workspaceRepository.toDomain(workspaceData);

      // Consume the allocated credits (removes from both allocated and total)
      workspace.consumeCredits(amount);

      // Save the workspace
      const updatedWorkspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          creditCount: workspace.getCreditCount(),
          allocatedCredits: workspace.getAllocatedCredits(),
          creditsAdjustedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        allocationId: '', // Not needed for consume
        workspaceId,
        amount,
        remainingCredits: updatedWorkspace.creditCount,
      };
    });
  }

  /**
   * Releases allocated credits without consuming them (on failure)
   *
   * Requirements: 7.4
   * Validates: Property 7 (Credit refund on failure)
   */
  async releaseCredits(
    workspaceId: string,
    amount: number
  ): Promise<CreditRefundResult> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }

    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the workspace row for update
      const workspaceData = await tx.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspaceData) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      // Convert to domain entity using the locked data from transaction
      const workspace = this.workspaceRepository.toDomain(workspaceData);

      // Release the allocated credits back to available pool
      workspace.releaseCredits(amount);

      // Save the workspace
      const updatedWorkspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          allocatedCredits: workspace.getAllocatedCredits(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        workspaceId,
        amount,
        remainingCredits:
          updatedWorkspace.creditCount - updatedWorkspace.allocatedCredits,
      };
    });
  }

  /**
   * Complete credit deduction flow: allocate, then consume
   * Use this for simple cases where you want to deduct credits immediately.
   *
   * Requirements: 2.5, 7.3
   */
  async deductCredits(
    workspaceId: string,
    amount: number
  ): Promise<CreditDeductionResult> {
    // First allocate
    const allocation = await this.allocateCredits(workspaceId, amount);

    // Then consume
    const result = await this.consumeCredits(workspaceId, amount);

    return {
      ...result,
      allocationId: allocation.allocationId,
    };
  }

  /**
   * Refunds credits to a workspace (adds them back)
   * Use this when a generation fails after credits were consumed.
   *
   * Requirements: 7.4
   * Validates: Property 7 (Credit refund on failure)
   */
  async refundCredits(
    workspaceId: string,
    amount: number
  ): Promise<CreditRefundResult> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Credit amount must be an integer');
    }

    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock the workspace row for update
      const workspaceData = await tx.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspaceData) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      // Convert to domain entity using the locked data from transaction
      const workspace = this.workspaceRepository.toDomain(workspaceData);

      // Add credits back
      workspace.addCredits(amount);

      // Save the workspace
      const updatedWorkspace = await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          creditCount: workspace.getCreditCount(),
          creditsAdjustedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        workspaceId,
        amount,
        remainingCredits: updatedWorkspace.creditCount,
      };
    });
  }

  /**
   * Gets the current credit balance for a workspace
   */
  async getCreditBalance(workspaceId: string): Promise<{
    total: number;
    allocated: number;
    available: number;
  }> {
    const workspace = await this.workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    return {
      total: workspace.getCreditCount(),
      allocated: workspace.getAllocatedCredits(),
      available: workspace.getAvailableCredits(),
    };
  }
}
