import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAuditLogs } from '@/lib/admin/audit-logger';

/**
 * Admin Audit Logs Export API
 *
 * Requirements: Admin Dashboard 8 - Audit Logging
 * - Generate audit reports
 * - Export data for compliance
 */

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const adminId = searchParams.get('adminId') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const targetId = searchParams.get('targetId') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format') || 'csv';

    // Get all logs matching criteria (no limit for export)
    const logs = await getAuditLogs({
      adminId,
      targetType,
      targetId,
      action,
      limit: 10000, // Max export limit
    });

    // Filter by date range if provided
    let filteredLogs = logs;
    if (startDate || endDate) {
      filteredLogs = logs.filter((log: { createdAt: Date }) => {
        const logDate = new Date(log.createdAt);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    if (format === 'csv') {
      const csv = convertToCSV(filteredLogs);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(filteredLogs);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}

function convertToCSV(logs: any[]): string {
  if (logs.length === 0) {
    return 'No audit logs found';
  }

  const headers = [
    'Timestamp',
    'Admin Email',
    'Admin Name',
    'Action',
    'Target Type',
    'Target ID',
    'Changes',
    'IP Address',
    'User Agent',
  ];

  const rows = logs.map((log) => {
    const adminName = `${log.admin.firstName} ${log.admin.lastName}`;
    const changes = JSON.stringify(log.changes);

    return [
      new Date(log.createdAt).toISOString(),
      log.admin.email,
      adminName,
      log.action,
      log.targetType,
      log.targetId,
      changes,
      log.ipAddress || '',
      log.userAgent || '',
    ].map((value) => {
      // Escape values that contain commas or quotes
      if (
        typeof value === 'string' &&
        (value.includes(',') || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
