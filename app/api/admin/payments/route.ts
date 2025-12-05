import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';

/**
 * Admin Payments API
 *
 * Requirements: Admin Dashboard 3 - Subscription Management
 * - View payment history
 *
 * GET /api/admin/payments - List all payments/invoices
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Get payment statistics
    const stats = await prisma.invoice.groupBy({
      by: ['status'],
      where: startDate ? { createdAt: { gte: new Date(startDate) } } : {},
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate total revenue
    const totalRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statistics: {
        byStatus: stats,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
