'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

/**
 * Content Moderation Client Component
 *
 * Requirements: Admin Dashboard 6 - Content Moderation
 * - Review generated content
 * - Flag inappropriate content
 * - Ban users for violations
 * - View moderation queue
 */

interface Generation {
  id: string;
  type: string;
  model: string;
  provider: string;
  prompt: string;
  result: string | null;
  status: string;
  error: string | null;
  credits: number;
  tokens: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  };
  workspace: {
    id: string;
    name: string;
  };
}

interface ModerationStats {
  period: number;
  statistics: {
    totalGenerations: number;
    failedGenerations: number;
    failureRate: string;
    suspendedUsers: number;
    moderationActions: number;
  };
  generationsByType: Array<{
    type: string;
    _count: number;
  }>;
  topFlaggedUsers: Array<{
    userId: string;
    flagCount: number;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      status: string;
    };
  }>;
}

export function ModerationClient() {
  const [activeTab, setActiveTab] = useState<'queue' | 'stats'>('queue');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] =
    useState<Generation | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationAction, setModerationAction] = useState<
    'flag' | 'remove' | 'ban_user'
  >('flag');

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue();
    } else {
      fetchStats();
    }
  }, [activeTab, typeFilter, statusFilter]);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/moderation/queue?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch moderation queue');
      }

      const data = await response.json();
      setGenerations(data.generations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch moderation queue'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/moderation/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch moderation statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch moderation statistics'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async () => {
    if (!selectedGeneration || !moderationReason.trim()) {
      setError('Please provide a reason for moderation');
      return;
    }

    try {
      const response = await fetch('/api/admin/moderation/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: selectedGeneration.id,
          reason: moderationReason,
          action: moderationAction,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to moderate content');
      }

      // Refresh the queue
      await fetchQueue();

      // Close modal
      setSelectedGeneration(null);
      setModerationReason('');
      setModerationAction('flag');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to moderate content'
      );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'SUSPENDED':
        return 'text-red-600';
      case 'INACTIVE':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-gray-600 mt-2">
          Review and moderate generated content
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'queue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Moderation Queue
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Statistics
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Moderation Queue Tab */}
      {activeTab === 'queue' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="SPEECH">Speech</option>
                  <option value="TRANSCRIPTION">Transcription</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={fetchQueue}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </div>

          {/* Content List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : generations.length === 0 ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No content to review
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                All content has been reviewed or no content matches your filters
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generations.map((generation) => (
                    <tr key={generation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {generation.type}
                        </span>
                        <div className="text-xs text-gray-500">
                          {generation.provider} / {generation.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {generation.user.firstName} {generation.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {generation.user.email}
                        </div>
                        <div
                          className={`text-xs font-medium ${getUserStatusColor(
                            generation.user.status
                          )}`}
                        >
                          {generation.user.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {generation.workspace.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            generation.status
                          )}`}
                        >
                          {generation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(generation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedGeneration(generation)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Total Generations</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.statistics.totalGenerations.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-3xl font-bold mt-2 text-red-600">
                    {stats.statistics.failedGenerations.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Failure Rate</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.statistics.failureRate}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Suspended Users</p>
                  <p className="text-3xl font-bold mt-2 text-red-600">
                    {stats.statistics.suspendedUsers.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-600">Moderation Actions</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.statistics.moderationActions.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Generations by Type */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Generations by Type
                </h3>
                <div className="space-y-3">
                  {stats.generationsByType.map((item) => (
                    <div
                      key={item.type}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">{item.type}</span>
                      <span className="text-gray-600">
                        {item._count.toLocaleString()} generations
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Flagged Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Top Flagged Users
                </h3>
                {stats.topFlaggedUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No flagged users in this period
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Flag Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.topFlaggedUsers.map((item) => (
                          <tr key={item.userId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.user.firstName} {item.user.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-sm font-medium ${getUserStatusColor(
                                  item.user.status
                                )}`}
                              >
                                {item.user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                              {item.flagCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Review Modal */}
      {selectedGeneration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Review Content</h3>
              <button
                onClick={() => setSelectedGeneration(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Generation Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGeneration.type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      selectedGeneration.status
                    )}`}
                  >
                    {selectedGeneration.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGeneration.user.firstName}{' '}
                    {selectedGeneration.user.lastName} (
                    {selectedGeneration.user.email})
                  </p>
                  <p
                    className={`text-xs font-medium ${getUserStatusColor(
                      selectedGeneration.user.status
                    )}`}
                  >
                    {selectedGeneration.user.status}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Workspace
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGeneration.workspace.name}
                  </p>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedGeneration.prompt}
                  </p>
                </div>
              </div>

              {/* Result */}
              {selectedGeneration.result && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Result
                  </label>
                  <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedGeneration.result}
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedGeneration.error && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error
                  </label>
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-900">
                      {selectedGeneration.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Moderation Form */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Moderation Action</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action
                    </label>
                    <select
                      value={moderationAction}
                      onChange={(e) =>
                        setModerationAction(
                          e.target.value as 'flag' | 'remove' | 'ban_user'
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="flag">Flag for Review</option>
                      <option value="remove">Remove Content</option>
                      <option value="ban_user">
                        Remove Content & Ban User
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (Required)
                    </label>
                    <textarea
                      value={moderationReason}
                      onChange={(e) => setModerationReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                      placeholder="Explain why this content is being moderated..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                onClick={() => setSelectedGeneration(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleModerate}
                variant="danger"
                disabled={!moderationReason.trim()}
              >
                Submit Moderation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
