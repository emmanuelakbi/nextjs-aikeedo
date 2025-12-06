/**
 * Earnings Report Component
 * Requirements: Affiliate 3, 4 - Generate affiliate reports, display earnings
 */

'use client';

interface EarningsReportProps {
  data: any;
}

export default function EarningsReport({ data }: EarningsReportProps) {
  if (!data || !data.earningsByMonth) return null;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const maxAmount = Math.max(
    ...data.earningsByMonth.map((m: any) => m.amount),
    1
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Earnings Report
        </h2>
        <p className="text-gray-600">
          Monthly breakdown of your affiliate earnings
        </p>
      </div>

      {/* Total Earnings Card */}
      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Total Earnings (Period)
            </p>
            <p className="text-4xl font-bold text-green-600">
              {formatCurrency(data.totalEarnings || 0)}
            </p>
          </div>
          <div className="text-6xl">💰</div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {data.earningsByMonth.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No earnings data
          </h3>
          <p className="text-gray-600">
            No earnings recorded for the selected period
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Breakdown
          </h3>

          {data.earningsByMonth.map((month: any) => {
            const percentage = (month.amount / maxAmount) * 100;

            return (
              <div key={month.month} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600 font-medium">
                  {new Date(month.month + '-01').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                  })}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-10 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-4"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  >
                    {percentage > 25 && (
                      <span className="text-white text-sm font-medium">
                        {formatCurrency(month.amount)}
                      </span>
                    )}
                  </div>
                </div>
                {percentage <= 25 && (
                  <div className="w-24 text-sm text-gray-900 font-medium text-right">
                    {formatCurrency(month.amount)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Period Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Report Period:</span>
          <span className="font-medium text-gray-900">
            {new Date(data.startDate).toLocaleDateString()} -{' '}
            {new Date(data.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
