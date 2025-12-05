/**
 * Summary Report Component
 * Requirements: Affiliate 3, 4 - Generate affiliate reports
 */

'use client';

interface SummaryReportProps {
  data: any;
}

export default function SummaryReport({ data }: SummaryReportProps) {
  if (!data) return null;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const metrics = [
    {
      title: 'Total Referrals',
      value: data.totalReferrals,
      subtitle: `${data.convertedReferrals} converted`,
      icon: '👥',
      color: 'blue',
    },
    {
      title: 'Conversion Rate',
      value: `${data.conversionRate}%`,
      subtitle: 'Success rate',
      icon: '📈',
      color: 'green',
    },
    {
      title: 'Total Commission',
      value: formatCurrency(data.totalCommission),
      subtitle: 'Earned in period',
      icon: '💰',
      color: 'purple',
    },
    {
      title: 'Total Payouts',
      value: formatCurrency(data.totalPayouts),
      subtitle: 'Paid out',
      icon: '💸',
      color: 'green',
    },
    {
      title: 'Pending Earnings',
      value: formatCurrency(data.pendingEarnings),
      subtitle: 'Available for payout',
      icon: '⏳',
      color: 'yellow',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Summary Report</h2>
        <p className="text-gray-600">
          Overview of your affiliate performance for the selected period
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <div key={metric.title} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`text-3xl p-2 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                {metric.icon}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.title}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <p className="text-sm text-gray-500">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Period Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Report Period:</span>
          <span className="font-medium text-gray-900">
            {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
