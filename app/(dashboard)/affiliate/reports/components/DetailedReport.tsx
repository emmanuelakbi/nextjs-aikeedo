/**
 * Detailed Report Component
 * Requirements: Affiliate 3, 4 - Generate detailed affiliate reports
 */

'use client';

import { useState } from 'react';

interface DetailedReportProps {
  data: any;
}

export default function DetailedReport({ data }: DetailedReportProps) {
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONVERTED' | 'CANCELED'>('all');

  if (!data || !data.referrals) return null;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONVERTED: 'bg-green-100 text-green-800',
    CANCELED: 'bg-red-100 text-red-800',
  };

  const filteredReferrals = filter === 'all' 
    ? data.referrals 
    : data.referrals.filter((r: any) => r.status === filter);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Detailed Report</h2>
        <p className="text-gray-600">
          Complete list of all referrals with detailed information
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-900">{data.referrals.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Converted</p>
          <p className="text-2xl font-bold text-green-600">
            {data.referrals.filter((r: any) => r.status === 'CONVERTED').length}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {data.referrals.filter((r: any) => r.status === 'PENDING').length}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Canceled</p>
          <p className="text-2xl font-bold text-red-600">
            {data.referrals.filter((r: any) => r.status === 'CANCELED').length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {['all', 'CONVERTED', 'PENDING', 'CANCELED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f === 'all' ? 'All' : f.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Referrals Table */}
      {filteredReferrals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No referrals found
          </h3>
          <p className="text-gray-600">
            No referrals match the selected filter
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Commission
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Value
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Converted
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.map((referral: any) => (
                <tr key={referral.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {formatDate(referral.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {referral.user.firstName} {referral.user.lastName}
                      </p>
                      <p className="text-xs text-gray-600">{referral.user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[referral.status as keyof typeof statusColors]
                      }`}
                    >
                      {referral.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(referral.commission || 0)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">
                    {formatCurrency(referral.conversionValue || 0)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {referral.convertedAt ? formatDate(referral.convertedAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
