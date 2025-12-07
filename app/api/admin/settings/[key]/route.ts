import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';


/**
 * Admin System Settings API - Individual Setting
 *
 * Requirements: Admin Dashboard 4 - System Settings
 *
 * GET /api/admin/settings/[key] - Get a specific setting
 * DELETE /api/admin/settings/[key] - Delete a setting
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    await requireAdmin();
    const settingKey = params.key;

    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
      include: {
        updater: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await requireAdmin();
    const settingKey = params.key;

    // Get setting before deletion for audit log
    const setting = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Delete setting
    await prisma.systemSetting.delete({
      where: { key: settingKey },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: 'settings.delete',
      targetType: 'system_setting',
      targetId: settingKey,
      changes: {
        key: settingKey,
        value: setting.value,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
