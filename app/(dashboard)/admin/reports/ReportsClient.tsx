'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

/**
 * Reports Client Component
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 * - View revenue metrics
 * - Track user growth
 * - Monitor AI usage
 * - Generate financial reports
 * - Export data for analysis
 */

type ReportType =
  | 'revenue'
  | 'user-growth'
  | 'ai-usage'
  | 'financial'
  | 'subscription';

interface ReportSummary {
  [key: string]: any;
}

interface ReportData {
  summary: ReportSummary;
  [key: string]: any;
}

export function ReportsClient() {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate report'
      );
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}&format=csv`
      );

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${startDate}-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderSummary = () => {
    if (!reportData || !reportData.summary) return null;

    const { summary } = reportData;

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(summary).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return null;
            }

            const displayKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());

            let displayValue = value;
            if (
              key.toLowerCase().includes('revenue') ||
              key.toLowerCase().includes('amount')
            ) {
              displayValue = formatCurrency(value as number);
            } else if (key.toLowerCase().includes('rate')) {
              displayValue = `${(value as number).toFixed(2)}%`;
            } else if (typeof value === 'number') {
              displayValue = value.toLocaleString();
            }

            return (
              <div key={key} className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">{displayKey}</p>
                <p className="text-2xl font-bold mt-1">{displayValue}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailedData = () => {
    if (!reportData) return null;

    const sections = Object.keys(reportData).filter((key) => key !== 'summary');

    return sections.map((section) => {
      const items = reportData[section];
      if (!Array.isArray(items) || items.length === 0) return null;

      const displaySection = section
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());

      return (
        <div key={section} className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{displaySection}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(items[0]).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.slice(0, 50).map((item: any, index: number) => (
                  <tr key={index}>
                    {Object.entries(item).map(([key, value], cellIndex) => {
                      let displayValue = value;

                      if (value === null || value === undefined) {
                        displayValue = '-';
                      } else if (
                        key.toLowerCase().includes('date') ||
                        key.toLowerCase().includes('at')
                      ) {
                        displayValue = formatDate(value as string);
                      } else if (
                        key.toLowerCase().includes('amount') ||
                        key.toLowerCase().includes('price') ||
                        key.toLowerCase().includes('revenue')
                      ) {
                        displayValue = formatCurrency(value as number);
                      } else if (typeof value === 'number') {
                        displayValue = value.toLocaleString();
                      }

                      return (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {String(displayValue)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 50 && (
              <p className="text-sm text-gray-600 mt-4 text-center">
                Showing first 50 of {items.length} records. Export to CSV for
                full data.
              </p>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate detailed reports and export data for analysis
        </p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">Revenue Report</option>
              <option value="user-growth">User Growth Report</option>
              <option value="ai-usage">AI Usage Report</option>
              <option value="financial">Financial Report</option>
              <option value="subscription">Subscription Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={loading || !reportData}
              variant="secondary"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Report Results */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && reportData && (
        <>
          {renderSummary()}
          {renderDetailedData()}
        </>
      )}

      {!loading && !reportData && !error && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No report generated
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a report type and date range to generate a report
          </p>
        </div>
      )}
    </div>
  );
}
