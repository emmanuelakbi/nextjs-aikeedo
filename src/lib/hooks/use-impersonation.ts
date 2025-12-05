import { useState } from 'react';

/**
 * Impersonation Hook
 *
 * Requirements: Admin Dashboard 1 - User Management (Impersonate users for support)
 *
 * Provides utilities for managing user impersonation in the admin UI.
 */

export interface ImpersonationSession {
  id: string;
  targetUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  expiresAt: string;
  createdAt?: string;
}

export function useImpersonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Starts an impersonation session
   */
  const startImpersonation = async (
    userId: string
  ): Promise<ImpersonationSession | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start impersonation');
      }

      const data = await response.json();
      return data.session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ends an impersonation session
   */
  const endImpersonation = async (
    userId: string,
    sessionId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/impersonate?sessionId=${sessionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to end impersonation');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets all active impersonation sessions
   */
  const getActiveSessions = async (): Promise<ImpersonationSession[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/impersonation');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get impersonation sessions');
      }

      const data = await response.json();
      return data.sessions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    startImpersonation,
    endImpersonation,
    getActiveSessions,
    loading,
    error,
  };
}
