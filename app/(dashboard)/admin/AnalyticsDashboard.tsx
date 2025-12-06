'use client';

import { useState, useEffect } from 'react';

/**
 * Analytics Dashboard Component
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 */

interface AnalyticsData {
  period: number;
  users: {
    total: number;
    active: number;
    new: number;
    suspended: number;
    growth: number;
  };
  workspaces: {
    total: number;
    growth: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    canceled: number;
  };
  revenue: {
    total: number;
    invoices: number;
    currency: string;
  };
  aiUsage: {
    totalGenerations: number;
    totalCreditsUsed: number;
    byType: Array<{
      type: string;
      _count: number;
      _sum: { credits: number | null };
    }>;
    byProvider: Array<{
      provider: string;
      _count: number;
      _sum: { credits: number | null };
    }>;
  };
  invoices: {
    total: number;
    paid: number;
  };
  credits: {
    transactions: Array<{
      type: string;
      _count: number;
      _sum: { amount: number | null };
    }>;
  };
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading || !analytics) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            System metrics and performance overview
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold mt-2">{analytics.users.total}</p>
              <p className="text-sm text-green-600 mt-2">
                +{analytics.users.new} new
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-3xl font-bold mt-2">
                {analytics.subscriptions.active}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {analytics.subscriptions.trialing} trialing
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(
                  analytics.revenue.total + analytics.revenue.invoices,
                  analytics.revenue.currency
                )}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {analytics.invoices.paid} paid invoices
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Generations</p>
              <p className="text-3xl font-bold mt-2">
                {analytics.aiUsage.totalGenerations.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {analytics.aiUsage.totalCreditsUsed.toLocaleString()} credits
              </p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold">{analytics.users.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold text-green-600">
                {analytics.users.active}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users (Period)</span>
              <span className="font-semibold text-blue-600">
                {analytics.users.new}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Suspended Users</span>
              <span className="font-semibold text-red-600">
                {analytics.users.suspended}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Workspace Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Workspaces</span>
              <span className="font-semibold">
                {analytics.workspaces.total}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Workspaces (Period)</span>
              <span className="font-semibold text-blue-600">
                {analytics.workspaces.growth}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg per User</span>
              <span className="font-semibold">
                {(analytics.workspaces.total / analytics.users.total).toFixed(
                  2
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AI Usage by Type</h2>
          <div className="space-y-3">
            {analytics.aiUsage.byType.map((item) => (
              <div
                key={item.type}
                className="flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">{item.type}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({item._count} generations)
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {(item._sum.credits || 0).toLocaleString()} credits
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By Provider */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AI Usage by Provider</h2>
          <div className="space-y-3">
            {analytics.aiUsage.byProvider.map((item) => (
              <div
                key={item.provider}
                className="flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">{item.provider}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({item._count} generations)
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {(item._sum.credits || 0).toLocaleString()} credits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <a
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 text-center"
          >
            <div className="font-medium">Manage Users</div>
            <div className="text-sm text-gray-600 mt-1">
              {analytics.users.total} total
            </div>
          </a>
          <a
            href="/admin/workspaces"
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 text-center"
          >
            <div className="font-medium">Manage Workspaces</div>
            <div className="text-sm text-gray-600 mt-1">
              {analytics.workspaces.total} total
            </div>
          </a>
          <a
            href="/admin/subscriptions"
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 text-center"
          >
            <div className="font-medium">Manage Subscriptions</div>
            <div className="text-sm text-gray-600 mt-1">
              {analytics.subscriptions.active} active
            </div>
          </a>
          <a
            href="/admin/reports"
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 text-center"
          >
            <div className="font-medium">Generate Reports</div>
            <div className="text-sm text-gray-600 mt-1">Export data</div>
          </a>
          <a
            href="/admin/audit-logs"
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 text-center"
          >
            <div className="font-medium">Audit Logs</div>
            <div className="text-sm text-gray-600 mt-1">Monitor actions</div>
          </a>
          <a
            href="/admin/settings"
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 text-center"
          >
            <div className="font-medium">System Settings</div>
            <div className="text-sm text-gray-600 mt-1">Configure</div>
          </a>
        </div>
      </div>
    </div>
  );
}
