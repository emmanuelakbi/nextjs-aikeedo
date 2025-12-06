'use client';

import { useState, useEffect } from 'react';
// SubscriptionStatus type
type SubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELED'
  | 'PAST_DUE'
  | 'TRIALING'
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'UNPAID';

/**
 * Subscription Management Client Component
 *
 * Requirements: Admin Dashboard 3 - Subscription Management
 */

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEnd: Date | null;
  createdAt: Date;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  workspace: {
    id: string;
    name: string;
    owner: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    creditCount: number | null;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function SubscriptionManagementClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSubscriptions();
  }, [pagination.page, search, statusFilter, sortBy, sortOrder]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubscriptions(data.subscriptions);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch subscriptions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (
    subscriptionId: string,
    workspaceName: string,
    immediate: boolean
  ) => {
    const confirmMessage = immediate
      ? `Are you sure you want to cancel the subscription for "${workspaceName}" immediately? This will take effect right away.`
      : `Are you sure you want to cancel the subscription for "${workspaceName}" at the end of the billing period?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    const reason = prompt(
      'Please provide a reason for cancellation (optional):'
    );

    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ immediate, reason }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchSubscriptions();
      } else {
        const data = await response.json();
        alert(`Failed to cancel subscription: ${data.error}`);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async (
    subscriptionId: string,
    workspaceName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to reactivate the subscription for "${workspaceName}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/reactivate`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchSubscriptions();
      } else {
        const data = await response.json();
        alert(`Failed to reactivate subscription: ${data.error}`);
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('Failed to reactivate subscription');
    }
  };

  const getStatusBadgeClass = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
        return 'bg-orange-100 text-orange-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'INCOMPLETE':
      case 'INCOMPLETE_EXPIRED':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNPAID':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Workspace, email, customer ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SubscriptionStatus | '');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIALING">Trialing</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELED">Canceled</option>
              <option value="INCOMPLETE">Incomplete</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="currentPeriodEnd">Period End</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No subscriptions found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.workspace.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.workspace.owner.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.plan.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subscription.plan.creditCount
                              ? `${subscription.plan.creditCount.toLocaleString()} credits`
                              : 'Unlimited'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              subscription.status
                            )}`}
                          >
                            {subscription.status}
                          </span>
                          {subscription.cancelAtPeriodEnd && (
                            <div className="text-xs text-orange-600 mt-1">
                              Cancels at period end
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>
                            Start:{' '}
                            {new Date(
                              subscription.currentPeriodStart
                            ).toLocaleDateString()}
                          </div>
                          <div>
                            End:{' '}
                            {new Date(
                              subscription.currentPeriodEnd
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(
                          subscription.plan.price,
                          subscription.plan.currency
                        )}
                        /{subscription.plan.interval}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/admin/subscriptions/${subscription.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </a>
                          {subscription.status === 'ACTIVE' &&
                            !subscription.cancelAtPeriodEnd && (
                              <>
                                <button
                                  onClick={() =>
                                    handleCancelSubscription(
                                      subscription.id,
                                      subscription.workspace.name,
                                      false
                                    )
                                  }
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    handleCancelSubscription(
                                      subscription.id,
                                      subscription.workspace.name,
                                      true
                                    )
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel Now
                                </button>
                              </>
                            )}
                          {subscription.cancelAtPeriodEnd && (
                            <button
                              onClick={() =>
                                handleReactivateSubscription(
                                  subscription.id,
                                  subscription.workspace.name
                                )
                              }
                              className="text-green-600 hover:text-green-900"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
