import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { runSessionCleanup } from '@/lib/auth/cleanup';
export const dynamic = 'force-dynamic';



/**
 * POST /api/auth/cleanup-sessions
 *
 * Manually triggers cleanup of expired sessions.
 * Requires admin authentication.
 * Requirements: 6.4, 6.5
 */
export async function POST() {
  try {
    // Require admin authentication
    await requireAdmin();

    // Run cleanup
    const result = await runSessionCleanup();

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'CLEANUP_FAILED',
            message: result.error || 'Failed to cleanup sessions',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Session cleanup completed successfully',
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session cleanup error:', error);

    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to cleanup sessions',
        },
      },
      { status: 500 }
    );
  }
}
