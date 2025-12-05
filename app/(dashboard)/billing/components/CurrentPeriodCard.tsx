/**
 * Current Period Card Component
 * Requirements: 12.2 - Show current period charges
 */

interface CurrentPeriodCardProps {
  currentPeriod: {
    charges: number;
    usage: number;
    start: string | null;
    end: string | null;
  };
  subscription: any;
}

export default function CurrentPeriodCard({ currentPeriod, subscription }: CurrentPeriodCardProps) {
  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Current Period</h3>
        <p className="text-gray-500">No active billing period</p>
      </div>
    );
  }

  const startDate = currentPeriod.start ? new Date(currentPeriod.start) : null;
  const endDate = currentPeriod.end ? new Date(currentPeriod.end) : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Current Period</h3>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            ${(currentPeriod.charges / 100).toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">Estimated charges</p>
      </div>

      {startDate && endDate && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Period start</span>
            <span className="font-medium">{startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Period end</span>
            <span className="font-medium">{endDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-600">Credits used</span>
            <span className="font-medium">{currentPeriod.usage.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
