'use client';

import { useEffect, useState } from 'react';
import { GenerationType } from '@/domain/types';

/**
 * Usage Dashboard Page
 *
 * Displays comprehensive usage statistics and credit consumption analytics
 *
 * Requirements: 7.1, 7.2
 */

interface UsageStatistics {
  totalGenerations: number;
  totalCredits: number;
  totalTokens: number;
  byType: {
    type: GenerationType;
    count: number;
    credits: number;
    tokens: number;
  }[];
  byModel: {
    model: string;
    count: number;
    credits: number;
    tokens: number;
  }[];
  byProvider: {
    provider: string;
    count: number;
    credits: number;
    tokens: number;
  }[];
  dailyUsage: {
    date: string;
    count: number;
    credits: number;
    tokens: number;
  }[];
}

interface UsageTrend {
  date: string;
  credits: number;
  generations: number;
}

interface RecentActivity {
  id: string;
  type: GenerationType;
  model: string;
  provider: string;
  credits: number;
  tokens: number;
  createdAt: string;
  status: string;
}

export default function UsagePage() {
  const [statistics, setStatistics] = useState<UsageStatistics | null>(null);
  const [trend, setTrend] = useState<UsageTrend[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, [period]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Fetch statistics
      const statsResponse = await fetch(
        `/api/usage?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!statsResponse.ok) throw new Error('Failed to fetch statistics');
      const statsData = await statsResponse.json();
      setStatistics(statsData);

      // Fetch trend
      const trendResponse = await fetch(
        `/api/usage/trend?days=${period === 'week' ? 7 : 30}`
      );
      if (!trendResponse.ok) throw new Error('Failed to fetch trend');
      const trendData = await trendResponse.json();
      setTrend(trendData);

      // Fetch recent activity
      const activityResponse = await fetch('/api/usage/activity?limit=10');
      if (!activityResponse.ok) throw new Error('Failed to fetch activity');
      const activityData = await activityResponse.json();
      setActivity(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchUsageData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No usage data available</p>
      </div>
    );
  }

  const maxCredits = Math.max(...trend.map((t) => t.credits), 1);

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your AI service usage and credit consumption
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Generations
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.totalGenerations.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
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
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Credits Used
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.totalCredits.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tokens
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.totalTokens.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit usage trend chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Credit Usage Trend
        </h2>
        <div className="h-64 flex items-end justify-between gap-1">
          {trend.map((item, index) => {
            const height = (item.credits / maxCredits) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group"
              >
                <div className="relative w-full">
                  <div
                    className="bg-blue-500 hover:bg-blue-600 transition-all rounded-t cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${item.date}: ${item.credits} credits, ${item.generations} generations`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.credits} credits
                      <br />
                      {item.generations} generations
                    </div>
                  </div>
                </div>
                {index % Math.ceil(trend.length / 7) === 0 && (
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage by type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Usage by Type
          </h2>
          <div className="space-y-4">
            {statistics.byType.map((item) => {
              const percentage =
                statistics.totalGenerations > 0
                  ? (item.count / statistics.totalGenerations) * 100
                  : 0;
              return (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      {item.type}
                    </span>
                    <span className="text-gray-500">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{item.credits} credits</span>
                    <span>{item.tokens.toLocaleString()} tokens</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage by provider */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Usage by Provider
          </h2>
          <div className="space-y-4">
            {statistics.byProvider.map((item) => {
              const percentage =
                statistics.totalGenerations > 0
                  ? (item.count / statistics.totalGenerations) * 100
                  : 0;
              return (
                <div key={item.provider}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      {item.provider}
                    </span>
                    <span className="text-gray-500">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{item.credits} credits</span>
                    <span>{item.tokens.toLocaleString()} tokens</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top models */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Top Models</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics.byModel
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map((item) => (
                  <tr key={item.model}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.credits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.tokens.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activity.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'TEXT'
                          ? 'bg-blue-100 text-blue-800'
                          : item.type === 'IMAGE'
                            ? 'bg-purple-100 text-purple-800'
                            : item.type === 'SPEECH'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.credits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
