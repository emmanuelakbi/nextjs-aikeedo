/**
 * Admin Payout Dashboard Component
 * Requirements: Affiliate 3 - Approve/reject payouts, process payouts, track payout history
 */

import PayoutStats from './components/PayoutStats';
import PendingPayouts from './components/PendingPayouts';
import PayoutHistory from './components/PayoutHistory';
import FraudAlerts from './components/FraudAlerts';

export default async function AdminPayoutDashboard() {
  // Fetch pending payouts
  const pendingResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/affiliate/payout/admin/pending`,
    {
      cache: 'no-store',
    }
  );

  const pendingPayouts = pendingResponse.ok
    ? (await pendingResponse.json()).data
    : [];

  // Calculate stats
  const totalPending = pendingPayouts.reduce(
    (sum: number, p: any) => sum + p.amount,
    0
  );
  const pendingCount = pendingPayouts.length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <PayoutStats pendingCount={pendingCount} totalPending={totalPending} />

      {/* Fraud Alerts */}
      <FraudAlerts />

      {/* Pending Payouts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Payout Requests</h2>
        <PendingPayouts payouts={pendingPayouts} />
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Payout History</h2>
        <PayoutHistory />
      </div>
    </div>
  );
}
