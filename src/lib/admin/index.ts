/**
 * Admin Utilities
 *
 * Requirements: Admin Dashboard 2, 8
 *
 * Central export for all admin-related utilities including
 * role-based access control and audit logging.
 */

// Re-export admin guard utilities
export {
  requireAdmin,
  requireAdminPage,
  checkIsAdmin,
  getAdminSession,
  isAdminSession,
  withAdminAuth,
  AdminAccessDeniedError,
} from '../auth/admin-guard';

// Re-export audit logging utilities
export {
  logAdminAction,
  getAuditLogs,
  getTargetAuditLogs,
  getAdminAuditLogs,
  withAuditLog,
  type AuditLogData,
} from './audit-logger';

// Re-export impersonation utilities
export {
  startImpersonation,
  endImpersonation,
  getImpersonationSession,
  isImpersonationSession,
  getAdminImpersonationSessions,
  cleanupExpiredSessions,
  type ImpersonationSession,
} from './impersonation';
