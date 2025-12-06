/**
 * Checkout API Tests
 *
 * Tests for Stripe checkout flow endpoints
 * Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 8.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as checkoutPost } from '../route';
import { POST as creditCheckoutPost } from '../../credits/checkout/route';
import { GET as checkoutSuccessGet } from '../success/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    workspace: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/infrastructure/services/SubscriptionService', () => ({
  subscriptionService: {
    createCheckoutSession: vi.fn(),
    getSubscriptionByStripeId: vi.fn(),
  },
}));

vi.mock('@/infrastructure/services/StripeService', () => ({
  stripeService: {
    createCheckoutSession: vi.fn(),
    retrieveCheckoutSession: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { subscriptionService } from '@/infrastructure/services/SubscriptionService';
import { stripeService } from '@/infrastructure/services/StripeService';

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          planId: 'plan-123',
          workspaceId: 'workspace-123',
        }),
      }
    );

    const response = await checkoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if request data is invalid', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          planId: 'invalid-uuid',
          workspaceId: 'workspace-123',
        }),
      }
    );

    const response = await checkoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });

  it('should return 404 if workspace not found', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any);

    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          planId: '123e4567-e89b-12d3-a456-426614174000',
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        }),
      }
    );

    const response = await checkoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Workspace not found or access denied');
  });

  it('should return 400 if workspace already has active subscription', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any);

    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: 'workspace-123',
      ownerId: 'user-123',
      subscription: {
        id: 'sub-123',
        status: 'ACTIVE',
      },
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          planId: '123e4567-e89b-12d3-a456-426614174000',
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
        }),
      }
    );

    const response = await checkoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Workspace already has an active subscription');
  });

  it('should create checkout session successfully', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any);

    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: 'workspace-123',
      ownerId: 'user-123',
      isTrialed: false,
      subscription: null,
    } as any);

    vi.mocked(prisma.plan.findUnique).mockResolvedValue({
      id: 'plan-123',
      name: 'Pro Plan',
      isActive: true,
      stripePriceId: 'price_123',
    } as any);

    vi.mocked(subscriptionService.createCheckoutSession).mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          planId: '123e4567-e89b-12d3-a456-426614174000',
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
          trialDays: 14,
        }),
      }
    );

    const response = await checkoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBe('cs_test_123');
    expect(data.url).toBe('https://checkout.stripe.com/test');
    expect(data.trialOffered).toBe(true);
    expect(data.trialDays).toBe(14);
  });

  it('should not offer trial if workspace has already used trial', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any);

    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: 'workspace-123',
      ownerId: 'user-123',
      isTrialed: true, // Already used trial
      subscription: null,
    } as any);

    vi.mocked(prisma.plan.findUnique).mockResolvedValue({
      id: 'plan-123',
      name: 'Pro Plan',
      isActive: true,
      stripePriceId: 'price_123',
    } as any);

    vi.mocked(subscriptionService.createCheckoutSession).mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          planId: '123e4567-e89b-12d3-a456-426614174000',
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
          trialDays: 14,
        }),
      }
    );

    const response = await checkoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.trialOffered).toBe(false);
    expect(data.trialDays).toBeUndefined();
  });
});

describe('POST /api/billing/credits/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/credits/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: 'workspace-123',
          creditAmount: 1000,
          pricePerCredit: 0.01,
        }),
      }
    );

    const response = await creditCheckoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should create credit checkout session successfully', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any);

    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: 'workspace-123',
      ownerId: 'user-123',
    } as any);

    vi.mocked(stripeService.createCheckoutSession).mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/credits/checkout',
      {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: '123e4567-e89b-12d3-a456-426614174001',
          creditAmount: 1000,
          pricePerCredit: 0.01,
        }),
      }
    );

    const response = await creditCheckoutPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBe('cs_test_123');
    expect(data.url).toBe('https://checkout.stripe.com/test');
    expect(data.creditAmount).toBe(1000);
    expect(data.totalAmount).toBe(10);
  });
});

describe('GET /api/billing/checkout/success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout/success?session_id=cs_test_123'
    );

    const response = await checkoutSuccessGet(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should retrieve checkout session successfully', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    } as any);

    vi.mocked(stripeService.retrieveCheckoutSession).mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      status: 'complete',
      customer_email: 'test@example.com',
      amount_total: 2999,
      currency: 'usd',
      subscription: 'sub_123',
      metadata: {
        workspaceId: 'workspace-123',
        userId: 'user-123',
      },
    } as any);

    vi.mocked(subscriptionService.getSubscriptionByStripeId).mockResolvedValue({
      id: 'sub-123',
      status: 'ACTIVE',
      currentPeriodEnd: new Date('2024-01-01'),
      trialEnd: null,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/billing/checkout/success?session_id=cs_test_123'
    );

    const response = await checkoutSuccessGet(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sessionId).toBe('cs_test_123');
    expect(data.paymentStatus).toBe('paid');
  });
});
