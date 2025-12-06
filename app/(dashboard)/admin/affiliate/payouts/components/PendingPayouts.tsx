/**
 * Pending Payouts Component
 * Requirements: Affiliate 3 - Approve/reject payouts
 */

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface PendingPayoutsProps {
  payouts: any[];
}

export default function PendingPayouts({
  payouts: initialPayouts,
}: PendingPayoutsProps) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async (payoutId: string) => {
    setProcessing(payoutId);
    setError(null);

    try {
      const response = await fetch('/api/affiliate/payout/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve payout');
      }

      // Remove from pending list
      setPayouts(payouts.filter((p) => p.id !== payoutId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve payout');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (payoutId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setProcessing(payoutId);
    setError(null);

    try {
      const response = await fetch('/api/affiliate/payout/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject payout');
      }

      // Remove from pending list
      setPayouts(payouts.filter((p) => p.id !== payoutId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject payout');
    } finally {
      setProcessing(null);
    }
  };

  const handleProcess = async (payoutId: string) => {
    if (
      !confirm(
        'Are you sure you want to process this payout? This will mark it as paid.'
      )
    ) {
      return;
    }

    setProcessing(payoutId);
    setError(null);

    try {
      const response = await fetch('/api/affiliate/payout/admin/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process payout');
      }

      // Remove from pending list
      setPayouts(payouts.filter((p) => p.id !== payoutId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payout');
    } finally {
      setProcessing(null);
    }
  };

  if (payouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No pending payouts
        </h3>
        <p className="text-gray-600">All payout requests have been processed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {payouts.map((payout) => (
          <div
            key={payout.id}
            className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">👤</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {payout.affiliate.user.firstName}{' '}
                      {payout.affiliate.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {payout.affiliate.user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(payout.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Method</p>
                    <p className="text-sm font-medium text-gray-900">
                      {payout.method}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Affiliate Code</p>
                    <p className="text-sm font-medium text-gray-900">
                      {payout.affiliate.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Requested</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(payout.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(payout.affiliate.totalEarnings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Pending</p>
                    <p className="text-sm font-medium text-yellow-600">
                      {formatCurrency(payout.affiliate.pendingEarnings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Paid Out</p>
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(payout.affiliate.paidEarnings)}
                    </p>
                  </div>
                </div>

                {payout.notes && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Note:</span> {payout.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="ml-6 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleApprove(payout.id)}
                  loading={processing === payout.id}
                  disabled={processing !== null}
                >
                  ✓ Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleProcess(payout.id)}
                  loading={processing === payout.id}
                  disabled={processing !== null}
                >
                  💳 Process
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleReject(payout.id)}
                  loading={processing === payout.id}
                  disabled={processing !== null}
                >
                  ✗ Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
