'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Filter Bar Component
 *
 * Requirements: Admin Dashboard - All list views
 *
 * Reusable filter bar for tables and lists.
 */

interface FilterBarProps {
  children: ReactNode;
  onApply?: () => void;
  onClear?: () => void;
  showActions?: boolean;
}

export function FilterBar({
  children,
  onApply,
  onClear,
  showActions = true,
}: FilterBarProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      <div className="space-y-4">
        {children}
        {showActions && (onApply || onClear) && (
          <div className="flex gap-2 pt-2">
            {onApply && (
              <Button onClick={onApply} variant="primary">
                Apply Filters
              </Button>
            )}
            {onClear && (
              <Button onClick={onClear} variant="secondary">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Filter Input Component
 */

interface FilterInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'number' | 'date';
}

export function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: FilterInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/**
 * Filter Select Component
 */

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
}: FilterSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Filter Grid Component
 *
 * A grid layout for filter inputs.
 */

interface FilterGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function FilterGrid({ children, columns = 4 }: FilterGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return <div className={`grid ${gridCols[columns]} gap-4`}>{children}</div>;
}
