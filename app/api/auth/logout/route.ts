import { NextRequest, NextResponse } from 'next/server';
import { auth, signOut } from '@/lib/auth/auth';
import { SessionRepository } from '@/infrastructure/repositories/SessionRepository';
export const dynamic = 'force-dynamic';



/**
 * POST /api/auth/logout
 *
 * Logs out the current user by invalidating their session.
 * Requirements: 6.3
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get session token from cookies
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (sessionToken) {
      // Delete the session from database
      const sessionRepository = new SessionRepository();
      await sessionRepository.delete(sessionToken);
    }

    // Sign out using NextAuth
    await signOut({ redirect: false });

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to logout',
        },
      },
      { status: 500 }
    );
  }
}
