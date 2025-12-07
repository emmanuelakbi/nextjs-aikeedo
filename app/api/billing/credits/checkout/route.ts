import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripeService } from '@/infrastructure/services/StripeService';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { formatAmountForStripe } from '@/lib/stripe';
import {
  withRateLimit,
  checkoutRateLimiter,
} from '@/lib/middleware/rate-limit';

export const dynamic = 'force-dynamic';



/**
 * POST /api/billing/credits/checkout
 * Creates a Stripe checkout session for one-time credit purchase
 * Requirements: 4.1, 4.2
 */

// FIX: Server-side credit pricing configuration
const CREDIT_PRICING = {
  basePrice: 0.01, // $0.01 per credit
  bulkDiscounts: [
    { minAmount: 1000, discount: 0.05 }, // 5% off for 1000+
    { minAmount: 5000, discount: 0.1 }, // 10% off for 5000+
    { minAmount: 10000, discount: 0.15 }, // 15% off for 10000+
  ],
};

function calculateCreditPrice(creditAmount: number): number {
  let price = CREDIT_PRICING.basePrice;

  // Apply bulk discount
  for (const tier of CREDIT_PRICING.bulkDiscounts) {
    if (creditAmount >= tier.minAmount) {
      price = CREDIT_PRICING.basePrice * (1 - tier.discount);
    }
  }

  return price;
}

const createCreditCheckoutSchema = z.object({
  workspaceId: z.string().uuid(),
  creditAmount: z.number().int().min(1).max(1000000),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FIX: Apply rate limiting per user
    const rateLimitResponse = await withRateLimit(
      request,
      checkoutRateLimiter,
      session.user.id
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCreditCheckoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { workspaceId, creditAmount, successUrl, cancelUrl } =
      validationResult.data;

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // FIX: Calculate price server-side with bulk discounts
    const pricePerCredit = calculateCreditPrice(creditAmount);
    const totalAmount = creditAmount * pricePerCredit;
    const amountInCents = formatAmountForStripe(totalAmount);

    // Build success and cancel URLs
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';
    const defaultSuccessUrl = `${baseUrl}/dashboard/billing?credit_purchase=success&session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${baseUrl}/dashboard/billing?credit_purchase=canceled`;

    // Create checkout session for one-time payment
    const checkoutSession = await stripeService.createCheckoutSession({
      mode: 'payment',
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditAmount} AI Credits`,
              description: `Purchase ${creditAmount} credits for AI services`,
            },
            unit_amount: Math.round(pricePerCredit * 100), // Convert to cents
          },
          quantity: creditAmount,
        },
      ],
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        workspaceId,
        userId: session.user.id,
        creditAmount: creditAmount.toString(),
        type: 'credit_purchase',
      },
      payment_intent_data: {
        metadata: {
          workspaceId,
          userId: session.user.id,
          creditAmount: creditAmount.toString(),
          type: 'credit_purchase',
        },
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      creditAmount,
      totalAmount,
      amountInCents,
    });
  } catch (error) {
    console.error('Error creating credit checkout session:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Stripe is not configured')) {
        return NextResponse.json(
          { error: 'Payment processing is not configured' },
          { status: 503 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create credit checkout session' },
      { status: 500 }
    );
  }
}
