/**
 * Conversions Report Component
 * Requirements: Affiliate 4 - Track conversion rates
 */

'use client';

interface ConversionsReportProps {
  data: any;
}

export default function ConversionsReport({ data }: ConversionsReportProps) {
  if (!data) return null;

  const { byStatus, conversionsByWeek, conversionRate } = data;

  const statusData = [
    {
      status: 'Converted',
      count: byStatus.converted,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: '✓',
    },
    {
      status: 'Pending',
      count: byStatus.pending,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: '⏳',
    },
    {
      status: 'Canceled',
      count: byStatus.canceled,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: '✗',
    },
  ];

  const total = byStatus.converted + byStatus.pending + byStatus.canceled;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversions Report</h2>
        <p className="text-gray-600">
          Detailed breakdown of referral conversions
        </p>
      </div>

      {/* Conversion Rate Card */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Conversion Rate</p>
            <p className="text-4xl font-bold text-blue-600">{conversionRate}%</p>
            <p className="text-sm text-gray-600 mt-2">
              {byStatus.converted} of {total} referrals converted
            </p>
          </div>
          <div className="text-6xl">📈</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusData.map((item) => {
            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
            
            return (
              <div key={item.status} className={`${item.bgColor} border border-gray-200 rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-2xl ${item.textColor}`}>{item.icon}</span>
                  <span className="text-sm font-medium text-gray-600">{percentage}%</span>
                </div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">{item.status}</h4>
                <p className={`text-3xl font-bold ${item.textColor}`}>{item.count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Conversions */}
      {conversionsByWeek && conversionsByWeek.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Conversions</h3>
          <div className="space-y-3">
            {conversionsByWeek.map((week: any) => {
              const maxCount = Math.max(...conversionsByWeek.map((w: any) => w.count));
              const percentage = (week.count / maxCount) * 100;
              
              return (
                <div key={week.week} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-600 font-medium">
                    {new Date(week.week).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(percentage, 10)}%` }}
                    >
                      {percentage > 20 && (
                        <span className="text-white text-sm font-medium">
                          {week.count}
                        </span>
                      )}
                    </div>
                  </div>
                  {percentage <= 20 && (
                    <div className="w-16 text-sm text-gray-900 font-medium text-right">
                      {week.count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Period Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Report Period:</span>
          <span className="font-medium text-gray-900">
            {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
