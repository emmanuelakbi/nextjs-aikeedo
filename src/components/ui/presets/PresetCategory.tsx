'use client';

import React from 'react';

export interface PresetCategoryProps {
  category: string;
  count: number;
  isActive?: boolean;
  onClick?: (category: string) => void;
  className?: string;
  icon?: React.ReactNode;
}

const PresetCategory: React.FC<PresetCategoryProps> = ({
  category,
  count,
  isActive = false,
  onClick,
  className = '',
  icon,
}) => {
  const defaultIcon = (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={() => onClick?.(category)}
      className={`
        flex items-center justify-between w-full px-4 py-3 rounded-lg
        transition-all duration-200
        ${
          isActive
            ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        }
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
      aria-pressed={isActive}
      disabled={!onClick}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div
          className={`
          flex-shrink-0
          ${isActive ? 'text-blue-600' : 'text-gray-400'}
        `}
        >
          {icon ?? defaultIcon}
        </div>
        <span
          className={`
          font-medium truncate
          ${isActive ? 'text-blue-900' : 'text-gray-900'}
        `}
        >
          {category}
        </span>
      </div>
      <span
        className={`
        flex-shrink-0 ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium
        ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
      `}
      >
        {count}
      </span>
    </button>
  );
};

export default PresetCategory;
