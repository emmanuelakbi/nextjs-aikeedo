/**
 * Report Filters Component
 * Requirements: Affiliate 3 - Generate payout reports
 */

'use client';

interface ReportFiltersProps {
  reportType: 'summary' | 'earnings' | 'conversions' | 'detailed';
  period: '7d' | '30d' | '90d' | '1y' | 'all';
  onReportTypeChange: (
    type: 'summary' | 'earnings' | 'conversions' | 'detailed'
  ) => void;
  onPeriodChange: (period: '7d' | '30d' | '90d' | '1y' | 'all') => void;
}

export default function ReportFilters({
  reportType,
  period,
  onReportTypeChange,
  onPeriodChange,
}: ReportFiltersProps) {
  const reportTypes = [
    { value: 'summary', label: 'Summary', icon: '📊' },
    { value: 'earnings', label: 'Earnings', icon: '💰' },
    { value: 'conversions', label: 'Conversions', icon: '📈' },
    { value: 'detailed', label: 'Detailed', icon: '📋' },
  ];

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 flex-1">
      {/* Report Type */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onReportTypeChange(type.value as any)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                reportType === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period */}
      <div className="md:w-48">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Period
        </label>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
