/**
 * Current Plan Card Component
 * Requirements: 12.1 - Show current plan and usage
 * Requirements: 8.5 - Show remaining trial days
 */

interface CurrentPlanCardProps {
  plan: any;
  subscription: any;
}

/**
 * Calculate remaining days until a future date
 */
function calculateRemainingDays(futureDate: string | null): number | null {
  if (!futureDate) return null;
  
  const now = new Date();
  const target = new Date(futureDate);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

export default function CurrentPlanCard({ plan, subscription }: CurrentPlanCardProps) {
  if (!plan || !subscription) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Current Plan</h3>
        <p className="text-gray-500">No active subscription</p>
        <p className="text-sm text-gray-400 mt-2">Subscribe to a plan to get started</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIALING: 'bg-blue-100 text-blue-800',
    PAST_DUE: 'bg-red-100 text-red-800',
    CANCELED: 'bg-gray-100 text-gray-800',
  };

  // Calculate remaining trial days
  // Requirements: 8.5
  const isTrialing = subscription.status === 'TRIALING';
  const trialDaysRemaining = isTrialing ? calculateRemainingDays(subscription.trialEnd) : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Current Plan</h3>
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">{plan.name}</p>
        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600">Price</span>
        <span className="font-semibold">
          ${(plan.price / 100).toFixed(2)}/{plan.interval}
        </span>
      </div>

      {plan.creditCount !== null && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600">Credits</span>
          <span className="font-semibold">{plan.creditCount.toLocaleString()}</span>
        </div>
      )}

      <div className="mt-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[subscription.status] || 'bg-gray-100 text-gray-800'}`}>
          {subscription.status}
        </span>
      </div>

      {/* Trial period information - Requirements: 8.5 */}
      {isTrialing && trialDaysRemaining !== null && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm font-medium text-blue-900">
            Trial Period Active
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {trialDaysRemaining === 0 
              ? 'Trial ends today' 
              : `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} remaining`}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            First payment on {new Date(subscription.trialEnd).toLocaleDateString()}
          </p>
        </div>
      )}

      {subscription.cancelAtPeriodEnd && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
      )}

      {subscription.daysUntilNextBilling !== null && !subscription.cancelAtPeriodEnd && !isTrialing && (
        <p className="text-xs text-gray-500 mt-3">
          Next billing in {subscription.daysUntilNextBilling} days
        </p>
      )}
    </div>
  );
}
