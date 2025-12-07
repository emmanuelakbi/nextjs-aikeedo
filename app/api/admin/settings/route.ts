import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
export const dynamic = 'force-dynamic';


/**
 * Admin System Settings API
 *
 * Requirements: Admin Dashboard 4 - System Settings
 *
 * GET /api/admin/settings - Get all system settings
 * POST /api/admin/settings - Create or update a system setting
 */

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional(),
  category: z.string().default('general'),
  isPublic: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const settings = await prisma.systemSetting.findMany({
      where,
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
      orderBy: {
        key: 'asc',
      },
    });

    // Group settings by category
    const groupedSettings = settings.reduce(
      (acc: any, setting: any) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      },
      {} as Record<string, typeof settings>
    );

    return NextResponse.json({
      settings,
      groupedSettings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    // Validate input
    const validatedData = settingSchema.parse(body);

    // Check if setting exists
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key: validatedData.key },
    });

    // Create or update setting
    const setting = await prisma.systemSetting.upsert({
      where: { key: validatedData.key },
      create: {
        key: validatedData.key,
        value: validatedData.value,
        description: validatedData.description,
        category: validatedData.category,
        isPublic: validatedData.isPublic,
        updatedBy: session.user.id,
      },
      update: {
        value: validatedData.value,
        description: validatedData.description,
        category: validatedData.category,
        isPublic: validatedData.isPublic,
        updatedBy: session.user.id,
      },
      include: {
        updater: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log the action
    await logAdminAction({
      adminId: session.user.id,
      action: existingSetting ? 'settings.update' : 'settings.create',
      targetType: 'system_setting',
      targetId: validatedData.key,
      changes: {
        key: validatedData.key,
        previousValue: existingSetting?.value,
        newValue: validatedData.value,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ setting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error saving setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}
