import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAuditLogs } from '@/lib/admin/audit-logger';
export const dynamic = 'force-dynamic';


/**
 * Admin Audit Logs API
 *
 * Requirements: Admin Dashboard 8 - Audit Logging
 * - Log all admin actions
 * - Track data changes
 * - Monitor security events
 * - Generate audit reports
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const adminId = searchParams.get('adminId') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const targetId = searchParams.get('targetId') || undefined;
    const action = searchParams.get('action') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await getAuditLogs({
      adminId,
      targetType,
      targetId,
      action,
      limit,
      offset,
    });

    // Get total count for pagination
    const total = await getAuditLogsCount({
      adminId,
      targetType,
      targetId,
      action,
    });

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

async function getAuditLogsCount(options?: {
  adminId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
}) {
  const prisma = (await import('@/lib/db/prisma')).default;
  const where: any = {};

  if (options?.adminId) where.adminId = options.adminId;
  if (options?.targetType) where.targetType = options.targetType;
  if (options?.targetId) where.targetId = options.targetId;
  if (options?.action) where.action = options.action;

  return await prisma.adminAction.count({ where });
}
