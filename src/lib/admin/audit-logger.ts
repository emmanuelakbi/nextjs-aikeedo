import prisma from '@/lib/db/prisma';

/**
 * Audit Logger for Admin Actions
 *
 * Requirements: Admin Dashboard 8 - Audit Logging
 *
 * Logs all administrative actions for compliance and security monitoring.
 */

export interface AuditLogData {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs an admin action to the database
 *
 * @param data - The audit log data
 * @returns The created audit log entry
 *
 * @example
 * ```typescript
 * await logAdminAction({
 *   adminId: session.user.id,
 *   action: 'user.suspend',
 *   targetType: 'user',
 *   targetId: userId,
 *   changes: { status: 'SUSPENDED' },
 *   ipAddress: request.headers.get('x-forwarded-for'),
 * });
 * ```
 */
export async function logAdminAction(data: AuditLogData) {
  return await prisma.adminAction.create({
    data: {
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      changes: data.changes || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    },
  });
}

/**
 * Gets audit logs with optional filtering
 *
 * @param options - Filter options
 * @returns Array of audit log entries
 */
export async function getAuditLogs(options?: {
  adminId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (options?.adminId) where.adminId = options.adminId;
  if (options?.targetType) where.targetType = options.targetType;
  if (options?.targetId) where.targetId = options.targetId;
  if (options?.action) where.action = options.action;

  return await prisma.adminAction.findMany({
    where,
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

/**
 * Gets audit logs for a specific target
 *
 * @param targetType - The type of target (e.g., 'user', 'workspace')
 * @param targetId - The ID of the target
 * @returns Array of audit log entries
 */
export async function getTargetAuditLogs(targetType: string, targetId: string) {
  return await getAuditLogs({ targetType, targetId });
}

/**
 * Gets audit logs for a specific admin user
 *
 * @param adminId - The ID of the admin user
 * @returns Array of audit log entries
 */
export async function getAdminAuditLogs(adminId: string) {
  return await getAuditLogs({ adminId });
}

/**
 * Higher-order function to wrap admin actions with automatic audit logging
 *
 * @param action - The action name (e.g., 'user.suspend')
 * @param targetType - The target type (e.g., 'user')
 * @param handler - The handler function that performs the action
 * @returns Wrapped handler with audit logging
 *
 * @example
 * ```typescript
 * const suspendUser = withAuditLog(
 *   'user.suspend',
 *   'user',
 *   async (adminId, targetId, changes, request) => {
 *     // Perform the action
 *     await prisma.user.update({
 *       where: { id: targetId },
 *       data: { status: 'SUSPENDED' },
 *     });
 *   }
 * );
 *
 * await suspendUser(session.user.id, userId, { status: 'SUSPENDED' }, request);
 * ```
 */
export function withAuditLog<T extends any[], R>(
  action: string,
  targetType: string,
  handler: (
    adminId: string,
    targetId: string,
    changes: Record<string, any>,
    ...args: T
  ) => Promise<R>
) {
  return async (
    adminId: string,
    targetId: string,
    changes: Record<string, any>,
    request?: Request,
    ...args: T
  ): Promise<R> => {
    // Execute the handler
    const result = await handler(adminId, targetId, changes, ...args);

    // Log the action
    await logAdminAction({
      adminId,
      action,
      targetType,
      targetId,
      changes,
      ipAddress: request?.headers.get('x-forwarded-for') || undefined,
      userAgent: request?.headers.get('user-agent') || undefined,
    });

    return result;
  };
}
