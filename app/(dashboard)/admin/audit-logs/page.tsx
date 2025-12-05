import { Metadata } from 'next';
import { AuditLogsClient } from './AuditLogsClient';

export const metadata: Metadata = {
  title: 'Audit Logs | Admin Dashboard',
  description: 'View and monitor admin actions and security events',
};

/**
 * Admin Audit Logs Page
 *
 * Requirements: Admin Dashboard 8 - Audit Logging
 * - Log all admin actions
 * - Track data changes
 * - Monitor security events
 * - Generate audit reports
 */

export default function AuditLogsPage() {
  return <AuditLogsClient />;
}
