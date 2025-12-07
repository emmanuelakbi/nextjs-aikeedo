import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { getStripeClient } from '@/lib/stripe';
import { z } from 'zod';
import type Stripe from 'stripe';
export const dynamic = 'force-dynamic';


/**
 * Admin Refunds API
 *
 * Requirements: Admin Dashboard 3 - Subscription Management
 * - Process refunds
 *
 * POST /api/admin/refunds - Process a refund
 * GET /api/admin/refunds - List all refunds
 */

const refundSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().min(0).optional(), // If not provided, full refund
  reason: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    // Validate input
    const { invoiceId, amount, reason } = refundSchema.parse(body);

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Can only refund paid invoices' },
        { status: 400 }
      );
    }

    if (!invoice.stripeInvoiceId) {
      return NextResponse.json(
        { error: 'Invoice has no Stripe invoice ID' },
        { status: 400 }
      );
    }

    // Process refund in Stripe
    const stripeService = getStripeClient();
    const stripe = stripeService.getClient();
    const refundAmount = amount || invoice.amount;

    // Get the payment intent from the invoice
    const stripeInvoice = (await stripe.invoices.retrieve(
      invoice.stripeInvoiceId,
      {
        expand: ['payment_intent'],
      }
    )) as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string };

    if (
      !stripeInvoice.payment_intent ||
      typeof stripeInvoice.payment_intent === 'string'
    ) {
      return NextResponse.json(
        { error: 'Invoice has no payment intent' },
        { status: 400 }
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent:
        typeof stripeInvoice.payment_intent === 'string'
          ? stripeInvoice.payment_intent
          : stripeInvoice.payment_intent.id,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        admin_id: session.user.id,
        reason: reason,
      },
    });

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: refundAmount >= invoice.amount ? 'REFUNDED' : 'PAID',
      },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'invoice.refund',
      targetType: 'invoice',
      targetId: invoiceId,
      changes: {
        amount: refundAmount,
        reason,
        stripeRefundId: refund.id,
        workspaceName: invoice.workspace.name,
        ownerEmail: invoice.workspace.owner.email,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
      },
      invoice: updatedInvoice,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get refunded invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: 'REFUNDED',
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: {
          status: 'REFUNDED',
        },
      }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}
