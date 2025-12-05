'use client';

import { useEffect, useState } from 'react';
import { useImpersonation, ImpersonationSession } from '@/lib/hooks/use-impersonation';
import { Button } from '@/components/ui/Button';

/**
 * Active Impersonations Component
 *
 * Requirements: Admin Dashboard 1 - User Management (Impersonate users for support)
 *
 * Displays all active impersonation sessions for the current admin.
 */

export function ActiveImpersonations() {
  const [sessions, setSessions] = useState<ImpersonationSession[]>([]);
  const { getActiveSessions, endImpersonation, loading } = useImpersonation();

  const loadSessions = async () => {
    const activeSessions = await getActiveSessions();
    setSessions(activeSessions);
  };

  useEffect(() => {
    loadSessions();
    // Refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEndImpersonation = async (
    userId: string,
    sessionId: string
  ) => {
    const success = await endImpersonation(userId, sessionId);
    if (success) {
      loadSessions();
    }
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-yellow-900 mb-3">
        Active Impersonation Sessions
      </h3>
      <div className="space-y-2">
        {sessions.map((session) => {
          const expiresAt = new Date(session.expiresAt);
          const timeRemaining = Math.max(
            0,
            Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60)
          );

          return (
            <div
              key={session.id}
              className="flex items-center justify-between bg-white rounded p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {session.targetUser.firstName} {session.targetUser.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {session.targetUser.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Expires in {timeRemaining} minutes
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleEndImpersonation(
                    session.targetUser.id,
                    session.id
                  )
                }
                disabled={loading}
              >
                End Session
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
