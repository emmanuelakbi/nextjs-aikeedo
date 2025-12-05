import { requireAdminPage } from '@/lib/admin';
import { WorkspaceManagementClient } from './WorkspaceManagementClient';

/**
 * Admin Workspace Management Page
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 *
 * Displays a list of all workspaces with management actions.
 */

export const metadata = {
  title: 'Workspace Management | Admin Dashboard',
  description: 'Manage workspaces and credits',
};

export default async function AdminWorkspacesPage() {
  // Enforce admin access
  await requireAdminPage();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Workspace Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all workspaces in the system
        </p>
      </div>

      <WorkspaceManagementClient />
    </div>
  );
}
