/**
 * Payout Stats Component
 * Requirements: Affiliate 3 - Track payout history
 */

'use client';

interface PayoutStatsProps {
  pendingCount: number;
  totalPending: number;
}

export default function PayoutStats({
  pendingCount,
  totalPending,
}: PayoutStatsProps) {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const stats = [
    {
      title: 'Pending Requests',
      value: pendingCount.toString(),
      subtitle: 'Awaiting review',
      icon: '⏳',
      color: 'yellow',
    },
    {
      title: 'Total Pending Amount',
      value: formatCurrency(totalPending),
      subtitle: 'To be processed',
      icon: '💰',
      color: 'blue',
    },
    {
      title: 'Average Payout',
      value:
        pendingCount > 0
          ? formatCurrency(Math.floor(totalPending / pendingCount))
          : '$0.00',
      subtitle: 'Per request',
      icon: '📊',
      color: 'purple',
    },
  ];

  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`text-3xl p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}
            >
              {stat.icon}
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {stat.title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
          <p className="text-sm text-gray-500">{stat.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
