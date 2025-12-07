/**
 * Usage Breakdown Chart Component
 * Requirements: 12.4 - Show breakdown by service type
 */

'use client';

interface UsageData {
  serviceType: string;
  usage: number;
  percentage: number;
}

interface UsageBreakdownChartProps {
  usageData: UsageData[];
}

export default function UsageBreakdownChart({
  usageData,
}: UsageBreakdownChartProps) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
  ];

  const totalUsage = usageData.reduce((sum: number, item: any) => sum + item.usage, 0);

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="space-y-3">
        {usageData.map((item, index) => (
          <div key={item.serviceType}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">
                {item.serviceType}
              </span>
              <span className="text-gray-600">
                {item.usage.toLocaleString()} credits (
                {item.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${colors[index % colors.length]}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Total Usage</span>
          <span className="font-bold text-gray-900">
            {totalUsage.toLocaleString()} credits
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
        {usageData.map((item, index) => (
          <div key={item.serviceType} className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded ${colors[index % colors.length]}`}
            />
            <span className="text-xs text-gray-600">{item.serviceType}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
