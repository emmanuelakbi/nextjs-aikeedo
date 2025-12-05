import { requireAdminPage } from '@/lib/admin';
import { WorkspaceDetailClient } from './WorkspaceDetailClient';

/**
 * Admin Workspace Detail Page
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 *
 * Displays detailed information about a specific workspace.
 */

export const metadata = {
  title: 'Workspace Details | Admin Dashboard',
  description: 'View and manage workspace details',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AdminWorkspaceDetailPage({ params }: PageProps) {
  // Enforce admin access
  await requireAdminPage();

  return (
    <div className="container mx-auto py-8">
      <WorkspaceDetailClient workspaceId={params.id} />
    </div>
  );
}
