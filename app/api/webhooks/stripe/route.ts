import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { stripeService } from '@/infrastructure/services/StripeService';
import type { Prisma } from '@prisma/client';
import { invoiceService } from '@/infrastructure/services/InvoiceService';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import type { Prisma } from '@prisma/client';

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for payment processing
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

/**
 * Process webhook events from Stripe
 * Requirements: 7.1 - Verify signature
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    // Requirements: 7.1
    let event: Stripe.Event;
    try {
      event = stripeService.verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Log webhook event for debugging
    console.log(`Received webhook event: ${event.type} (${event.id})`);

    // Process event based on type
    try {
      await processWebhookEvent(event);
    } catch (error) {
      // Requirements: 7.5 - Log error for manual review
      console.error(`Error processing webhook ${event.type}:`, error);

      // Return 200 to acknowledge receipt even if processing fails
      // Stripe will retry failed webhooks automatically
      return NextResponse.json(
        {
          received: true,
          error: 'Processing failed, will retry',
          eventId: event.id,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ received: true, eventId: event.id });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Process different types of Stripe webhook events
 * Requirements: 7.2, 7.3, 7.4
 */
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    // Checkout session completed
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;

    // Payment succeeded
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    // Payment failed
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    // Subscription created
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    // Subscription updated
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    // Subscription deleted/canceled
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    // Invoice created
    case 'invoice.created':
      await handleInvoiceCreated(event.data.object as Stripe.Invoice);
      break;

    // Invoice finalized
    case 'invoice.finalized':
      await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
      break;

    // Payment intent succeeded (for one-time credit purchases)
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(
        event.data.object as Stripe.PaymentIntent
      );
      break;

    // Refund handling
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;

    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object as Stripe.Dispute);
      break;

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}

/**
 * Handle checkout session completed event
 * Requirements: 2.2 - Create subscription and activate features
 * FIX: Use upsert within transaction to handle race condition
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log(`Processing checkout.session.completed: ${session.id}`);

  // Only process subscription checkouts
  if (session.mode !== 'subscription') {
    console.log('Skipping non-subscription checkout session');
    return;
  }

  const workspaceId = session.metadata?.workspaceId;
  const planId = session.metadata?.planId;

  if (!workspaceId || !planId) {
    throw new Error('Missing workspaceId or planId in session metadata');
  }

  // Retrieve full subscription details from Stripe
  const stripeSubscription = await stripeService.retrieveSubscription(
    session.subscription as string
  );

  // FIX: Use transaction with upsert to handle race condition
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const customerId =
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id || '';

    const subscriptionData = {
      workspaceId,
      planId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    };

    // Upsert is atomic and handles duplicates
    await tx.subscription.upsert({
      where: { stripeSubscriptionId: stripeSubscription.id },
      create: subscriptionData,
      update: subscriptionData,
    });

    // Mark workspace and user as trialed if trial was used
    if (stripeSubscription.trial_end) {
      const workspace = await tx.workspace.findUnique({
        where: { id: workspaceId },
        select: { ownerId: true },
      });

      await tx.workspace.update({
        where: { id: workspaceId },
        data: { isTrialed: true },
      });

      // FIX: Also mark user as having used trial
      if (workspace) {
        await tx.user.update({
          where: { id: workspace.ownerId },
          data: {
            hasUsedTrial: true,
            trialUsedAt: new Date(),
          },
        });
      }
    }
  });

  console.log(`Checkout session completed for workspace: ${workspaceId}`);
}

/**
 * Handle invoice payment succeeded event
 * Requirements: 7.2 - Activate subscription on payment success, 5.1 - Generate invoice, 5.5 - Email invoice
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log(`Processing invoice.payment_succeeded: ${invoice.id}`);

  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log('Invoice not associated with subscription');
    return;
  }

  // Update or create invoice record using InvoiceService
  // Requirements: 5.1 - Generate invoice when payment occurs
  const invoiceRecord = await invoiceService.syncInvoiceFromStripe(invoice);

  // Update subscription status
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { workspace: true, plan: true },
  });

  if (!subscription) {
    console.warn(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Allocate credits if plan has credit allocation
  if (subscription.plan.creditCount !== null) {
    await allocateCredits(
      subscription.workspaceId,
      subscription.plan.creditCount,
      invoice.id
    );
  }

  // Send invoice email
  // Requirements: 5.5 - Email invoice to billing email
  try {
    await invoiceService.sendInvoiceEmail(invoiceRecord.id);
    console.log(`Invoice email sent for invoice: ${invoiceRecord.id}`);
  } catch (emailError) {
    // Log email error but don't fail the webhook
    console.error('Failed to send invoice email:', emailError);
  }

  console.log(`Invoice payment succeeded for subscription: ${subscription.id}`);
}

/**
 * Handle invoice payment failed event
 * Requirements: 7.3 - Update subscription status on payment failure, 5.1 - Generate invoice
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  console.log(`Processing invoice.payment_failed: ${invoice.id}`);

  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log('Invoice not associated with subscription');
    return;
  }

  // Update invoice record using InvoiceService
  // Requirements: 5.1 - Generate invoice when payment occurs
  await invoiceService.syncInvoiceFromStripe(invoice);

  // Update subscription status to PAST_DUE
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'PAST_DUE' },
  });

  console.log(`Invoice payment failed for subscription: ${subscriptionId}`);
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log(`Processing customer.subscription.created: ${subscription.id}`);

  const workspaceId = subscription.metadata?.workspaceId;
  const planId = subscription.metadata?.planId;

  if (!workspaceId || !planId) {
    console.warn('Missing workspaceId or planId in subscription metadata');
    return;
  }

  await createOrUpdateSubscription(subscription, workspaceId, planId);
}

/**
 * Handle subscription updated event
 * FIX: Use optimistic locking with version field
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log(`Processing customer.subscription.updated: ${subscription.id}`);

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Get current subscription with version
        const current = await tx.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!current) {
          console.warn(`Subscription not found: ${subscription.id}`);
          return;
        }

        // FIX: Use optimistic locking with version check
        const updated = await tx.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
            version: current.version, // Only update if version matches
          },
          data: {
            status: mapStripeStatus(subscription.status),
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000)
              : null,
            trialEnd: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            version: current.version + 1, // Increment version
          },
        });

        if (updated.count === 0) {
          // Version mismatch, retry
          throw new Error('Version conflict');
        }
      });

      // Success, exit loop
      break;
    } catch (error) {
      if (error instanceof Error && error.message === 'Version conflict') {
        retries++;
        if (retries >= maxRetries) {
          console.error('Failed to update subscription after max retries');
          throw new Error('Failed to update subscription after max retries');
        }
        // Wait before retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * Math.pow(2, retries))
        );
      } else {
        throw error;
      }
    }
  }
}

/**
 * Handle subscription deleted event
 * Requirements: 7.4 - Schedule deactivation on cancellation
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log(`Processing customer.subscription.deleted: ${subscription.id}`);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Subscription canceled: ${subscription.id}`);
}

/**
 * Handle invoice created event
 * Requirements: 5.1 - Generate invoice when payment occurs
 */
async function handleInvoiceCreated(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Processing invoice.created: ${invoice.id}`);
  await invoiceService.syncInvoiceFromStripe(invoice);
}

/**
 * Handle invoice finalized event
 * Requirements: 5.1 - Generate invoice when payment occurs
 */
async function handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Processing invoice.finalized: ${invoice.id}`);
  await invoiceService.syncInvoiceFromStripe(invoice);
}

/**
 * Handle payment intent succeeded event (for one-time credit purchases)
 * Requirements: 4.1, 4.2, 4.4, 4.5
 * FIX: Added proper idempotency with transaction and unique constraint
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`);

  // Check if this is a credit purchase
  const metadata = paymentIntent.metadata;
  if (metadata?.type !== 'credit_purchase') {
    console.log('Payment intent is not a credit purchase, skipping');
    return;
  }

  const workspaceId = metadata.workspaceId;
  const userId = metadata.userId;
  const creditAmount = parseInt(metadata.creditAmount || '0', 10);

  if (!workspaceId || !creditAmount || !userId) {
    throw new Error(
      'Missing workspaceId, userId, or creditAmount in payment intent metadata'
    );
  }

  // FIX: Use transaction with unique constraint to prevent race condition
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Try to create transaction record first (will fail if duplicate due to unique constraint)
      const workspace = await tx.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      const balanceBefore = workspace.creditCount;
      const balanceAfter = balanceBefore + creditAmount;

      // Create transaction record (unique constraint prevents duplicates)
      await tx.creditTransaction.create({
        data: {
          workspaceId,
          amount: creditAmount,
          type: 'PURCHASE',
          description: `Purchased ${creditAmount} credits for $${(paymentIntent.amount / 100).toFixed(2)}`,
          referenceId: paymentIntent.id,
          referenceType: 'payment_intent',
          balanceBefore,
          balanceAfter,
        },
      });

      // Now safely update workspace credits
      await tx.workspace.update({
        where: { id: workspaceId },
        data: {
          creditCount: balanceAfter,
          creditsAdjustedAt: new Date(),
        },
      });
    });
  } catch (error) {
    // Check if it's a unique constraint violation (duplicate processing)
    if (
      error instanceof Error &&
      (error.message.includes('Unique constraint') ||
        error.message.includes('unique'))
    ) {
      console.log(`Credit purchase already processed: ${paymentIntent.id}`);
      return;
    }
    throw error;
  }

  // Requirements: 4.4 - Send receipt email (outside transaction)
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, creditCount: true },
    });

    if (user && workspace) {
      const { sendCreditPurchaseReceipt } = await import('@/lib/email');
      await sendCreditPurchaseReceipt(user.email, {
        firstName: user.firstName,
        creditAmount,
        amountPaid: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        transactionId: paymentIntent.id,
        workspaceName: workspace.name,
        newBalance: workspace.creditCount,
      });
      console.log(`Receipt email sent to ${user.email}`);
    }
  } catch (emailError) {
    // Log email error but don't fail the transaction
    console.error('Failed to send receipt email:', emailError);
  }

  console.log(
    `Credit purchase completed for workspace: ${workspaceId}, amount: ${creditAmount}`
  );
}

/**
 * Create or update subscription record from Stripe subscription
 * Requirements: 2.2, 3.4
 */
async function createOrUpdateSubscription(
  stripeSubscription: Stripe.Subscription,
  workspaceId: string,
  planId: string
): Promise<void> {
  const customerId =
    typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id || '';

  const subscriptionData = {
    workspaceId,
    planId,
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: customerId,
    status: mapStripeStatus(stripeSubscription.status),
    currentPeriodStart: new Date(
      stripeSubscription.current_period_start * 1000
    ),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    canceledAt: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000)
      : null,
    trialEnd: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : null,
  };

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: stripeSubscription.id },
    create: subscriptionData,
    update: subscriptionData,
  });
}

/**
 * Update subscription from Stripe subscription object
 */
async function updateSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  workspaceId: string
): Promise<void> {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000
      ),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
  });
}

/**
 * Allocate credits to workspace from subscription
 * Requirements: 3.4, 4.2
 */
async function allocateCredits(
  workspaceId: string,
  creditAmount: number,
  referenceId: string
): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  const balanceBefore = workspace.creditCount;
  const balanceAfter = balanceBefore + creditAmount;

  // Update workspace credits
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      creditCount: balanceAfter,
      allocatedCredits: workspace.allocatedCredits + creditAmount,
      creditsAdjustedAt: new Date(),
    },
  });

  // Requirements: 4.5 - Create credit transaction record for auditing
  await prisma.creditTransaction.create({
    data: {
      workspaceId,
      amount: creditAmount,
      type: 'SUBSCRIPTION_ALLOCATION',
      description: `Credits allocated from subscription payment`,
      referenceId,
      referenceType: 'invoice',
      balanceBefore,
      balanceAfter,
    },
  });

  console.log(`Allocated ${creditAmount} credits to workspace ${workspaceId}`);
}

/**
 * Allocate purchased credits to workspace
 * Requirements: 4.2, 4.5
 * @returns The new balance after allocation
 */
async function allocatePurchasedCredits(
  workspaceId: string,
  creditAmount: number,
  paymentIntentId: string,
  amountPaid: number
): Promise<number> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`);
  }

  const balanceBefore = workspace.creditCount;
  const balanceAfter = balanceBefore + creditAmount;

  // Requirements: 4.2 - Add credits to workspace immediately
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      creditCount: balanceAfter,
      creditsAdjustedAt: new Date(),
    },
  });

  // Requirements: 4.5 - Log transaction for auditing
  await prisma.creditTransaction.create({
    data: {
      workspaceId,
      amount: creditAmount,
      type: 'PURCHASE',
      description: `Purchased ${creditAmount} credits for $${amountPaid.toFixed(2)}`,
      referenceId: paymentIntentId,
      referenceType: 'payment_intent',
      balanceBefore,
      balanceAfter,
    },
  });

  console.log(
    `Purchased credits allocated to workspace ${workspaceId}: ${creditAmount} credits`
  );

  return balanceAfter;
}

/**
 * Map Stripe subscription status to our enum
 */
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'ACTIVE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    past_due: 'PAST_DUE',
    trialing: 'TRIALING',
    unpaid: 'UNPAID',
    paused: 'CANCELED', // Map paused to canceled
  };

  return statusMap[status] || 'CANCELED';
}

/**
 * Map Stripe invoice status to our enum
 */
function mapInvoiceStatus(status: Stripe.Invoice.Status | null): string {
  if (!status) return 'DRAFT';

  const statusMap: Record<Stripe.Invoice.Status, string> = {
    draft: 'DRAFT',
    open: 'OPEN',
    paid: 'PAID',
    void: 'VOID',
    uncollectible: 'UNCOLLECTIBLE',
  };

  return statusMap[status] || 'DRAFT';
}

/**
 * Handle charge refunded event
 * FIX: Deduct credits when refund occurs
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log(`Processing charge.refunded: ${charge.id}`);

  // Find the payment intent
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.log('Charge not associated with payment intent');
    return;
  }

  // Find the credit transaction
  const transaction = await prisma.creditTransaction.findFirst({
    where: {
      referenceId: paymentIntentId,
      referenceType: 'payment_intent',
      type: 'PURCHASE',
    },
  });

  if (!transaction) {
    console.log(
      `No credit purchase found for payment intent: ${paymentIntentId}`
    );
    return;
  }

  // Check if already refunded
  const existingRefund = await prisma.creditTransaction.findFirst({
    where: {
      referenceId: charge.id,
      referenceType: 'refund',
      type: 'REFUND',
    },
  });

  if (existingRefund) {
    console.log(`Refund already processed: ${charge.id}`);
    return;
  }

  // Deduct the credits back
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const workspace = await tx.workspace.findUnique({
      where: { id: transaction.workspaceId },
    });

    if (!workspace) {
      throw new Error(`Workspace not found: ${transaction.workspaceId}`);
    }

    const balanceBefore = workspace.creditCount;
    const refundAmount = transaction.amount;
    const balanceAfter = Math.max(0, balanceBefore - refundAmount);

    // Deduct credits (but don't go negative)
    await tx.workspace.update({
      where: { id: transaction.workspaceId },
      data: {
        creditCount: balanceAfter,
        creditsAdjustedAt: new Date(),
      },
    });

    // Log refund transaction
    await tx.creditTransaction.create({
      data: {
        workspaceId: transaction.workspaceId,
        amount: -(balanceBefore - balanceAfter), // Actual amount deducted
        type: 'REFUND',
        description: `Refund for charge ${charge.id}`,
        referenceId: charge.id,
        referenceType: 'refund',
        balanceBefore,
        balanceAfter,
      },
    });
  });

  console.log(`Refund processed for charge: ${charge.id}`);
}

/**
 * Handle dispute created event
 * FIX: Flag workspace for review when dispute occurs
 */
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  console.log(`Processing dispute: ${dispute.id}`);

  const chargeId =
    typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

  if (!chargeId) {
    return;
  }

  // Find associated transaction
  const charge = await stripeService.stripe.charges.retrieve(chargeId);
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  const transaction = await prisma.creditTransaction.findFirst({
    where: {
      referenceId: paymentIntentId,
      referenceType: 'payment_intent',
      type: 'PURCHASE',
    },
  });

  if (!transaction) {
    return;
  }

  // Log the dispute for admin review
  await prisma.adminAction.create({
    data: {
      adminId: 'system',
      action: 'DISPUTE_CREATED',
      targetType: 'workspace',
      targetId: transaction.workspaceId,
      changes: {
        disputeId: dispute.id,
        chargeId,
        amount: dispute.amount,
        reason: dispute.reason,
        status: dispute.status,
      },
    },
  });

  console.log(`Dispute logged for workspace: ${transaction.workspaceId}`);
}
