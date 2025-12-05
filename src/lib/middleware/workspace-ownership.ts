import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../auth';
import { WorkspaceRepository } from '../../infrastructure/repositories/WorkspaceRepository';

/**
 * Workspace Ownership Middleware
 *
 * Validates that the authenticated user is the owner of the specified workspace.
 * Requirements: 8.2
 */

export interface WorkspaceOwnershipCheckOptions {
  workspaceIdParam?: string; // Name of the route parameter containing workspace ID (default: 'id')
  workspaceIdBody?: string; // Name of the body field containing workspace ID
}

/**
 * Checks if the authenticated user is the owner of the specified workspace
 *
 * @param request Next.js request object
 * @param workspaceId Workspace ID to check ownership for
 * @returns true if user is owner, false otherwise
 */
export async function isWorkspaceOwner(
  _request: NextRequest,
  workspaceId: string
): Promise<boolean> {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user?.id) {
      return false;
    }

    // Check workspace ownership
    const workspaceRepository = new WorkspaceRepository();
    const workspace = await workspaceRepository.findById(workspaceId);

    if (!workspace) {
      return false;
    }

    return workspace.isOwnedBy(session.user.id);
  } catch (error) {
    console.error('Error checking workspace ownership:', error);
    return false;
  }
}

/**
 * Middleware to enforce workspace ownership
 *
 * Usage in API routes:
 * ```typescript
 * export async function PATCH(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   const ownershipCheck = await checkWorkspaceOwnership(request, params.id);
 *   if (!ownershipCheck.authorized) {
 *     return ownershipCheck.response;
 *   }
 *
 *   // Continue with owner-only operation
 * }
 * ```
 *
 * @param request Next.js request object
 * @param workspaceId Workspace ID to check ownership for
 * @returns Object with authorization status and optional error response
 */
export async function checkWorkspaceOwnership(
  _request: NextRequest,
  workspaceId: string
): Promise<{
  authorized: boolean;
  response?: NextResponse;
  userId?: string;
  workspace?: any;
}> {
  try {
    // Get authenticated session
    const session = await auth();

    if (!session?.user?.id) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 }
        ),
      };
    }

    // Check workspace exists
    const workspaceRepository = new WorkspaceRepository();
    const workspace = await workspaceRepository.findById(workspaceId);

    if (!workspace) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Workspace not found',
            },
          },
          { status: 404 }
        ),
      };
    }

    // Check ownership
    if (!workspace.isOwnedBy(session.user.id)) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Only the workspace owner can perform this operation',
            },
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId: session.user.id,
      workspace,
    };
  } catch (error) {
    console.error('Error checking workspace ownership:', error);
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to verify workspace ownership',
          },
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Higher-order function to wrap API route handlers with ownership check
 *
 * Usage:
 * ```typescript
 * export const PATCH = withWorkspaceOwnership(
 *   async (request, { params }, { userId, workspace }) => {
 *     // Handler code with guaranteed ownership
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function withWorkspaceOwnership(
  handler: (
    request: NextRequest,
    context: { params: { id: string } },
    ownershipContext: { userId: string; workspace: any }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> => {
    const ownershipCheck = await checkWorkspaceOwnership(
      request,
      context.params.id
    );

    if (!ownershipCheck.authorized) {
      return ownershipCheck.response!;
    }

    return handler(request, context, {
      userId: ownershipCheck.userId!,
      workspace: ownershipCheck.workspace,
    });
  };
}
