import { requireAdminPage } from '@/lib/admin';
import { SystemSettingsClient } from './SystemSettingsClient';

/**
 * Admin System Settings Page
 *
 * Requirements: Admin Dashboard 4 - System Settings
 *
 * Displays and manages system-wide settings.
 */
export const dynamic = 'force-dynamic';



export const metadata = {
  title: 'System Settings | Admin Dashboard',
  description: 'Configure system-wide settings',
};

export default async function AdminSettingsPage() {
  // Enforce admin access
  await requireAdminPage();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure system-wide settings and preferences
        </p>
      </div>

      <SystemSettingsClient />
    </div>
  );
}
