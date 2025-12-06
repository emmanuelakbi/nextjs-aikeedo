/**
 * Referrals List Component
 * Requirements: Affiliate 4 - Show referral statistics
 */

interface ReferralsListProps {
  affiliateId: string;
}

export default async function ReferralsList({
  affiliateId: _affiliateId,
}: ReferralsListProps) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/affiliate/referrals`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load referrals
      </div>
    );
  }

  const { data: referrals } = await response.json();

  if (!referrals || referrals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No referrals yet
        </h3>
        <p className="text-gray-600">
          Share your referral code to start earning commissions
        </p>
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
    CONVERTED: 'bg-green-100 text-green-800',
    CANCELED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Date
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Status
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Commission
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {referrals.slice(0, 10).map((referral: any) => (
            <tr
              key={referral.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-4 text-sm text-gray-900">
                {formatDate(referral.createdAt)}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    statusColors[referral.status as keyof typeof statusColors]
                  }`}
                >
                  {referral.status}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                {formatCurrency(referral.commission || 0)}
              </td>
              <td className="py-3 px-4 text-sm text-right text-gray-600">
                {formatCurrency(referral.conversionValue || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {referrals.length > 10 && (
        <div className="mt-4 text-center">
          <a
            href="/affiliate/referrals"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all {referrals.length} referrals →
          </a>
        </div>
      )}
    </div>
  );
}
