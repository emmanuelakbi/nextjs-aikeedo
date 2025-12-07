import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAdminImpersonationSessions } from '@/lib/admin/impersonation';
import prisma from '@/lib/db/prisma';
export const dynamic = 'force-dynamic';



/**
 * GET /api/admin/impersonation
 *
 * Requirements: Admin Dashboard 1 - User Management (Impersonate users for support)
 *
 * Gets all active impersonation sessions for the current admin.
 */
export async function GET() {
  try {
    // Verify admin access
    const session = await requireAdmin();

    // Get active impersonation sessions
    const impersonationSessions = getAdminImpersonationSessions(
      session.user.id
    );

    // Enrich with user details
    const enrichedSessions = await Promise.all(
      impersonationSessions.map(async (impSession) => {
        const targetUser = await prisma.user.findUnique({
          where: { id: impSession.targetUserId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        return {
          id: impSession.id,
          targetUser,
          expiresAt: impSession.expiresAt,
          createdAt: impSession.createdAt,
        };
      })
    );

    return NextResponse.json({
      sessions: enrichedSessions,
    });
  } catch (error) {
    console.error('Get impersonation sessions error:', error);

    return NextResponse.json(
      { error: 'Failed to get impersonation sessions' },
      { status: 500 }
    );
  }
}
