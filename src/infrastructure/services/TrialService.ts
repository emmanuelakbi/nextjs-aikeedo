import { prisma } from '../../lib/db';

/**
 * TrialService
 *
 * Handles trial period management and eligibility checks
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

export interface TrialEligibility {
  isEligible: boolean;
  reason?: string;
  hasUsedTrial: boolean;
}

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number | null;
  trialEnd: Date | null;
}

export class TrialServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'TrialServiceError';
  }
}

export class TrialService {
  /**
   * Check if workspace is eligible for trial
   * Requirements: 8.4
   *
   * @param workspaceId - Workspace ID
   * @returns Trial eligibility information
   */
  async checkTrialEligibility(workspaceId: string): Promise<TrialEligibility> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { subscription: true },
      });

      if (!workspace) {
        throw new TrialServiceError('Workspace not found', 'WORKSPACE_NOT_FOUND');
      }

      // Check if workspace has already used trial
      // Requirements: 8.4
      if (workspace.isTrialed) {
        return {
          isEligible: false,
          reason: 'Workspace has already used trial period',
          hasUsedTrial: true,
        };
      }

      // Check if workspace has an active subscription
      if (workspace.subscription && 
          (workspace.subscription.status === 'ACTIVE' || 
           workspace.subscription.status === 'TRIALING')) {
        return {
          isEligible: false,
          reason: 'Workspace already has an active subscription',
          hasUsedTrial: workspace.isTrialed,
        };
      }

      return {
        isEligible: true,
        hasUsedTrial: false,
      };
    } catch (error) {
      if (error instanceof TrialServiceError) {
        throw error;
      }
      throw new TrialServiceError(
        `Failed to check trial eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ELIGIBILITY_CHECK_FAILED'
      );
    }
  }

  /**
   * Get trial status for a workspace
   * Requirements: 8.5
   *
   * @param workspaceId - Workspace ID
   * @returns Trial status information
   */
  async getTrialStatus(workspaceId: string): Promise<TrialStatus> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { workspaceId },
      });

      if (!subscription || subscription.status !== 'TRIALING' || !subscription.trialEnd) {
        return {
          isActive: false,
          daysRemaining: null,
          trialEnd: null,
        };
      }

      const now = new Date();
      const trialEnd = subscription.trialEnd;
      const diffTime = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        isActive: true,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        trialEnd,
      };
    } catch (error) {
      throw new TrialServiceError(
        `Failed to get trial status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STATUS_CHECK_FAILED'
      );
    }
  }

  /**
   * Mark workspace as having used trial
   * Requirements: 8.4
   *
   * @param workspaceId - Workspace ID
   */
  async markTrialAsUsed(workspaceId: string): Promise<void> {
    try {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { isTrialed: true },
      });
    } catch (error) {
      throw new TrialServiceError(
        `Failed to mark trial as used: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MARK_TRIAL_FAILED'
      );
    }
  }

  /**
   * Calculate days remaining in trial
   * Requirements: 8.5
   *
   * @param trialEnd - Trial end date
   * @returns Days remaining (0 if trial has ended)
   */
  calculateDaysRemaining(trialEnd: Date): number {
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return daysRemaining > 0 ? daysRemaining : 0;
  }
}

// Export singleton instance
export const trialService = new TrialService();
