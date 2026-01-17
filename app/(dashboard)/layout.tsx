import { requireAuth } from '@/lib/auth/session';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { Id } from '@/domain/user/value-objects/Id';
import MainLayout from '@/components/layouts/MainLayout';

/**
 * Dashboard layout - wraps all authenticated dashboard pages
 * Requirements: 7.1, 7.2, 8.3, 8.4, 11.1, 11.2
 */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication - redirects to login if not authenticated
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

  // Get current workspace - auto-assign first workspace if none set
  let currentWorkspaceId = user.getCurrentWorkspaceId();
  let currentWorkspace = workspaces.find(
    (ws) => ws.getId().getValue() === currentWorkspaceId
  );

  // If no current workspace but user has workspaces, auto-assign the first one
  if (!currentWorkspace && workspaces.length > 0) {
    currentWorkspace = workspaces[0];
    currentWorkspaceId = currentWorkspace.getId().getValue();
    
    // Update user's current workspace in database
    user.setCurrentWorkspace(currentWorkspaceId);
    await userRepository.update(user);
  }

  // Prepare user data for layout
  const userData = {
    id: user.getId().getValue(),
    email: user.getEmail().getValue(),
    firstName: user.getFirstName(),
    lastName: user.getLastName(),
    role: user.getRole(),
  };

  // Prepare workspace data for layout
  const workspaceData = workspaces.map((ws) => ({
    id: ws.getId().getValue(),
    name: ws.getName(),
  }));

  const currentWorkspaceData = currentWorkspace
    ? {
        id: currentWorkspace.getId().getValue(),
        name: currentWorkspace.getName(),
      }
    : undefined;

  return (
    <MainLayout
      user={userData}
      currentWorkspace={currentWorkspaceData}
      workspaces={workspaceData}
    >
      {children}
    </MainLayout>
  );
}
