import { requireAuth } from '@/lib/auth/session';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
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
  const user = await userRepository.findById(session.user.id);

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch workspaces
  const workspaceRepository = new WorkspaceRepository();
  const workspaces = await workspaceRepository.findByUserId(session.user.id);

  // Get current workspace
  const currentWorkspaceId = user.getCurrentWorkspaceId();
  const currentWorkspace = workspaces.find(
    (ws) => ws.getId().getValue() === currentWorkspaceId
  );

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
