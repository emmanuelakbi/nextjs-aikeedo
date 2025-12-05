/**
 * Export Button Component
 * Requirements: Affiliate 3 - Generate payout reports
 */

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface ExportButtonProps {
  reportData: any;
  reportType: string;
  period: string;
}

export default function ExportButton({ reportData, reportType, period }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    if (!reportData) return;

    setExporting(true);

    try {
      let csvContent = '';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `affiliate-report-${reportType}-${period}-${timestamp}.csv`;

      // Generate CSV based on report type
      if (reportType === 'summary') {
        csvContent = generateSummaryCSV(reportData);
      } else if (reportType === 'earnings') {
        csvContent = generateEarningsCSV(reportData);
      } else if (reportType === 'conversions') {
        csvContent = generateConversionsCSV(reportData);
      } else if (reportType === 'detailed') {
        csvContent = generateDetailedCSV(reportData);
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const generateSummaryCSV = (data: any) => {
    return `Affiliate Summary Report
Period,${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}

Metric,Value
Total Referrals,${data.totalReferrals}
Converted Referrals,${data.convertedReferrals}
Conversion Rate,${data.conversionRate}%
Total Commission,$${data.totalCommissionFormatted}
Total Payouts,$${data.totalPayoutsFormatted}
Pending Earnings,$${data.pendingEarningsFormatted}`;
  };

  const generateEarningsCSV = (data: any) => {
    let csv = `Affiliate Earnings Report
Period,${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}

Month,Amount
`;
    
    data.earningsByMonth.forEach((month: any) => {
      csv += `${month.month},$${month.amountFormatted}\n`;
    });
    
    csv += `\nTotal,$${(data.totalEarnings / 100).toFixed(2)}`;
    
    return csv;
  };

  const generateConversionsCSV = (data: any) => {
    let csv = `Affiliate Conversions Report
Period,${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}

Status,Count
Converted,${data.byStatus.converted}
Pending,${data.byStatus.pending}
Canceled,${data.byStatus.canceled}

Conversion Rate,${data.conversionRate}%

Week,Conversions
`;
    
    data.conversionsByWeek.forEach((week: any) => {
      csv += `${week.week},${week.count}\n`;
    });
    
    return csv;
  };

  const generateDetailedCSV = (data: any) => {
    let csv = `Affiliate Detailed Report
Period,${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}

Date,User Name,Email,Status,Commission,Conversion Value,Converted At
`;
    
    data.referrals.forEach((ref: any) => {
      const userName = `${ref.user.firstName} ${ref.user.lastName}`;
      const convertedAt = ref.convertedAt ? new Date(ref.convertedAt).toLocaleDateString() : '-';
      csv += `${new Date(ref.createdAt).toLocaleDateString()},${userName},${ref.user.email},${ref.status},$${ref.commissionFormatted},$${ref.conversionValueFormatted},${convertedAt}\n`;
    });
    
    return csv;
  };

  return (
    <Button
      variant="outline"
      onClick={exportToCSV}
      loading={exporting}
      disabled={!reportData}
    >
      📥 Export CSV
    </Button>
  );
}
