import { requireAdminPage } from '@/lib/admin';
import { AnalyticsDashboard } from './AnalyticsDashboard';

/**
 * Admin Dashboard Home Page
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 *
 * Displays overview statistics and analytics.
 */

export const metadata = {
  title: 'Admin Dashboard',
  description: 'System administration and management',
};

export default async function AdminDashboardPage() {
  // Enforce admin access
  await requireAdminPage();

  return <AnalyticsDashboard />;
}
