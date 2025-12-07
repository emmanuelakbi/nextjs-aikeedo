import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { UsageLoggingService } from '@/infrastructure/services/UsageLoggingService';
export const dynamic = 'force-dynamic';


/**
 * GET /api/usage/activity
 *
 * Get recent usage activity for the current workspace
 *
 * Query parameters:
 * - limit: number (optional, defaults to 10, max 100)
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
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? Math.min(parseInt(limitStr, 10), 100) : 10;

    const usageService = new UsageLoggingService();
    const activity = await usageService.getRecentActivity(workspaceId, limit);

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
