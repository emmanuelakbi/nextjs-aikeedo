import { PrismaClient, PaymentMethod } from '@prisma/client';
import { stripeService } from './StripeService';
import Stripe from 'stripe';

/**
 * PaymentMethodService
 *
 * Manages payment methods for workspaces, including adding, updating,
 * removing, and setting default payment methods.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

export class PaymentMethodService {
  private static instance: PaymentMethodService | null = null;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get singleton instance of PaymentMethodService
   */
  public static getInstance(prisma: PrismaClient): PaymentMethodService {
    if (!PaymentMethodService.instance) {
      PaymentMethodService.instance = new PaymentMethodService(prisma);
    }
    return PaymentMethodService.instance;
  }

  /**
   * Add a payment method to a workspace
   * Requirements: 6.1
   *
   * @param workspaceId - Workspace ID
   * @param stripePaymentMethodId - Stripe payment method ID
   * @param stripeCustomerId - Stripe customer ID
   * @param setAsDefault - Whether to set as default payment method
   * @returns Created payment method
   */
  public async addPaymentMethod(
    workspaceId: string,
    stripePaymentMethodId: string,
    stripeCustomerId: string,
    setAsDefault: boolean = false
  ): Promise<PaymentMethod> {
    // Attach payment method to customer in Stripe
    const stripePaymentMethod = await stripeService.attachPaymentMethod(
      stripePaymentMethodId,
      stripeCustomerId
    );

    // Extract payment method details
    const { type, card } = stripePaymentMethod;
    const last4 = card?.last4 || null;
    const brand = card?.brand || null;
    const expiryMonth = card?.exp_month || null;
    const expiryYear = card?.exp_year || null;

    // If setting as default, unset other default payment methods
    if (setAsDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: {
          workspaceId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Update default payment method in Stripe
      await stripeService.updateCustomer(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: stripePaymentMethodId,
        },
      });
    }

    // Create payment method record in database
    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        workspaceId,
        stripePaymentMethodId,
        type,
        last4,
        brand,
        expiryMonth,
        expiryYear,
        isDefault: setAsDefault,
      },
    });

    return paymentMethod;
  }

  /**
   * List payment methods for a workspace
   * Requirements: 6.1
   *
   * @param workspaceId - Workspace ID
   * @returns List of payment methods
   */
  public async listPaymentMethods(
    workspaceId: string
  ): Promise<PaymentMethod[]> {
    return await this.prisma.paymentMethod.findMany({
      where: {
        workspaceId,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get a payment method by ID
   *
   * @param paymentMethodId - Payment method ID
   * @returns Payment method or null
   */
  public async getPaymentMethod(
    paymentMethodId: string
  ): Promise<PaymentMethod | null> {
    return await this.prisma.paymentMethod.findUnique({
      where: {
        id: paymentMethodId,
      },
    });
  }

  /**
   * Update a payment method (set as default)
   * Requirements: 6.2
   *
   * @param paymentMethodId - Payment method ID
   * @param workspaceId - Workspace ID
   * @param stripeCustomerId - Stripe customer ID
   * @returns Updated payment method
   */
  public async setDefaultPaymentMethod(
    paymentMethodId: string,
    workspaceId: string,
    stripeCustomerId: string
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.getPaymentMethod(paymentMethodId);

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    if (paymentMethod.workspaceId !== workspaceId) {
      throw new Error('Payment method does not belong to this workspace');
    }

    // Unset other default payment methods
    await this.prisma.paymentMethod.updateMany({
      where: {
        workspaceId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Update default payment method in Stripe
    await stripeService.updateCustomer(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.stripePaymentMethodId,
      },
    });

    // Set as default in database
    return await this.prisma.paymentMethod.update({
      where: {
        id: paymentMethodId,
      },
      data: {
        isDefault: true,
      },
    });
  }

  /**
   * Remove a payment method
   * Requirements: 6.3
   *
   * @param paymentMethodId - Payment method ID
   * @param workspaceId - Workspace ID
   * @returns Deleted payment method
   */
  public async removePaymentMethod(
    paymentMethodId: string,
    workspaceId: string
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.getPaymentMethod(paymentMethodId);

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    if (paymentMethod.workspaceId !== workspaceId) {
      throw new Error('Payment method does not belong to this workspace');
    }

    // Check if this is the only payment method
    const paymentMethodCount = await this.prisma.paymentMethod.count({
      where: {
        workspaceId,
      },
    });

    if (paymentMethodCount === 1) {
      throw new Error('Cannot remove the only payment method');
    }

    // Detach payment method from Stripe
    await stripeService.detachPaymentMethod(
      paymentMethod.stripePaymentMethodId
    );

    // Delete from database
    return await this.prisma.paymentMethod.delete({
      where: {
        id: paymentMethodId,
      },
    });
  }

  /**
   * Check for expiring payment methods and return them
   * Requirements: 6.4
   *
   * @param workspaceId - Workspace ID
   * @param daysThreshold - Days before expiry to consider (default: 30)
   * @returns List of expiring payment methods
   */
  public async getExpiringPaymentMethods(
    workspaceId: string,
    daysThreshold: number = 30
  ): Promise<PaymentMethod[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    // Calculate threshold date
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    const thresholdYear = thresholdDate.getFullYear();
    const thresholdMonth = thresholdDate.getMonth() + 1;

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        workspaceId,
        expiryYear: {
          not: null,
        },
        expiryMonth: {
          not: null,
        },
      },
    });

    // Filter payment methods that are expiring within threshold
    return paymentMethods.filter((pm) => {
      if (!pm.expiryYear || !pm.expiryMonth) return false;

      // Check if already expired
      if (
        pm.expiryYear < currentYear ||
        (pm.expiryYear === currentYear && pm.expiryMonth < currentMonth)
      ) {
        return true;
      }

      // Check if expiring within threshold
      if (
        pm.expiryYear < thresholdYear ||
        (pm.expiryYear === thresholdYear && pm.expiryMonth <= thresholdMonth)
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Sync payment methods from Stripe
   * Useful for ensuring local database is in sync with Stripe
   *
   * @param workspaceId - Workspace ID
   * @param stripeCustomerId - Stripe customer ID
   * @returns Synced payment methods
   */
  public async syncPaymentMethods(
    workspaceId: string,
    stripeCustomerId: string
  ): Promise<PaymentMethod[]> {
    // Get payment methods from Stripe
    const stripePaymentMethods = await stripeService.listPaymentMethods(
      stripeCustomerId
    );

    // Get existing payment methods from database
    const existingPaymentMethods = await this.listPaymentMethods(workspaceId);
    const existingStripeIds = new Set(
      existingPaymentMethods.map((pm) => pm.stripePaymentMethodId)
    );

    // Add new payment methods from Stripe
    for (const stripePm of stripePaymentMethods.data) {
      if (!existingStripeIds.has(stripePm.id)) {
        const { type, card } = stripePm;
        const last4 = card?.last4 || null;
        const brand = card?.brand || null;
        const expiryMonth = card?.exp_month || null;
        const expiryYear = card?.exp_year || null;

        await this.prisma.paymentMethod.create({
          data: {
            workspaceId,
            stripePaymentMethodId: stripePm.id,
            type,
            last4,
            brand,
            expiryMonth,
            expiryYear,
            isDefault: false,
          },
        });
      }
    }

    // Return updated list
    return await this.listPaymentMethods(workspaceId);
  }
}

// Export singleton instance factory
export function createPaymentMethodService(
  prisma: PrismaClient
): PaymentMethodService {
  return PaymentMethodService.getInstance(prisma);
}

