import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { logAdminAction } from '@/lib/admin/audit-logger';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * Admin Announcement Detail API
 *
 * Requirements: Admin Dashboard 7 - Support Tools
 * - Manage announcements
 */

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
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

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const validated = updateSchema.parse(body);

    const existing = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.content !== undefined) updateData.content = validated.content;
    if (validated.type !== undefined) updateData.type = validated.type;
    if (validated.isActive !== undefined)
      updateData.isActive = validated.isActive;
    if (validated.startDate !== undefined) {
      updateData.startDate = new Date(validated.startDate);
    }
    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate
        ? new Date(validated.endDate)
        : null;
    }

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
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
      action: 'announcement.update',
      targetType: 'announcement',
      targetId: announcement.id,
      changes: updateData,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    const existing = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({
      where: { id: params.id },
    });

    // Log the action
    await logAdminAction({
      adminId: admin.user.id,
      action: 'announcement.delete',
      targetType: 'announcement',
      targetId: params.id,
      changes: {
        title: existing.title,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
