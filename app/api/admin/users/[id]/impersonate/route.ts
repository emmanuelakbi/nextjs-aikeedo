import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import {
  startImpersonation,
  endImpersonation,
} from '@/lib/admin/impersonation';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';


/**
 * POST /api/admin/users/:id/impersonate
 *
 * Requirements: Admin Dashboard 1 - User Management (Impersonate users for support)
 *
 * Starts an impersonation session for the specified user.
 * Only admins can impersonate users, and impersonation sessions have a time limit.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const session = await requireAdmin();
    const userId = params.id;

    // Get IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Start impersonation session
    const impersonationSession = await startImpersonation(
      session.user.id,
      userId,
      ipAddress,
      userAgent
    );

    // Get target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        currentWorkspaceId: true,
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: impersonationSession.id,
        targetUser,
        expiresAt: impersonationSession.expiresAt,
      },
    });
  } catch (error) {
    console.error('Impersonation start error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/:id/impersonate
 *
 * Requirements: Admin Dashboard 1 - User Management (Impersonate users for support)
 *
 * Ends an active impersonation session.
 */
export async function DELETE(
  request: NextRequest,
  _params: { params: { id: string } }
) {
  try {
    // Verify admin access
    await requireAdmin();

    // Get session ID from query or body
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // End impersonation session
    await endImpersonation(sessionId, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended',
    });
  } catch (error) {
    console.error('Impersonation end error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    );
  }
}
