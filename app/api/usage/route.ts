import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { UsageLoggingService } from '@/infrastructure/services/UsageLoggingService';
export const dynamic = 'force-dynamic';


/**
 * GET /api/usage
 *
 * Get usage statistics for the current workspace
 *
 * Query parameters:
 * - period: 'day' | 'week' | 'month' | 'year' (optional, defaults to 'month')
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 *
 * Requirements: 7.1, 7.2
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const workspaceId = session.user.currentWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'No workspace selected' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as
      | 'day'
      | 'week'
      | 'month'
      | 'year'
      | null;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const usageService = new UsageLoggingService();

    // If period is specified, get summary
    if (period) {
      const summary = await usageService.getUsageSummary(workspaceId, period);
      return NextResponse.json(summary);
    }

    // Otherwise get detailed statistics
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const statistics = await usageService.getUsageStatistics(
      workspaceId,
      startDate,
      endDate
    );

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}
