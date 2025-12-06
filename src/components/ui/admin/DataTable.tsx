'use client';

import { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

/**
 * Data Table Component
 *
 * Requirements: Admin Dashboard - All list views
 *
 * Reusable data table with loading, empty states, and pagination.
 */

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    icon?: ReactNode;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  getRowKey: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyState,
  pagination,
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <LoadingSpinner />
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className="bg-white rounded-lg shadow">
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          icon={emptyState.icon}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={getRowKey(item)}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 ${column.className || ''}`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

/**
 * Table Cell Components
 *
 * Common cell renderers for tables.
 */

export const TableCell = {
  Text: ({
    children,
    className = '',
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={`text-sm text-gray-900 ${className}`}>{children}</div>,

  SubText: ({
    children,
    className = '',
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={`text-sm text-gray-500 ${className}`}>{children}</div>,

  TwoLine: ({
    primary,
    secondary,
  }: {
    primary: ReactNode;
    secondary: ReactNode;
  }) => (
    <div>
      <div className="text-sm font-medium text-gray-900">{primary}</div>
      <div className="text-sm text-gray-500">{secondary}</div>
    </div>
  ),

  Actions: ({ children }: { children: ReactNode }) => (
    <div className="flex justify-end gap-2 text-sm font-medium">{children}</div>
  ),

  ActionLink: ({
    href,
    onClick,
    children,
    variant = 'primary',
  }: {
    href?: string;
    onClick?: () => void;
    children: ReactNode;
    variant?: 'primary' | 'danger' | 'warning' | 'success';
  }) => {
    const colors = {
      primary: 'text-blue-600 hover:text-blue-900',
      danger: 'text-red-600 hover:text-red-900',
      warning: 'text-orange-600 hover:text-orange-900',
      success: 'text-green-600 hover:text-green-900',
    };

    if (href) {
      return (
        <a href={href} className={colors[variant]}>
          {children}
        </a>
      );
    }

    return (
      <button onClick={onClick} className={colors[variant]}>
        {children}
      </button>
    );
  },
};
