import { Metadata } from 'next';
import { ReportsClient } from './ReportsClient';

export const metadata: Metadata = {
  title: 'Reports | Admin Dashboard',
  description: 'Generate and export system reports',
};

/**
 * Admin Reports Page
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 * - Generate financial reports
 * - Export data for analysis
 */

export default function ReportsPage() {
  return <ReportsClient />;
}
