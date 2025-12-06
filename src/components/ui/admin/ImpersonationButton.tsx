'use client';

import { useState } from 'react';
import { useImpersonation } from '@/lib/hooks/use-impersonation';
import { Button } from '@/components/ui/Button';

/**
 * Impersonation Button Component
 *
 * Requirements: Admin Dashboard 1 - User Management (Impersonate users for support)
 *
 * Provides a button to start impersonating a user with confirmation dialog.
 */

interface ImpersonationButtonProps {
  userId: string;
  userEmail: string;
  userName: string;
  onSuccess?: () => void;
}

export function ImpersonationButton({
  userId,
  userEmail,
  userName,
  onSuccess,
}: ImpersonationButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { startImpersonation, loading, error } = useImpersonation();

  const handleImpersonate = async () => {
    const session = await startImpersonation(userId);

    if (session) {
      setShowConfirm(false);
      onSuccess?.();

      // Open impersonation in new tab
      window.open(
        `/dashboard?impersonation=${session.id}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-2">Confirm Impersonation</h3>
          <p className="text-gray-600 mb-4">
            You are about to impersonate <strong>{userName}</strong> (
            {userEmail}). This action will be logged for security purposes.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            The impersonation session will expire after 1 hour.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImpersonate}
              disabled={loading}
            >
              {loading ? 'Starting...' : 'Start Impersonation'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={() => setShowConfirm(true)}
      disabled={loading}
    >
      Impersonate User
    </Button>
  );
}
