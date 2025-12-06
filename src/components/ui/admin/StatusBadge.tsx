'use client';

/**
 * Status Badge Component
 *
 * Requirements: Admin Dashboard - User Management, Workspace Management, Subscription Management
 *
 * Displays a colored badge for various status types.
 */

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'blue';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-orange-100 text-orange-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800',
  blue: 'bg-blue-100 text-blue-800',
};

export function StatusBadge({
  children,
  variant = 'neutral',
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Helper function to get badge variant based on user status
 */
export function getUserStatusVariant(status: string): BadgeVariant {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'neutral';
    case 'SUSPENDED':
      return 'error';
    default:
      return 'neutral';
  }
}

/**
 * Helper function to get badge variant based on subscription status
 */
export function getSubscriptionStatusVariant(status: string): BadgeVariant {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'success';
    case 'TRIALING':
      return 'info';
    case 'PAST_DUE':
      return 'warning';
    case 'CANCELED':
    case 'UNPAID':
      return 'error';
    case 'INCOMPLETE':
    case 'INCOMPLETE_EXPIRED':
      return 'warning';
    default:
      return 'neutral';
  }
}

/**
 * Helper function to get badge variant based on user role
 */
export function getUserRoleVariant(role: string): BadgeVariant {
  return role.toUpperCase() === 'ADMIN' ? 'purple' : 'blue';
}
