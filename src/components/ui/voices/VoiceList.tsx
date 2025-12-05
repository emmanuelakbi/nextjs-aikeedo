/**
 * Voice List Component
 *
 * Displays a list of voices with status indicators and management actions.
 * Requirements: Content Management 4.3
 */

'use client';

import React, { useState } from 'react';
import Input from '../Input';

export interface Voice {
  id: string;
  name: string;
  description: string;
  status: 'TRAINING' | 'READY' | 'FAILED';
  createdAt: Date;
}

interface VoiceListProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  onSelectVoice: (voice: Voice) => void;
  onDeleteVoice: (voiceId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: 'TRAINING' | 'READY' | 'FAILED' | 'ALL';
  onFilterChange: (status: 'TRAINING' | 'READY' | 'FAILED' | 'ALL') => void;
}

const VoiceList: React.FC<VoiceListProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onDeleteVoice,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this voice?')) {
      return;
    }

    try {
      setDeletingId(voiceId);
      await onDeleteVoice(voiceId);
    } catch (err) {
      alert('Failed to delete voice');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Ready
          </span>
        );
      case 'TRAINING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg
              className="w-3 h-3 mr-1 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Training
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200">
        <Input
          type="text"
          placeholder="Search voices..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange('ALL')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('READY')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterStatus === 'READY'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ready
          </button>
          <button
            onClick={() => onFilterChange('TRAINING')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterStatus === 'TRAINING'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Training
          </button>
          <button
            onClick={() => onFilterChange('FAILED')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterStatus === 'FAILED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Voice List */}
      <div className="flex-1 overflow-y-auto">
        {voices.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <p>No voices found</p>
            <p className="text-sm mt-1">Upload a voice sample to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => onSelectVoice(voice)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedVoiceId === voice.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {voice.name}
                      </h3>
                      {getStatusBadge(voice.status)}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {voice.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(voice.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, voice.id)}
                    disabled={deletingId === voice.id}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete voice"
                  >
                    {deletingId === voice.id ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceList;
