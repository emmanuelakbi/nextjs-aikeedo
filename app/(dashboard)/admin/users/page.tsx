import { requireAdminPage } from '@/lib/admin';
import { UserManagementClient } from './UserManagementClient';

/**
 * Admin User Management Page
 *
 * Requirements: Admin Dashboard 1 - User Management
 *
 * Displays a list of all users with search, filters, and management actions.
 */
export const dynamic = 'force-dynamic';



export const metadata = {
  title: 'User Management | Admin Dashboard',
  description: 'Manage users, roles, and permissions',
};

export default async function AdminUsersPage() {
  // Enforce admin access
  await requireAdminPage();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all users in the system
        </p>
      </div>

      <UserManagementClient />
    </div>
  );
}
