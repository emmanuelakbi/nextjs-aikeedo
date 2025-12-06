import { requireAuth } from '@/lib/auth/session';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { Id } from '@/domain/user/value-objects/Id';
import WorkspaceList from './WorkspaceList';
import CreateWorkspaceButton from './CreateWorkspaceButton';

/**
 * Workspace management page
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

export default async function WorkspacesPage() {
  const session = await requireAuth();

  // Fetch user data
  const userRepository = new UserRepository();
  const userId = Id.fromString(session.user.id);
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch workspaces
  const workspaceRepository = new WorkspaceRepository();
  const workspaces = await workspaceRepository.findByUserId(session.user.id);

  // Get current workspace ID
  const currentWorkspaceId = user.getCurrentWorkspaceId();

  // Prepare workspace data
  const workspaceData = workspaces.map((ws) => ({
    id: ws.getId().getValue(),
    name: ws.getName(),
    ownerId: ws.getOwnerId(),
    creditCount: ws.getCreditCount(),
    allocatedCredits: ws.getAllocatedCredits(),
    isTrialed: ws.getIsTrialed(),
    createdAt: ws.getCreatedAt(),
    isOwner: ws.getOwnerId() === session.user.id,
    isCurrent: ws.getId().getValue() === currentWorkspaceId,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your workspaces and switch between them
          </p>
        </div>
        <CreateWorkspaceButton />
      </div>

      {/* Workspace list */}
      <WorkspaceList
        workspaces={workspaceData}
        currentWorkspaceId={currentWorkspaceId}
      />

      {/* Info section */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Workspaces allow you to organize your work and collaborate with
              different teams. Each workspace has its own credits and settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
