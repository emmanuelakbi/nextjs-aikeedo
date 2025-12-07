/**
 * Billing Dashboard Page
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import BillingDashboard from './BillingDashboard';
export const dynamic = 'force-dynamic';



export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Get current workspace
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      currentWorkspace: true,
    },
  });

  if (!user?.currentWorkspace) {
    redirect('/workspaces');
  }

  const workspace = user.currentWorkspace;
  const params = await searchParams;

  // Check for success/cancel status
  const purchaseSuccess = params.credit_purchase === 'success';
  const purchaseCanceled = params.credit_purchase === 'canceled';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Billing Dashboard</h1>

      {/* Success/Cancel Messages */}
      {purchaseSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            ✓ Credit purchase successful! Your credits have been added to your
            workspace.
          </p>
        </div>
      )}

      {purchaseCanceled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium">
            Credit purchase was canceled. No charges were made.
          </p>
        </div>
      )}

      {/* Billing Dashboard */}
      <Suspense fallback={<DashboardSkeleton />}>
        <BillingDashboard workspaceId={workspace.id} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
