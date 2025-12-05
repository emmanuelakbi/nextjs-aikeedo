import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { invoiceService } from '@/infrastructure/services/InvoiceService';
import { InvoiceStatus } from '@prisma/client';

/**
 * GET /api/billing/invoices
 * List invoices for the current workspace
 * Requirements: 5.2 - Display all past invoices
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as InvoiceStatus | null;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // List invoices
    const result = await invoiceService.listInvoicesByWorkspace(workspaceId, {
      limit,
      offset,
      ...(status && { status }),
    });

    return NextResponse.json({
      invoices: result.invoices,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error listing invoices:', error);
    return NextResponse.json(
      {
        error: 'Failed to list invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
