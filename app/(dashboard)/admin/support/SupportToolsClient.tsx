'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

/**
 * Support Tools Client Component
 *
 * Requirements: Admin Dashboard 7 - Support Tools
 * - Monitor system health
 * - Manage announcements
 */

interface SystemHealth {
  status: string;
  timestamp: string;
  responseTime: number;
  database: {
    status: string;
    responseTime: number;
  };
  statistics: {
    users: number;
    workspaces: number;
    activeSubscriptions: number;
    recentGenerations: number;
    recentErrors: number;
    errorRate: string;
  };
  system: {
    uptime: string;
    uptimeSeconds: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
    platform: string;
    arch: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  creator: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export function SupportToolsClient() {
  const [activeTab, setActiveTab] = useState<'health' | 'announcements'>('health');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(
    null
  );

  useEffect(() => {
    if (activeTab === 'health') {
      fetchHealth();
    } else {
      fetchAnnouncements();
    }
  }, [activeTab]);

  const fetchHealth = async () => {
    setHealthLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/system-health');
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }

      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system health');
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/announcements');
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      setAnnouncements(data.announcements);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch announcements'
      );
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Support Tools</h1>
        <p className="text-gray-600 mt-2">
          Monitor system health and manage announcements
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('health')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'health'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Health
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'announcements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Announcements
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'health' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Health Status</h2>
            <Button onClick={fetchHealth} disabled={healthLoading} size="sm">
              {healthLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {healthLoading && !health ? (
            <div className="flex justify-center items-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : health ? (
            <>
              {/* Overall Status */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Overall Status</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        health.status
                      )}`}
                    >
                      {health.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last checked</p>
                    <p className="text-sm font-medium">{formatDate(health.timestamp)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Response time: {health.responseTime}ms
                    </p>
                  </div>
                </div>
              </div>

              {/* Database Health */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Database</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        health.database.status
                      )}`}
                    >
                      {health.database.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="text-lg font-semibold mt-1">
                      {health.database.responseTime}ms
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Statistics (Last 24h)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Users</p>
                    <p className="text-2xl font-bold mt-1">
                      {health.statistics.users.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Workspaces</p>
                    <p className="text-2xl font-bold mt-1">
                      {health.statistics.workspaces.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Subs</p>
                    <p className="text-2xl font-bold mt-1">
                      {health.statistics.activeSubscriptions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Generations</p>
                    <p className="text-2xl font-bold mt-1">
                      {health.statistics.recentGenerations.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Errors</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {health.statistics.recentErrors.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold mt-1">{health.statistics.errorRate}</p>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Runtime</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium">{health.system.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Node Version:</span>
                        <span className="font-medium">{health.system.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform:</span>
                        <span className="font-medium">
                          {health.system.platform} ({health.system.arch})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Memory Usage (MB)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">RSS:</span>
                        <span className="font-medium">{health.system.memory.rss} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Heap Total:</span>
                        <span className="font-medium">
                          {health.system.memory.heapTotal} MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Heap Used:</span>
                        <span className="font-medium">
                          {health.system.memory.heapUsed} MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">External:</span>
                        <span className="font-medium">
                          {health.system.memory.external} MB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Announcements</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Announcement
            </Button>
          </div>

          {announcementsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No announcements
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new announcement
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`border rounded-lg p-6 ${getAnnouncementColor(
                    announcement.type
                  )}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{announcement.title}</h3>
                        {!announcement.isActive && (
                          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingAnnouncement(announcement)}
                        className="text-sm text-gray-700 hover:text-gray-900"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-600">
                    <p>
                      Created by {announcement.creator.firstName}{' '}
                      {announcement.creator.lastName} on {formatDate(announcement.createdAt)}
                    </p>
                    {announcement.endDate && (
                      <p>Expires: {formatDate(announcement.endDate)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal - Placeholder for now */}
      {(showCreateModal || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold">
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Announcement form will be implemented here
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAnnouncement(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
