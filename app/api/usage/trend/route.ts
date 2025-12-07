import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { UsageLoggingService } from '@/infrastructure/services/UsageLoggingService';
export const dynamic = 'force-dynamic';



/**
 * GET /api/usage/trend
 *
 * Get credit usage trend over time for the current workspace
 *
 * Query parameters:
 * - days: number (optional, defaults to 30, max 365)
 *
 * Requirements: 7.2
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
    const daysStr = searchParams.get('days');
    const days = daysStr ? Math.min(parseInt(daysStr, 10), 365) : 30;

    const usageService = new UsageLoggingService();
    const trend = await usageService.getCreditUsageTrend(workspaceId, days);

    return NextResponse.json(trend);
  } catch (error) {
    console.error('Error fetching usage trend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage trend' },
      { status: 500 }
    );
  }
}
