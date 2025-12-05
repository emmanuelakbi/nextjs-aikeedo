/**
 * Document List Component
 *
 * Displays a list of documents with search and filter capabilities.
 * Requirements: Content Management 2.2, 2.3
 */

'use client';

import React, { useState } from 'react';
import Input from '../ui/Input';

export interface Document {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO';
  fileId: string | null;
  generationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentListProps {
  documents: Document[];
  selectedDocumentId: string | null;
  onSelectDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'ALL';
  onFilterChange: (type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'ALL') => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onDeleteDocument,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setDeletingId(documentId);
      await onDeleteDocument(documentId);
    } catch (err) {
      alert('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TEXT':
        return (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'IMAGE':
        return (
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'AUDIO':
        return (
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
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
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
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange('ALL')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterType === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('TEXT')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterType === 'TEXT'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => onFilterChange('IMAGE')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterType === 'IMAGE'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Image
          </button>
          <button
            onClick={() => onFilterChange('AUDIO')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              filterType === 'AUDIO'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Audio
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No documents found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((document) => (
              <button
                key={document.id}
                onClick={() => onSelectDocument(document)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedDocumentId === document.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500">
                        {getTypeIcon(document.type)}
                      </span>
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {document.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {document.content.substring(0, 100)}
                      {document.content.length > 100 ? '...' : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(document.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, document.id)}
                    disabled={deletingId === document.id}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete document"
                  >
                    {deletingId === document.id ? (
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

export default DocumentList;
