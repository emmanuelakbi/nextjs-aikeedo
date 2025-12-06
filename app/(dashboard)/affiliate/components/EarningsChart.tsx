/**
 * Earnings Chart Component
 * Requirements: Affiliate 4 - Display earnings
 */

'use client';

import { useEffect, useState } from 'react';

interface EarningsChartProps {
  affiliateId: string;
}

export default function EarningsChart({ affiliateId }: EarningsChartProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          '/api/affiliate/reports?type=earnings&period=90d'
        );
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch earnings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [affiliateId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || !data.earningsByMonth || data.earningsByMonth.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>No earnings data available yet</p>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const maxAmount = Math.max(...data.earningsByMonth.map((m: any) => m.amount));

  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="space-y-3">
        {data.earningsByMonth.map((month: any) => {
          const percentage =
            maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;

          return (
            <div key={month.month} className="flex items-center gap-4">
              <div className="w-20 text-sm text-gray-600 font-medium">
                {month.month}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                >
                  {percentage > 20 && (
                    <span className="text-white text-sm font-medium">
                      {formatCurrency(month.amount)}
                    </span>
                  )}
                </div>
              </div>
              {percentage <= 20 && (
                <div className="w-20 text-sm text-gray-900 font-medium text-right">
                  {formatCurrency(month.amount)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            Total Earnings (90 days)
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(data.totalEarnings || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
