/**
 * Stats Cards Component
 * Requirements: Affiliate 4 - Show referral statistics, display earnings, track conversion rates
 */

interface StatsCardsProps {
  stats: {
    totalReferrals: number;
    convertedReferrals: number;
    conversionRate: string;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const cards = [
    {
      title: 'Total Referrals',
      value: stats.totalReferrals.toString(),
      subtitle: `${stats.convertedReferrals} converted`,
      icon: '👥',
      color: 'blue',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      subtitle: 'Of all referrals',
      icon: '📈',
      color: 'green',
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings),
      subtitle: 'All time',
      icon: '💰',
      color: 'purple',
    },
    {
      title: 'Pending Earnings',
      value: formatCurrency(stats.pendingEarnings),
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`text-3xl p-2 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}
            >
              {card.icon}
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {card.title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
          <p className="text-sm text-gray-500">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
