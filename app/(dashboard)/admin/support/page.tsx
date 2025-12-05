import { Metadata } from 'next';
import { SupportToolsClient } from './SupportToolsClient';

export const metadata: Metadata = {
  title: 'Support Tools | Admin Dashboard',
  description: 'System health monitoring and announcement management',
};

/**
 * Admin Support Tools Page
 *
 * Requirements: Admin Dashboard 7 - Support Tools
 * - Monitor system health
 * - Manage announcements
 */

export default function SupportToolsPage() {
  return <SupportToolsClient />;
}
