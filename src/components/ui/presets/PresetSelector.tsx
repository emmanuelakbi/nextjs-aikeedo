'use client';

import React, { useState, useMemo } from 'react';
import Button from '../Button';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  model: string;
  template: string;
  parameters: Record<string, unknown>;
  isPublic: boolean;
  usageCount: number;
}

export interface PresetSelectorProps {
  presets: Preset[];
  selectedPresetId?: string | null;
  onSelect: (preset: Preset) => void;
  onClear?: () => void;
  className?: string;
  placeholder?: string;
  showSearch?: boolean;
  filterByCategory?: string;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  selectedPresetId = null,
  onSelect,
  onClear,
  className = '',
  placeholder = 'Select a preset...',
  showSearch = true,
  filterByCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPreset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId),
    [presets, selectedPresetId]
  );

  const filteredPresets = useMemo(() => {
    let filtered = presets;

    // Filter by category if specified
    if (filterByCategory) {
      filtered = filtered.filter((p) => p.category === filterByCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [presets, searchQuery, filterByCategory]);

  const handleSelect = (preset: Preset) => {
    onSelect(preset);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-2 text-left bg-white border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedPreset ? (
              <div>
                <div className="font-medium text-gray-900 truncate">
                  {selectedPreset.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {selectedPreset.category}
                </div>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown content */}
          <div
            className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden"
            role="listbox"
          >
            {/* Search */}
            {showSearch && (
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search presets..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Preset list */}
            <div className="overflow-y-auto max-h-80">
              {filteredPresets.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">No presets found</p>
                </div>
              ) : (
                filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelect(preset)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50
                      transition-colors duration-150
                      ${
                        preset.id === selectedPresetId
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'border-l-4 border-transparent'
                      }
                    `}
                    role="option"
                    aria-selected={preset.id === selectedPresetId}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {preset.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {preset.description}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {preset.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {preset.usageCount} uses
                          </span>
                        </div>
                      </div>
                      {preset.id === selectedPresetId && (
                        <svg
                          className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Clear button */}
            {selectedPreset && onClear && (
              <div className="p-3 border-t border-gray-200">
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                  fullWidth
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PresetSelector;
