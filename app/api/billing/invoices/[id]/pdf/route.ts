import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { invoiceService } from '@/infrastructure/services/InvoiceService';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';



/**
 * GET /api/billing/invoices/[id]/pdf
 * Get invoice PDF URL
 * Requirements: 5.3 - Provide PDF format
 */
export async function GET(
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

    // Get PDF URL
    const pdfUrl = await invoiceService.getInvoicePdfUrl(invoiceId);

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error('Error getting invoice PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to get invoice PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
