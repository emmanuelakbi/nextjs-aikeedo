/**
 * File Browser Client Component
 *
 * Client-side file browser with upload, delete, and filtering.
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4, 1.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import FileUploadModal from '@/components/ui/files/FileUploadModal';
import FileGrid from '@/components/ui/files/FileGrid';
import FileList from '@/components/ui/files/FileList';
import FileFilters from '@/components/ui/files/FileFilters';

export interface FileItem {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storageKey: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

type ViewMode = 'grid' | 'list';
type FileTypeFilter = 'all' | 'image' | 'audio' | 'document';

interface FileBrowserClientProps {
  workspaceId: string;
}

const FileBrowserClient: React.FC<FileBrowserClientProps> = ({
  workspaceId,
}) => {
  // State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [workspaceId]);

  // Apply filters when files, typeFilter, or searchQuery changes
  useEffect(() => {
    applyFilters();
  }, [files, typeFilter, searchQuery]);

  // Load files from API
  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/files?workspaceId=${workspaceId}`);

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      const filesData = data.data.files.map((file: any) => ({
        ...file,
        createdAt: new Date(file.createdAt),
      }));
      setFiles(filesData);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to files
  const applyFilters = () => {
    let filtered = [...files];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((file) => {
        if (typeFilter === 'image') {
          return file.type.startsWith('image/');
        } else if (typeFilter === 'audio') {
          return file.type.startsWith('audio/');
        } else if (typeFilter === 'document') {
          return (
            file.type.startsWith('application/') ||
            file.type.startsWith('text/')
          );
        }
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(query)
      );
    }

    setFilteredFiles(filtered);
  };

  // Handle file upload success
  const handleUploadSuccess = (uploadedFile: FileItem) => {
    setFiles([uploadedFile, ...files]);
    setShowUploadModal(false);
  };

  // Handle file delete
  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setFiles(files.filter((file) => file.id !== fileId));
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)
    ) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedFiles).map((fileId) =>
        fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      setFiles(files.filter((file) => !selectedFiles.has(file.id)));
      setSelectedFiles(new Set());
    } catch (err) {
      console.error('Error deleting files:', err);
      setError('Failed to delete some files');
    }
  };

  // Handle file download
  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  // Handle file selection
  const handleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((file) => file.id)));
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Files</h1>
              <p className="mt-2 text-gray-600">
                Browse and manage your uploaded files
              </p>
            </div>
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="primary"
              size="md"
              className="flex items-center space-x-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Upload Files</span>
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and View Controls */}
        <FileFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCount={selectedFiles.size}
          totalCount={filteredFiles.length}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
        />

        {/* File Content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                />
              </svg>
              <p className="text-gray-600 mb-4">
                {files.length === 0
                  ? 'No files uploaded yet'
                  : 'No files match your filters'}
              </p>
              {files.length === 0 && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  variant="primary"
                  size="md"
                >
                  Upload Your First File
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onSelectFile={handleSelectFile}
              onDelete={handleDelete}
              onDownload={handleDownload}
              formatFileSize={formatFileSize}
            />
          ) : (
            <FileList
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onSelectFile={handleSelectFile}
              onDelete={handleDelete}
              onDownload={handleDownload}
              formatFileSize={formatFileSize}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
};

export default FileBrowserClient;
