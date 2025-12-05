import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin/audit-logger';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * Admin Announcements API
 *
 * Requirements: Admin Dashboard 7 - Support Tools
 * - Manage announcements
 */

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']),
  isActive: z.boolean().optional().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const validated = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        title: validated.title,
        content: validated.content,
        type: validated.type,
        isActive: validated.isActive,
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        createdBy: admin.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log the action
    await logAdminAction({
      adminId: admin.user.id,
      action: 'announcement.create',
      targetType: 'announcement',
      targetId: announcement.id,
      changes: {
        title: announcement.title,
        type: announcement.type,
        isActive: announcement.isActive,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
