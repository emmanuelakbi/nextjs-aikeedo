import Stripe from 'stripe';
import { stripeService } from './StripeService';
import { prisma } from '../../lib/db';
import { SubscriptionStatus, PlanInterval } from '@prisma/client';

/**
 * SubscriptionService
 *
 * Handles subscription lifecycle management including creation, updates,
 * cancellation, and synchronization with Stripe.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */

export interface CreateSubscriptionParams {
  workspaceId: string;
  planId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  newPlanId: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean;
  reason?: string;
}

export interface SubscriptionDetails {
  id: string;
  workspaceId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'SubscriptionServiceError';
  }
}

export class SubscriptionService {
  /**
   * Create a checkout session for a new subscription
   * Requirements: 2.1
   *
   * @param params - Subscription creation parameters
   * @returns Stripe checkout session
   */
  async createCheckoutSession(
    params: CreateSubscriptionParams
  ): Promise<Stripe.Checkout.Session> {
    try {
      // Validate workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { id: params.workspaceId },
        include: { subscription: true },
      });

      if (!workspace) {
        throw new SubscriptionServiceError('Workspace not found', 'WORKSPACE_NOT_FOUND');
      }

      // Check if workspace already has an active subscription
      if (workspace.subscription && workspace.subscription.status === 'ACTIVE') {
        throw new SubscriptionServiceError(
          'Workspace already has an active subscription',
          'SUBSCRIPTION_EXISTS'
        );
      }

      // Validate plan exists and is active
      const plan = await prisma.plan.findUnique({
        where: { id: params.planId },
      });

      if (!plan) {
        throw new SubscriptionServiceError('Plan not found', 'PLAN_NOT_FOUND');
      }

      if (!plan.isActive) {
        throw new SubscriptionServiceError(
          'Plan is not available for subscription',
          'PLAN_INACTIVE'
        );
      }

      // Check if workspace has already used trial
      // Requirements: 8.4
      const hasUsedTrial = workspace.isTrialed;
      const shouldOfferTrial = params.trialDays && params.trialDays > 0 && !hasUsedTrial;

      // Create checkout session
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        customer_email: params.email,
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          workspaceId: params.workspaceId,
          planId: params.planId,
          ...params.metadata,
        },
        subscription_data: {
          metadata: {
            workspaceId: params.workspaceId,
            planId: params.planId,
          },
        },
      };

      // Add trial if applicable
      if (shouldOfferTrial) {
        sessionParams.subscription_data!.trial_period_days = params.trialDays;
      }

      const session = await stripeService.createCheckoutSession(sessionParams);

      return session;
    } catch (error) {
      if (error instanceof SubscriptionServiceError) {
        throw error;
      }
      throw new SubscriptionServiceError(
        `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CHECKOUT_CREATION_FAILED'
      );
    }
  }

  /**
   * Create or update subscription from Stripe webhook
   * Requirements: 2.2, 7.2
   *
   * @param stripeSubscription - Stripe subscription object
   */
  async syncSubscriptionFromStripe(
    stripeSubscription: Stripe.Subscription
  ): Promise<SubscriptionDetails> {
    try {
      const workspaceId = stripeSubscription.metadata.workspaceId;
      const planId = stripeSubscription.metadata.planId;

      if (!workspaceId || !planId) {
        throw new SubscriptionServiceError(
          'Missing workspace or plan ID in subscription metadata',
          'INVALID_METADATA'
        );
      }

      // Map Stripe status to our status
      const status = this.mapStripeStatus(stripeSubscription.status);

      // Convert timestamps
      const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      const trialEnd = stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null;
      const canceledAt = stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null;

      // Upsert subscription
      const subscription = await prisma.subscription.upsert({
        where: {
          stripeSubscriptionId: stripeSubscription.id,
        },
        create: {
          workspaceId,
          planId,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: stripeSubscription.customer as string,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          canceledAt,
          trialEnd,
        },
        update: {
          planId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          canceledAt,
          trialEnd,
          updatedAt: new Date(),
        },
      });

      // If subscription is active or trialing, allocate credits
      // Requirements: 2.2, 3.1
      if (status === 'ACTIVE' || status === 'TRIALING') {
        await this.allocateCredits(workspaceId, planId);
      }

      // Mark workspace as trialed if this was a trial
      // Requirements: 8.4
      if (trialEnd && !canceledAt) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: { isTrialed: true },
        });
      }

      return subscription;
    } catch (error) {
      if (error instanceof SubscriptionServiceError) {
        throw error;
      }
      throw new SubscriptionServiceError(
        `Failed to sync subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SYNC_FAILED'
      );
    }
  }

  /**
   * Upgrade or downgrade a subscription
   * Requirements: 3.1, 3.2
   *
   * @param params - Update parameters
   */
  async updateSubscription(
    params: UpdateSubscriptionParams
  ): Promise<SubscriptionDetails> {
    try {
      // Get current subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: params.subscriptionId },
        include: { plan: true },
      });

      if (!subscription) {
        throw new SubscriptionServiceError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
      }

      // Get new plan
      const newPlan = await prisma.plan.findUnique({
        where: { id: params.newPlanId },
      });

      if (!newPlan) {
        throw new SubscriptionServiceError('Plan not found', 'PLAN_NOT_FOUND');
      }

      if (!newPlan.isActive) {
        throw new SubscriptionServiceError('Plan is not active', 'PLAN_INACTIVE');
      }

      // Get Stripe subscription
      const stripeSubscription = await stripeService.retrieveSubscription(
        subscription.stripeSubscriptionId
      );

      if (!stripeSubscription.items.data[0]) {
        throw new SubscriptionServiceError(
          'Subscription has no items',
          'INVALID_SUBSCRIPTION'
        );
      }

      // Determine proration behavior
      // Requirements: 3.1 (upgrade - immediate), 3.2 (downgrade - at period end)
      const isUpgrade = newPlan.price > subscription.plan.price;
      const prorationBehavior =
        params.prorationBehavior || (isUpgrade ? 'create_prorations' : 'none');

      let updatedStripeSubscription: Stripe.Subscription;

      if (isUpgrade) {
        // For upgrades: apply immediately with proration
        // Requirements: 3.1
        updatedStripeSubscription = await stripeService.updateSubscription(
          subscription.stripeSubscriptionId,
          {
            items: [
              {
                id: stripeSubscription.items.data[0].id,
                price: newPlan.stripePriceId,
              },
            ],
            proration_behavior: prorationBehavior,
            metadata: {
              ...stripeSubscription.metadata,
              planId: newPlan.id,
            },
          }
        );
      } else {
        // For downgrades: schedule change at period end
        // Requirements: 3.2, 9.2
        updatedStripeSubscription = await stripeService.updateSubscription(
          subscription.stripeSubscriptionId,
          {
            items: [
              {
                id: stripeSubscription.items.data[0].id,
                price: newPlan.stripePriceId,
              },
            ],
            proration_behavior: 'none',
            billing_cycle_anchor: 'unchanged',
            metadata: {
              ...stripeSubscription.metadata,
              planId: newPlan.id,
              scheduledDowngrade: 'true',
            },
          }
        );
      }

      // Sync the updated subscription
      return await this.syncSubscriptionFromStripe(updatedStripeSubscription);
    } catch (error) {
      if (error instanceof SubscriptionServiceError) {
        throw error;
      }
      throw new SubscriptionServiceError(
        `Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_FAILED'
      );
    }
  }

  /**
   * Cancel a subscription
   * Requirements: 3.3, 8.3
   *
   * @param params - Cancellation parameters
   */
  async cancelSubscription(
    params: CancelSubscriptionParams
  ): Promise<SubscriptionDetails> {
    try {
      // Get subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: params.subscriptionId },
      });

      if (!subscription) {
        throw new SubscriptionServiceError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
      }

      // For trialing subscriptions, cancel immediately to prevent charging
      // Requirements: 8.3
      const isTrialing = subscription.status === 'TRIALING';
      const cancelAtPeriodEnd = isTrialing ? false : (params.cancelAtPeriodEnd ?? true);

      // Cancel in Stripe
      const canceledStripeSubscription = await stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        cancelAtPeriodEnd
      );

      // Sync the canceled subscription
      return await this.syncSubscriptionFromStripe(canceledStripeSubscription);
    } catch (error) {
      if (error instanceof SubscriptionServiceError) {
        throw error;
      }
      throw new SubscriptionServiceError(
        `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CANCEL_FAILED'
      );
    }
  }

  /**
   * Reactivate a canceled subscription
   * Requirements: 3.3
   *
   * @param subscriptionId - Subscription ID
   */
  async reactivateSubscription(subscriptionId: string): Promise<SubscriptionDetails> {
    try {
      // Get subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new SubscriptionServiceError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
      }

      if (!subscription.cancelAtPeriodEnd) {
        throw new SubscriptionServiceError(
          'Subscription is not scheduled for cancellation',
          'NOT_SCHEDULED_FOR_CANCELLATION'
        );
      }

      // Reactivate in Stripe
      const reactivatedStripeSubscription = await stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      // Sync the reactivated subscription
      return await this.syncSubscriptionFromStripe(reactivatedStripeSubscription);
    } catch (error) {
      if (error instanceof SubscriptionServiceError) {
        throw error;
      }
      throw new SubscriptionServiceError(
        `Failed to reactivate subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'REACTIVATE_FAILED'
      );
    }
  }

  /**
   * Get subscription by workspace ID
   *
   * @param workspaceId - Workspace ID
   */
  async getSubscriptionByWorkspaceId(
    workspaceId: string
  ): Promise<SubscriptionDetails | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
    });

    return subscription;
  }

  /**
   * Get subscription by Stripe subscription ID
   *
   * @param stripeSubscriptionId - Stripe subscription ID
   */
  async getSubscriptionByStripeId(
    stripeSubscriptionId: string
  ): Promise<SubscriptionDetails | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    return subscription;
  }

  /**
   * Check if workspace has active subscription
   * Requirements: 2.2, 3.4
   *
   * @param workspaceId - Workspace ID
   */
  async hasActiveSubscription(workspaceId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId },
    });

    if (!subscription) {
      return false;
    }

    return subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';
  }

  /**
   * Allocate credits to workspace based on plan
   * Requirements: 2.2, 3.1
   *
   * @param workspaceId - Workspace ID
   * @param planId - Plan ID
   */
  private async allocateCredits(workspaceId: string, planId: string): Promise<void> {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new SubscriptionServiceError('Plan not found', 'PLAN_NOT_FOUND');
    }

    // Get current workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new SubscriptionServiceError('Workspace not found', 'WORKSPACE_NOT_FOUND');
    }

    // Only allocate if plan has credit count (not unlimited)
    if (plan.creditCount !== null) {
      const balanceBefore = workspace.creditCount;
      const balanceAfter = plan.creditCount;

      // Update workspace credits
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          creditCount: plan.creditCount,
          allocatedCredits: plan.creditCount,
          creditsAdjustedAt: new Date(),
        },
      });

      // Create credit transaction
      await prisma.creditTransaction.create({
        data: {
          workspaceId,
          amount: plan.creditCount,
          type: 'SUBSCRIPTION_ALLOCATION',
          description: `Credits allocated from plan: ${plan.name}`,
          referenceId: planId,
          referenceType: 'plan',
          balanceBefore,
          balanceAfter,
        },
      });
    }
  }

  /**
   * Map Stripe subscription status to our status enum
   *
   * @param stripeStatus - Stripe subscription status
   */
  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: 'ACTIVE',
      canceled: 'CANCELED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
      past_due: 'PAST_DUE',
      trialing: 'TRIALING',
      unpaid: 'UNPAID',
      paused: 'ACTIVE', // Treat paused as active for now
    };

    return statusMap[stripeStatus] || 'CANCELED';
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
