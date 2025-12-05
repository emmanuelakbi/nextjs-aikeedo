'use client';

import { ReactNode } from 'react';

/**
 * Stat Card Component
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 *
 * Displays a metric card with icon, value, and optional trend.
 */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className={`text-sm mt-2 ${trend?.isPositive ? 'text-green-600' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`${iconBgColor} rounded-full p-3`}>
            <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
