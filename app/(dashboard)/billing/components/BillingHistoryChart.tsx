/**
 * Billing History Chart Component
 * Requirements: 12.3 - Display past 12 months history
 */

'use client';

interface BillingHistoryChartProps {
  monthlySpending: Record<string, number>;
  totalSpent: number;
}

export default function BillingHistoryChart({
  monthlySpending,
  totalSpent,
}: BillingHistoryChartProps) {
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlySpending).sort();

  // Get last 12 months
  const last12Months = sortedMonths.slice(-12);

  // Find max value for scaling
  const maxSpending = Math.max(
    ...last12Months.map((month) => monthlySpending[month] || 0)
  );

  // Format month labels
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year || '0'), parseInt(month || '0') - 1);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="relative">
        <div className="flex items-end justify-between gap-2 h-64">
          {last12Months.map((month) => {
            const amount = monthlySpending[month] || 0;
            const heightPercentage =
              maxSpending > 0 ? (amount / maxSpending) * 100 : 0;

            return (
              <div
                key={month}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${heightPercentage}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${(amount / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 transform -rotate-45 origin-top-left mt-2">
                  {formatMonth(month)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Spent (12 months)</p>
          <p className="text-2xl font-bold text-gray-900">
            ${(totalSpent / 100).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Average Monthly</p>
          <p className="text-2xl font-bold text-gray-900">
            ${(totalSpent / Math.max(last12Months.length, 1) / 100).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Last Month</p>
          <p className="text-2xl font-bold text-gray-900">
            $
            {(() => {
              const lastMonth = last12Months[last12Months.length - 1];
              return lastMonth
                ? ((monthlySpending[lastMonth] || 0) / 100).toFixed(2)
                : '0.00';
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
