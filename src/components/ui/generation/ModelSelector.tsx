'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Button from '../Button';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  pricing?: {
    input: number;
    output: number;
  };
  available: boolean;
  deprecated?: boolean;
  replacementModel?: string;
}

export interface ModelSelectorProps {
  models: AIModel[];
  selectedModelId?: string | null;
  onSelect: (model: AIModel) => void;
  className?: string;
  placeholder?: string;
  showSearch?: boolean;
  filterByCapability?: string;
  filterByProvider?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId = null,
  onSelect,
  className = '',
  placeholder = 'Select a model...',
  showSearch = true,
  filterByCapability,
  filterByProvider,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  const filteredModels = useMemo(() => {
    let filtered = models;

    // Filter by capability if specified
    if (filterByCapability) {
      filtered = filtered.filter((m) =>
        m.capabilities.includes(filterByCapability)
      );
    }

    // Filter by provider if specified
    if (filterByProvider) {
      filtered = filtered.filter((m) => m.provider === filterByProvider);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.provider.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
    }

    // Sort: available first, then by provider and name
    return filtered.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });
  }, [models, searchQuery, filterByCapability, filterByProvider]);

  const handleSelect = (model: AIModel) => {
    if (model.available && !model.deprecated) {
      onSelect(model);
      setIsOpen(false);
      setSearchQuery('');
    }
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
            {selectedModel ? (
              <div>
                <div className="font-medium text-gray-900 truncate">
                  {selectedModel.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {selectedModel.provider}
                  {selectedModel.contextWindow && (
                    <span className="ml-2">
                      • {selectedModel.contextWindow.toLocaleString()} tokens
                    </span>
                  )}
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
                  placeholder="Search models..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Model list */}
            <div className="overflow-y-auto max-h-80">
              {filteredModels.length === 0 ? (
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
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                  <p className="text-sm">No models found</p>
                </div>
              ) : (
                filteredModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelect(model)}
                    disabled={!model.available || model.deprecated}
                    className={`
                      w-full px-4 py-3 text-left transition-colors duration-150
                      ${
                        model.id === selectedModelId
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'border-l-4 border-transparent'
                      }
                      ${
                        model.available && !model.deprecated
                          ? 'hover:bg-gray-50 cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }
                    `}
                    role="option"
                    aria-selected={model.id === selectedModelId}
                    aria-disabled={!model.available || model.deprecated}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 truncate">
                            {model.name}
                          </span>
                          {!model.available && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                              Unavailable
                            </span>
                          )}
                          {model.deprecated && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded">
                              Deprecated
                            </span>
                          )}
                        </div>
                        {model.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {model.description}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {model.provider}
                          </span>
                          {model.contextWindow && (
                            <span className="text-xs text-gray-400">
                              {model.contextWindow.toLocaleString()} tokens
                            </span>
                          )}
                          {model.pricing && (
                            <span className="text-xs text-gray-400">
                              ${model.pricing.input.toFixed(4)}/ $
                              {model.pricing.output.toFixed(4)}
                            </span>
                          )}
                        </div>
                        {model.deprecated && model.replacementModel && (
                          <div className="text-xs text-yellow-600 mt-1">
                            Use {model.replacementModel} instead
                          </div>
                        )}
                      </div>
                      {model.id === selectedModelId && (
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
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSelector;
