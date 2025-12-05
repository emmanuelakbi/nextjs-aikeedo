import { requireAdminPage } from '@/lib/admin';

/**
 * Admin Layout
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 *
 * Enforces admin access for all admin routes.
 */

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Enforce admin access - will redirect if not admin
  await requireAdminPage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Admin Navigation */}
        <nav className="bg-white shadow-sm mb-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <a
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/users"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Users
                </a>
                <a
                  href="/admin/workspaces"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Workspaces
                </a>
                <a
                  href="/admin/subscriptions"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Subscriptions
                </a>
                <a
                  href="/admin/reports"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Reports
                </a>
                <a
                  href="/admin/audit-logs"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Audit Logs
                </a>
                <a
                  href="/admin/moderation"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Moderation
                </a>
                <a
                  href="/admin/support"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Support
                </a>
                <a
                  href="/admin/settings"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300"
                >
                  Settings
                </a>
              </div>
              <div className="flex items-center">
                <a
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to Dashboard
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Admin Content */}
        {children}
      </div>
    </div>
  );
}
