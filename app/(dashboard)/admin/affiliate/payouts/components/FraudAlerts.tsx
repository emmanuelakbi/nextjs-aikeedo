/**
 * Fraud Alerts Component
 * Requirements: Affiliate 5 - Detect self-referrals, identify suspicious patterns
 */

'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchFraudAlerts();
  }, []);

  const fetchFraudAlerts = async () => {
    try {
      const response = await fetch('/api/affiliate/fraud');
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch fraud alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (affiliateId: string, action: 'SUSPEND' | 'BAN' | 'REVIEW') => {
    const reason = prompt(`Enter reason for ${action.toLowerCase()}:`);
    if (!reason) return;

    setProcessing(affiliateId);

    try {
      const response = await fetch('/api/affiliate/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, reason, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process action');
      }

      // Refresh alerts
      await fetchFraudAlerts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process action');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Fraud Alerts</h2>
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Fraud Alerts</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-600">No suspicious activity detected</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Fraud Alerts</h2>
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
          {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.affiliate.id}
            className={`border-2 rounded-lg p-4 ${getRiskColor(alert.riskLevel)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-semibold">
                      {alert.affiliate.code} - {alert.affiliate.user.email}
                    </h3>
                    <p className="text-sm opacity-80">
                      Risk Level: <span className="font-bold">{alert.riskLevel}</span> (Score: {alert.riskScore})
                    </p>
                  </div>
                </div>

                {/* Flags */}
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Suspicious Activity:</p>
                  <ul className="space-y-1">
                    {alert.flags.map((flag: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span>•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-3 p-3 bg-white/50 rounded-lg">
                  <div>
                    <p className="text-xs opacity-80 mb-1">Referrals</p>
                    <p className="text-sm font-bold">{alert.metrics.totalReferrals}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Converted</p>
                    <p className="text-sm font-bold">{alert.metrics.convertedReferrals}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Conv. Rate</p>
                    <p className="text-sm font-bold">{alert.metrics.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Earnings</p>
                    <p className="text-sm font-bold">
                      {formatCurrency(alert.metrics.totalEarnings)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleAction(alert.affiliate.id, 'SUSPEND')}
                  loading={processing === alert.affiliate.id}
                  disabled={processing !== null}
                >
                  Suspend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(alert.affiliate.id, 'REVIEW')}
                  loading={processing === alert.affiliate.id}
                  disabled={processing !== null}
                >
                  Review
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
