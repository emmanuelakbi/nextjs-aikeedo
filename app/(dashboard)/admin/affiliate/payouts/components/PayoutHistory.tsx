/**
 * Payout History Component (Admin)
 * Requirements: Affiliate 3 - Track payout history, generate payout reports
 */

'use client';

import { useEffect, useState } from 'react';

export default function PayoutHistory() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'approved' | 'paid' | 'rejected'
  >('all');

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      // Fetch all payouts (we'll need to create this endpoint or use existing one)
      const response = await fetch('/api/affiliate/payout/admin/pending');
      if (response.ok) {
        const result = await response.json();
        // This would need to be updated to fetch all payouts, not just pending
        setPayouts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredPayouts =
    filter === 'all'
      ? payouts
      : payouts.filter((p) => p.status === filter.toUpperCase());

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['all', 'approved', 'paid', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Payouts Table */}
      {filteredPayouts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No {filter !== 'all' ? filter : ''} payouts found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Affiliate
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Method
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((payout) => (
                <tr
                  key={payout.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {formatDate(payout.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payout.affiliate?.code || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {payout.affiliate?.user?.email || 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payout.method}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[payout.status as keyof typeof statusColors]
                      }`}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(payout.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
