import { requireAdminPage } from '@/lib/admin';
import { SubscriptionManagementClient } from './SubscriptionManagementClient';

/**
 * Admin Subscription Management Page
 *
 * Requirements: Admin Dashboard 3 - Subscription Management
 *
 * Displays a list of all subscriptions with management actions.
 */
export const dynamic = 'force-dynamic';



export const metadata = {
  title: 'Subscription Management | Admin Dashboard',
  description: 'Manage subscriptions and billing',
};

export default async function AdminSubscriptionsPage() {
  // Enforce admin access
  await requireAdminPage();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all subscriptions in the system
        </p>
      </div>

      <SubscriptionManagementClient />
    </div>
  );
}
