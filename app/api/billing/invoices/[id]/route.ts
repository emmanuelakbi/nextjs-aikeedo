import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { invoiceService } from '@/infrastructure/services/InvoiceService';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';



/**
 * GET /api/billing/invoices/[id]
 * Get detailed invoice information
 * Requirements: 5.2 - Display invoice details, 5.4 - Include itemized charges
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

    // Get detailed invoice
    const invoice = await invoiceService.getDetailedInvoice(invoiceId);

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

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error getting invoice:', error);
    return NextResponse.json(
      {
        error: 'Failed to get invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
