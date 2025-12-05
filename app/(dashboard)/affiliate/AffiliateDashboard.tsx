/**
 * Affiliate Dashboard Component
 * Requirements: Affiliate 4 - Show referral statistics, display earnings, track conversion rates, view payout history
 */

import StatsCards from './components/StatsCards';
import ReferralCodeCard from './components/ReferralCodeCard';
import ReferralsList from './components/ReferralsList';
import EarningsChart from './components/EarningsChart';
import PayoutHistory from './components/PayoutHistory';
import MarketingMaterials from './components/MarketingMaterials';
import CreateAffiliateCard from './components/CreateAffiliateCard';

interface AffiliateDashboardProps {
  userId: string;
}

export default async function AffiliateDashboard({ userId: _userId }: AffiliateDashboardProps) {
  // Fetch affiliate account
  const affiliateResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/affiliate`,
    {
      cache: 'no-store',
      headers: {
        'Cookie': '', // Session will be handled by NextAuth
      },
    }
  );

  // If no affiliate account exists, show create account card
  if (!affiliateResponse.ok) {
    return <CreateAffiliateCard />;
  }

  const { data: affiliate } = await affiliateResponse.json();

  // Fetch stats
  const statsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/affiliate/stats`,
    {
      cache: 'no-store',
    }
  );

  const stats = statsResponse.ok ? (await statsResponse.json()).data : null;

  return (
    <div className="space-y-6">
      {/* Referral Code Card */}
      <ReferralCodeCard affiliate={affiliate} />

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Earnings Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Earnings Overview</h2>
        <EarningsChart affiliateId={affiliate.id} />
      </div>

      {/* Recent Referrals */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Referrals</h2>
        <ReferralsList affiliateId={affiliate.id} />
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Payout History</h2>
        <PayoutHistory affiliateId={affiliate.id} />
      </div>

      {/* Marketing Materials */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Marketing Materials</h2>
        <MarketingMaterials affiliateId={affiliate.id} />
      </div>
    </div>
  );
}
