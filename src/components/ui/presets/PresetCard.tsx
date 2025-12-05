'use client';

import React from 'react';
import Button from '../Button';

export interface PresetCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  model: string;
  usageCount: number;
  isPublic: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  showActions?: boolean;
}

const PresetCard: React.FC<PresetCardProps> = ({
  id,
  name,
  description,
  category,
  model,
  usageCount,
  isPublic,
  onSelect,
  onEdit,
  onDelete,
  className = '',
  showActions = true,
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                {category}
              </span>
              {isPublic && (
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full">
                  Public
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            <span>{model}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>{usageCount} uses</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
          {onSelect && (
            <Button
              onClick={() => onSelect(id)}
              variant="primary"
              size="sm"
              aria-label={`Use ${name} preset`}
            >
              Use Preset
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={() => onEdit(id)}
              variant="outline"
              size="sm"
              aria-label={`Edit ${name} preset`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(id)}
              variant="ghost"
              size="sm"
              aria-label={`Delete ${name} preset`}
            >
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PresetCard;
