import { requireAdminPage } from '@/lib/admin';
import { UserDetailClient } from './UserDetailClient';

/**
 * Admin User Detail Page
 *
 * Requirements: Admin Dashboard 1 - User Management
 *
 * Displays detailed information about a specific user.
 */
export const dynamic = 'force-dynamic';



export const metadata = {
  title: 'User Details | Admin Dashboard',
  description: 'View and manage user details',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  // Enforce admin access
  await requireAdminPage();

  return (
    <div className="container mx-auto py-8">
      <UserDetailClient userId={params.id} />
    </div>
  );
}
