/**
 * Affiliate Reports Page
 * Requirements: Affiliate 3, 4 - Generate affiliate reports
 */

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AffiliateReports from './AffiliateReports';

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Affiliate Reports</h1>
        <p className="text-gray-600">
          Generate and view detailed reports about your affiliate performance
        </p>
      </div>

      <Suspense fallback={<ReportsSkeleton />}>
        <AffiliateReports userId={session.user.id} />
      </Suspense>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
