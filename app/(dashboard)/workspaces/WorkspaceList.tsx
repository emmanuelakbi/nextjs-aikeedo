'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';

/**
 * Workspace list component
 * Requirements: 8.3, 8.4
 */

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  creditCount: number;
  allocatedCredits: number;
  isTrialed: boolean;
  createdAt: Date;
  isOwner: boolean;
  isCurrent: boolean;
}

interface WorkspaceListProps {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  currentWorkspaceId,
}) => {
  const router = useRouter();
  const toast = useToast();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspaceId) {
      return;
    }

    setSwitchingId(workspaceId);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/switch`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to switch workspace');
      }

      toast.success('Workspace switched successfully');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to switch workspace'
      );
    } finally {
      setSwitchingId(null);
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No workspaces
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {workspace.name}
                    </h3>
                    {workspace.isCurrent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                    {workspace.isOwner && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <svg
                        className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{workspace.creditCount} credits available</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        Created{' '}
                        {new Date(workspace.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  {!workspace.isCurrent && (
                    <Button
                      onClick={() => handleSwitch(workspace.id)}
                      loading={switchingId === workspace.id}
                      disabled={switchingId !== null}
                      size="sm"
                    >
                      Switch
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkspaceList;
