/**
 * Admin Affiliate Overview Page
 * Requirements: Affiliate 3, 5 - Track affiliate performance, detect fraud
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
export const dynamic = 'force-dynamic';



export default async function AdminAffiliatePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Affiliate Management</h1>
        <p className="text-gray-600">
          Manage affiliates, payouts, and monitor program performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Payout Management */}
        <Link
          href="/admin/affiliate/payouts"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">💰</div>
          <h2 className="text-xl font-semibold mb-2">Payout Management</h2>
          <p className="text-gray-600 mb-4">
            Review and process affiliate payout requests
          </p>
          <span className="text-blue-600 font-medium">Manage Payouts →</span>
        </Link>

        {/* Affiliate List */}
        <Link
          href="/admin/affiliate/list"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">👥</div>
          <h2 className="text-xl font-semibold mb-2">Affiliate List</h2>
          <p className="text-gray-600 mb-4">
            View and manage all affiliate accounts
          </p>
          <span className="text-blue-600 font-medium">View Affiliates →</span>
        </Link>

        {/* Fraud Detection */}
        <Link
          href="/admin/affiliate/fraud"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Fraud Detection</h2>
          <p className="text-gray-600 mb-4">
            Monitor suspicious activity and patterns
          </p>
          <span className="text-blue-600 font-medium">View Alerts →</span>
        </Link>

        {/* Reports */}
        <Link
          href="/admin/affiliate/reports"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-semibold mb-2">Reports</h2>
          <p className="text-gray-600 mb-4">
            Generate and view affiliate program reports
          </p>
          <span className="text-blue-600 font-medium">View Reports →</span>
        </Link>

        {/* Leaderboard */}
        <Link
          href="/admin/affiliate/leaderboard"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-xl font-semibold mb-2">Leaderboard</h2>
          <p className="text-gray-600 mb-4">View top performing affiliates</p>
          <span className="text-blue-600 font-medium">View Leaderboard →</span>
        </Link>

        {/* Settings */}
        <Link
          href="/admin/affiliate/settings"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p className="text-gray-600 mb-4">
            Configure affiliate program settings
          </p>
          <span className="text-blue-600 font-medium">Manage Settings →</span>
        </Link>
      </div>
    </div>
  );
}
