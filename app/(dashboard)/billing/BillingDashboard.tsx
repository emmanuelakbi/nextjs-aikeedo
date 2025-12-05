/**
 * Billing Dashboard Component
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import CurrentPlanCard from './components/CurrentPlanCard';
import UsageCard from './components/UsageCard';
import CurrentPeriodCard from './components/CurrentPeriodCard';
import UsageBreakdownChart from './components/UsageBreakdownChart';
import BillingHistoryChart from './components/BillingHistoryChart';
import InvoicesList from './components/InvoicesList';
import CreditPurchaseForm from './CreditPurchaseForm';

interface BillingDashboardProps {
  workspaceId: string;
}

export default async function BillingDashboard({ workspaceId }: BillingDashboardProps) {
  // Fetch dashboard data from API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/dashboard?workspaceId=${workspaceId}`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load billing dashboard. Please try again later.</p>
      </div>
    );
  }

  const data = await response.json();

  return (
    <div className="space-y-6">
      {/* Requirements: 12.1 - Current plan and usage, 12.5 - Remaining quota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CurrentPlanCard 
          plan={data.currentPlan}
          subscription={data.subscription}
        />
        <UsageCard 
          credits={data.credits}
          currentPeriod={data.currentPeriod}
        />
        <CurrentPeriodCard 
          currentPeriod={data.currentPeriod}
          subscription={data.subscription}
        />
      </div>

      {/* Requirements: 12.4 - Usage breakdown by service type */}
      {data.usage.byServiceType.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Usage Breakdown</h2>
          <UsageBreakdownChart usageData={data.usage.byServiceType} />
        </div>
      )}

      {/* Requirements: 12.3 - Past 12 months history */}
      {data.billingHistory.invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Billing History</h2>
          <BillingHistoryChart 
            monthlySpending={data.billingHistory.monthlySpending}
            totalSpent={data.billingHistory.totalSpent}
          />
        </div>
      )}

      {/* Credit Purchase */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Purchase Additional Credits</h2>
        <p className="text-gray-600 mb-6">
          Need more credits? Purchase additional credits for your AI services.
        </p>
        <CreditPurchaseForm workspaceId={workspaceId} />
      </div>

      {/* Requirements: 12.2, 12.3 - Recent invoices */}
      {data.billingHistory.invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
          <InvoicesList invoices={data.billingHistory.invoices} />
        </div>
      )}

      {/* Payment Methods */}
      {data.paymentMethods.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
          <div className="space-y-3">
            {data.paymentMethods.map((pm: any) => (
              <div key={pm.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💳</div>
                  <div>
                    <p className="font-medium">
                      {pm.card?.brand.toUpperCase()} •••• {pm.card?.last4}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires {pm.card?.expMonth}/{pm.card?.expYear}
                    </p>
                  </div>
                </div>
                {pm.isDefault && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
