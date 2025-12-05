import { redirect } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/admin-guard';

/**
 * Admin Layout Component
 *
 * Requirements: Admin Dashboard 2 - Role-based access control
 *
 * This layout enforces admin access for all child pages.
 * Use this as the layout for admin routes.
 */

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Enforce admin access - will redirect if not admin
  await requireAdminPage();

  return <>{children}</>;
}
