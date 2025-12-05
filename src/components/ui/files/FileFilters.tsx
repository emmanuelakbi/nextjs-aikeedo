/**
 * File Filters Component
 *
 * Provides filtering and view controls for the file browser.
 * Requirements: Content Management 1.1
 */

'use client';

import React from 'react';
import Button from '../Button';

type ViewMode = 'grid' | 'list';
type FileTypeFilter = 'all' | 'image' | 'audio' | 'document';

interface FileFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: FileTypeFilter;
  onTypeFilterChange: (filter: FileTypeFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onBulkDelete: () => void;
}

const FileFilters: React.FC<FileFiltersProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onBulkDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Left Section: Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                typeFilter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onTypeFilterChange('image')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                typeFilter === 'image'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => onTypeFilterChange('audio')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                typeFilter === 'audio'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Audio
            </button>
            <button
              onClick={() => onTypeFilterChange('document')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                typeFilter === 'document'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Documents
            </button>
          </div>
        </div>

        {/* Right Section: View Controls and Actions */}
        <div className="flex items-center space-x-3">
          {/* Selection Info and Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedCount} selected
              </span>
              <Button
                onClick={onBulkDelete}
                variant="secondary"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          )}

          {/* Select All */}
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedCount === totalCount && totalCount > 0
              ? 'Deselect All'
              : 'Select All'}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Grid view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="List view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileFilters;
