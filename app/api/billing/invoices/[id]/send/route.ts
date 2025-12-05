import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { invoiceService } from '@/infrastructure/services/InvoiceService';
import { prisma } from '@/lib/db';

/**
 * POST /api/billing/invoices/[id]/send
 * Send invoice email to customer
 * Requirements: 5.5 - Email invoice to billing email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Get invoice
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify user has access to this invoice's workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: invoice.workspaceId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Access denied to this invoice' },
        { status: 403 }
      );
    }

    // Send invoice email
    const success = await invoiceService.sendInvoiceEmail(invoiceId);

    return NextResponse.json({
      success,
      message: 'Invoice email sent successfully',
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send invoice email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
