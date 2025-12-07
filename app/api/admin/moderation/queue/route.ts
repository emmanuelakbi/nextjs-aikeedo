import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';


/**
 * Admin Moderation Queue API
 *
 * Requirements: Admin Dashboard 6 - Content Moderation
 * - Review generated content
 * - View moderation queue
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Get generations for moderation review
    const generations = await prisma.generation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.generation.count({ where });

    return NextResponse.json({
      generations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + generations.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}
