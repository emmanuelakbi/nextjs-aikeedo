/**
 * Usage Card Component
 * Requirements: 12.1 - Show usage, 12.5 - Indicate remaining quota
 */

interface UsageCardProps {
  credits: {
    current: number;
    limit: number | null;
    used: number;
    remaining: number | null;
    percentageUsed: number | null;
  };
  currentPeriod: {
    usage: number;
  };
}

export default function UsageCard({ credits, currentPeriod }: UsageCardProps) {
  const hasLimit = credits.limit !== null;
  const percentageUsed = credits.percentageUsed || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Credit Balance</h3>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-blue-600">
            {credits.current.toLocaleString()}
          </span>
          <span className="text-gray-600">credits</span>
        </div>
      </div>

      {hasLimit && (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Usage this period</span>
              <span className="font-medium">
                {currentPeriod.usage.toLocaleString()} / {credits.limit?.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  percentageUsed > 90 ? 'bg-red-500' :
                  percentageUsed > 70 ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className={`font-semibold ${
              credits.remaining !== null && credits.remaining < (credits.limit || 0) * 0.1
                ? 'text-red-600'
                : 'text-green-600'
            }`}>
              {credits.remaining?.toLocaleString() || 0} credits
            </span>
          </div>
        </>
      )}

      {!hasLimit && (
        <div className="text-sm text-gray-600">
          <p>Unlimited credits</p>
          <p className="mt-1">Used this period: {currentPeriod.usage.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
