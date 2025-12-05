import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/db/prisma';

/**
 * Admin Workspace Management API
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 *
 * GET /api/admin/workspaces - List all workspaces with search and filters
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get workspaces with pagination
    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        select: {
          id: true,
          name: true,
          creditCount: true,
          allocatedCredits: true,
          isTrialed: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          subscription: {
            select: {
              id: true,
              status: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              conversations: true,
              generations: true,
              files: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.workspace.count({ where }),
    ]);

    return NextResponse.json({
      workspaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}
