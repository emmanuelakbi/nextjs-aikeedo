/**
 * Affiliate Reports Component
 * Requirements: Affiliate 3, 4 - Generate and view affiliate reports
 */

'use client';

import { useState, useEffect } from 'react';
import ReportFilters from './components/ReportFilters';
import SummaryReport from './components/SummaryReport';
import EarningsReport from './components/EarningsReport';
import ConversionsReport from './components/ConversionsReport';
import DetailedReport from './components/DetailedReport';
import ExportButton from './components/ExportButton';

interface AffiliateReportsProps {
  userId: string;
}

export default function AffiliateReports({ userId: _userId }: AffiliateReportsProps) {
  const [reportType, setReportType] = useState<'summary' | 'earnings' | 'conversions' | 'detailed'>('summary');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportType, period]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/affiliate/reports?type=${reportType}&period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const result = await response.json();
      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <ReportFilters
            reportType={reportType}
            period={period}
            onReportTypeChange={setReportType}
            onPeriodChange={setPeriod}
          />
          <ExportButton reportData={reportData} reportType={reportType} period={period} />
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating report...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <>
          {reportType === 'summary' && <SummaryReport data={reportData} />}
          {reportType === 'earnings' && <EarningsReport data={reportData} />}
          {reportType === 'conversions' && <ConversionsReport data={reportData} />}
          {reportType === 'detailed' && <DetailedReport data={reportData} />}
        </>
      )}
    </div>
  );
}
