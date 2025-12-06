import { stripeService } from './StripeService';
import { prisma } from '../../lib/db';
import type { ProrationCalculation } from '../../types/billing';

/**
 * ProrationService
 *
 * Handles proration calculations for subscription changes, including
 * upgrade charges and downgrade credits.
 *
 * Requirements: 9.1, 9.2, 9.4, 9.5
 */

export class ProrationServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ProrationServiceError';
  }
}

export interface ProrationPreviewParams {
  subscriptionId: string;
  newPlanId: string;
}

export interface ProrationDetails {
  isUpgrade: boolean;
  currentPlan: {
    id: string;
    name: string;
    price: number;
    interval: string;
  };
  newPlan: {
    id: string;
    name: string;
    price: number;
    interval: string;
  };
  calculation: ProrationCalculation;
  immediateCharge: number;
  nextBillingAmount: number;
  effectiveDate: Date;
}

export class ProrationService {
  /**
   * Calculate proration for a subscription change
   * Requirements: 9.1, 9.2, 9.4
   *
   * @param params - Proration preview parameters
   * @returns Detailed proration information
   */
  async calculateProration(
    params: ProrationPreviewParams
  ): Promise<ProrationDetails> {
    try {
      // Get current subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: params.subscriptionId },
        include: { plan: true },
      });

      if (!subscription) {
        throw new ProrationServiceError(
          'Subscription not found',
          'SUBSCRIPTION_NOT_FOUND'
        );
      }

      // Get new plan
      const newPlan = await prisma.plan.findUnique({
        where: { id: params.newPlanId },
      });

      if (!newPlan) {
        throw new ProrationServiceError('Plan not found', 'PLAN_NOT_FOUND');
      }

      if (!newPlan.isActive) {
        throw new ProrationServiceError('Plan is not active', 'PLAN_INACTIVE');
      }

      // Ensure plans have the same interval
      if (subscription.plan.interval !== newPlan.interval) {
        throw new ProrationServiceError(
          'Cannot change between different billing intervals',
          'INTERVAL_MISMATCH'
        );
      }

      // Determine if this is an upgrade or downgrade
      const isUpgrade = newPlan.price > subscription.plan.price;

      // Calculate proration using daily rate
      // Requirements: 9.4
      const calculation = this.calculateDailyProration(
        subscription.plan.price,
        newPlan.price,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd,
        new Date()
      );

      // For upgrades: immediate charge for prorated difference
      // Requirements: 9.1
      // For downgrades: credit applied to next billing cycle
      // Requirements: 9.2
      const immediateCharge = isUpgrade ? calculation.proratedAmount : 0;
      const nextBillingAmount = isUpgrade
        ? newPlan.price
        : newPlan.price - calculation.creditAmount;

      return {
        isUpgrade,
        currentPlan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: subscription.plan.price,
          interval: subscription.plan.interval,
        },
        newPlan: {
          id: newPlan.id,
          name: newPlan.name,
          price: newPlan.price,
          interval: newPlan.interval,
        },
        calculation,
        immediateCharge,
        nextBillingAmount,
        effectiveDate: isUpgrade ? new Date() : subscription.currentPeriodEnd,
      };
    } catch (error) {
      if (error instanceof ProrationServiceError) {
        throw error;
      }
      throw new ProrationServiceError(
        `Failed to calculate proration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALCULATION_FAILED'
      );
    }
  }

  /**
   * Calculate proration using daily rate
   * Requirements: 9.4
   *
   * @param currentPrice - Current plan price
   * @param newPrice - New plan price
   * @param periodStart - Current period start date
   * @param periodEnd - Current period end date
   * @param changeDate - Date of the change
   * @returns Proration calculation details
   */
  private calculateDailyProration(
    currentPrice: number,
    newPrice: number,
    periodStart: Date,
    periodEnd: Date,
    changeDate: Date
  ): ProrationCalculation {
    // Calculate total days in the billing period
    const totalDaysInPeriod = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate days remaining from change date to period end
    const daysRemaining = Math.ceil(
      (periodEnd.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Ensure days remaining is not negative
    const effectiveDaysRemaining = Math.max(0, daysRemaining);

    // Calculate daily rates
    const currentDailyRate = currentPrice / totalDaysInPeriod;
    const newDailyRate = newPrice / totalDaysInPeriod;

    // Calculate unused amount from current plan
    const unusedAmount = currentDailyRate * effectiveDaysRemaining;

    // Calculate cost for remaining period at new rate
    const newPeriodCost = newDailyRate * effectiveDaysRemaining;

    // For upgrades: charge the difference
    // For downgrades: credit the difference
    const proratedAmount = Math.max(0, newPeriodCost - unusedAmount);
    const creditAmount = Math.max(0, unusedAmount - newPeriodCost);

    return {
      currentPlanPrice: currentPrice,
      newPlanPrice: newPrice,
      daysRemaining: effectiveDaysRemaining,
      totalDaysInPeriod,
      proratedAmount: Math.round(proratedAmount * 100) / 100, // Round to 2 decimals
      creditAmount: Math.round(creditAmount * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Get proration preview from Stripe
   * This uses Stripe's upcoming invoice API to get exact proration amounts
   * Requirements: 9.1, 9.5
   *
   * @param subscriptionId - Database subscription ID
   * @param newPlanId - New plan ID
   * @returns Stripe's proration calculation
   */
  async getStripeProrationPreview(
    subscriptionId: string,
    newPlanId: string
  ): Promise<{
    immediateCharge: number;
    prorationDate: number;
    lineItems: Array<{
      description: string;
      amount: number;
      period: { start: number; end: number };
    }>;
  }> {
    try {
      // Get subscription
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new ProrationServiceError(
          'Subscription not found',
          'SUBSCRIPTION_NOT_FOUND'
        );
      }

      // Get new plan
      const newPlan = await prisma.plan.findUnique({
        where: { id: newPlanId },
      });

      if (!newPlan) {
        throw new ProrationServiceError('Plan not found', 'PLAN_NOT_FOUND');
      }

      // Get upcoming invoice from Stripe with proration
      const upcomingInvoice = await stripeService.calculateProration(
        subscription.stripeSubscriptionId,
        newPlan.stripePriceId
      );

      // Extract line items with proration details
      const lineItems = upcomingInvoice.lines.data.map((line) => ({
        description: line.description || '',
        amount: line.amount / 100, // Convert from cents
        period: {
          start: line.period.start,
          end: line.period.end,
        },
      }));

      return {
        immediateCharge: upcomingInvoice.amount_due / 100, // Convert from cents
        prorationDate: upcomingInvoice.period_start,
        lineItems,
      };
    } catch (error) {
      if (error instanceof ProrationServiceError) {
        throw error;
      }
      throw new ProrationServiceError(
        `Failed to get Stripe proration preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STRIPE_PREVIEW_FAILED'
      );
    }
  }

  /**
   * Format proration breakdown for display
   * Requirements: 9.5
   *
   * @param details - Proration details
   * @returns Formatted breakdown
   */
  formatProrationBreakdown(details: ProrationDetails): {
    summary: string;
    items: Array<{ label: string; amount: number; description: string }>;
  } {
    const items: Array<{ label: string; amount: number; description: string }> =
      [];

    if (details.isUpgrade) {
      // Upgrade breakdown
      items.push({
        label: 'Current Plan (Unused)',
        amount:
          -details.calculation.currentPlanPrice *
          (details.calculation.daysRemaining /
            details.calculation.totalDaysInPeriod),
        description: `Credit for ${details.calculation.daysRemaining} unused days`,
      });

      items.push({
        label: 'New Plan (Prorated)',
        amount:
          details.calculation.newPlanPrice *
          (details.calculation.daysRemaining /
            details.calculation.totalDaysInPeriod),
        description: `Charge for ${details.calculation.daysRemaining} days at new rate`,
      });

      items.push({
        label: 'Immediate Charge',
        amount: details.immediateCharge,
        description: 'Due today',
      });
    } else {
      // Downgrade breakdown
      items.push({
        label: 'Current Plan (Unused)',
        amount:
          details.calculation.currentPlanPrice *
          (details.calculation.daysRemaining /
            details.calculation.totalDaysInPeriod),
        description: `Credit for ${details.calculation.daysRemaining} unused days`,
      });

      items.push({
        label: 'Credit Applied',
        amount: -details.calculation.creditAmount,
        description: 'Applied to next billing cycle',
      });

      items.push({
        label: 'Next Billing Amount',
        amount: details.nextBillingAmount,
        description: `Effective ${details.effectiveDate.toLocaleDateString()}`,
      });
    }

    const summary = details.isUpgrade
      ? `Upgrading to ${details.newPlan.name}. You'll be charged $${details.immediateCharge.toFixed(2)} today for the remaining ${details.calculation.daysRemaining} days.`
      : `Downgrading to ${details.newPlan.name}. Your plan will change on ${details.effectiveDate.toLocaleDateString()} and you'll receive a $${details.calculation.creditAmount.toFixed(2)} credit.`;

    return { summary, items };
  }
}

// Export singleton instance
export const prorationService = new ProrationService();
