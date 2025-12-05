/**
 * Commission Processor
 * Requirements: Affiliate 2 - Calculate commissions on payment events
 *
 * Processes commissions for various payment events
 */

import { ProcessCommissionUseCase } from '@/application/use-cases/affiliate/process-commission';
import { ProcessRefundUseCase } from '@/application/use-cases/affiliate/process-refund';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '@/infrastructure/affiliate/prisma-affiliate-repository';

/**
 * Process commission for subscription payment
 */
export async function processSubscriptionCommission(
  userId: string,
  subscriptionAmount: number,
  invoiceId: string
): Promise<void> {
  const affiliateRepo = new PrismaAffiliateRepository();
  const referralRepo = new PrismaReferralRepository();
  const useCase = new ProcessCommissionUseCase(affiliateRepo, referralRepo);

  try {
    const result = await useCase.execute({
      userId,
      amount: subscriptionAmount,
      transactionType: 'subscription',
      referenceId: invoiceId,
    });

    if (result.processed) {
      console.log(
        `Commission processed: $${(result.commission! / 100).toFixed(2)} for affiliate ${result.affiliateId}`
      );
    } else {
      console.log(`Commission not processed: ${result.reason}`);
    }
  } catch (error) {
    console.error('Error processing subscription commission:', error);
    throw error;
  }
}

/**
 * Process commission for credit purchase
 */
export async function processCreditPurchaseCommission(
  userId: string,
  purchaseAmount: number,
  transactionId: string
): Promise<void> {
  const affiliateRepo = new PrismaAffiliateRepository();
  const referralRepo = new PrismaReferralRepository();
  const useCase = new ProcessCommissionUseCase(affiliateRepo, referralRepo);

  try {
    const result = await useCase.execute({
      userId,
      amount: purchaseAmount,
      transactionType: 'credit_purchase',
      referenceId: transactionId,
    });

    if (result.processed) {
      console.log(
        `Commission processed: $${(result.commission! / 100).toFixed(2)} for affiliate ${result.affiliateId}`
      );
    } else {
      console.log(`Commission not processed: ${result.reason}`);
    }
  } catch (error) {
    console.error('Error processing credit purchase commission:', error);
    throw error;
  }
}

/**
 * Process refund adjustment
 */
export async function processRefund(
  userId: string,
  referenceId: string
): Promise<void> {
  const affiliateRepo = new PrismaAffiliateRepository();
  const referralRepo = new PrismaReferralRepository();
  const useCase = new ProcessRefundUseCase(affiliateRepo, referralRepo);

  try {
    const result = await useCase.execute({
      userId,
      referenceId,
      type: 'refund',
    });

    if (result.processed) {
      console.log(
        `Refund processed: $${(result.adjustment! / 100).toFixed(2)} adjustment for affiliate ${result.affiliateId}`
      );
    } else {
      console.log(`Refund not processed: ${result.reason}`);
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

/**
 * Process chargeback adjustment
 */
export async function processChargeback(
  userId: string,
  referenceId: string
): Promise<void> {
  const affiliateRepo = new PrismaAffiliateRepository();
  const referralRepo = new PrismaReferralRepository();
  const useCase = new ProcessRefundUseCase(affiliateRepo, referralRepo);

  try {
    const result = await useCase.execute({
      userId,
      referenceId,
      type: 'chargeback',
    });

    if (result.processed) {
      console.log(
        `Chargeback processed: $${(result.adjustment! / 100).toFixed(2)} adjustment for affiliate ${result.affiliateId}`
      );
    } else {
      console.log(`Chargeback not processed: ${result.reason}`);
    }
  } catch (error) {
    console.error('Error processing chargeback:', error);
    throw error;
  }
}
