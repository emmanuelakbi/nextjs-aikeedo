/**
 * Payout History Component
 * Requirements: Affiliate 4 - View payout history
 */

'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

interface PayoutHistoryProps {
  affiliateId: string;
}

export default function PayoutHistory({ affiliateId }: PayoutHistoryProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayouts();
  }, [affiliateId]);

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/affiliate/payout/list');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (!data?.stats?.totalPending || data.stats.totalPending < 5000) {
      setError('Minimum payout amount is $50.00');
      return;
    }

    setRequesting(true);
    setError('');

    try {
      const response = await fetch('/api/affiliate/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.stats.totalPending,
          method: 'PAYPAL',
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to request payout');
      }

      // Refresh payouts
      await fetchPayouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

  const payouts = data?.payouts || [];
  const stats = data?.stats || { totalPending: 0, totalPaid: 0, totalRequested: 0 };

  return (
    <div className="space-y-4">
      {/* Payout Request Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Available for Payout</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPending)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Minimum payout: $50.00
            </p>
          </div>
          <Button
            onClick={requestPayout}
            loading={requesting}
            disabled={stats.totalPending < 5000}
            variant="primary"
          >
            Request Payout
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Payout Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Requested</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(stats.totalRequested)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(stats.totalPaid)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-lg font-bold text-yellow-600">
            {formatCurrency(stats.totalPending)}
          </p>
        </div>
      </div>

      {/* Payout History Table */}
      {payouts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💸</div>
          <p>No payout history yet</p>
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
              {payouts.map((payout: any) => (
                <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {formatDate(payout.createdAt)}
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
