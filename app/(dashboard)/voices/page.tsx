/**
 * Voice Management Page
 *
 * Main page for managing voice cloning and voice library.
 * Requirements: Content Management 4.1, 4.2, 4.3, 4.4, 4.5
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VoiceList, VoiceUploadForm, VoiceCard } from '@/components/ui/voices';
import type { Voice } from '@/components/ui/voices';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'TRAINING' | 'READY' | 'FAILED' | 'ALL'
  >('ALL');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch voices
  const fetchVoices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/voices', {
        headers: {
          'x-workspace-id': localStorage.getItem('currentWorkspaceId') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      const voiceData = data.data.voices.map((v: any) => ({
        ...v,
        createdAt: new Date(v.createdAt),
      }));

      setVoices(voiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  // Filter voices based on search and status
  useEffect(() => {
    let filtered = voices;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (voice) =>
          voice.name.toLowerCase().includes(query) ||
          voice.description.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((voice) => voice.status === filterStatus);
    }

    setFilteredVoices(filtered);
  }, [voices, searchQuery, filterStatus]);

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<string> => {
    // Get presigned URL
    const presignedResponse = await fetch('/api/files/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': localStorage.getItem('currentWorkspaceId') || '',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    if (!presignedResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { data: presignedData } = await presignedResponse.json();

    // Upload file to storage
    const uploadResponse = await fetch(presignedData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Create file record
    const fileResponse = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': localStorage.getItem('currentWorkspaceId') || '',
      },
      body: JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        storageKey: presignedData.storageKey,
        url: presignedData.fileUrl,
      }),
    });

    if (!fileResponse.ok) {
      throw new Error('Failed to create file record');
    }

    const { data: fileData } = await fileResponse.json();
    return fileData.id;
  };

  // Handle voice creation
  const handleCreateVoice = async (data: {
    name: string;
    description: string;
    sampleFileId: string;
  }) => {
    const response = await fetch('/api/voices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': localStorage.getItem('currentWorkspaceId') || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create voice');
    }

    // Refresh voices list
    await fetchVoices();
    setShowUploadForm(false);
  };

  // Handle voice deletion
  const handleDeleteVoice = async (voiceId: string) => {
    const response = await fetch(`/api/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'x-workspace-id': localStorage.getItem('currentWorkspaceId') || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete voice');
    }

    // Update local state
    setVoices((prev) => prev.filter((v) => v.id !== voiceId));
    if (selectedVoice?.id === voiceId) {
      setSelectedVoice(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice Library</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your custom voice clones for speech synthesis
            </p>
          </div>
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Voice
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Voice
          </h2>
          <VoiceUploadForm
            onSubmit={handleCreateVoice}
            onCancel={() => setShowUploadForm(false)}
            onFileUpload={handleFileUpload}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Voice List Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden">
          <VoiceList
            voices={filteredVoices}
            selectedVoiceId={selectedVoice?.id || null}
            onSelectVoice={setSelectedVoice}
            onDeleteVoice={handleDeleteVoice}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
          />
        </div>

        {/* Voice Details */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {selectedVoice ? (
            <VoiceCard
              voice={{
                ...selectedVoice,
                sampleFileId: selectedVoice.id,
                modelId: null,
              }}
              onDelete={handleDeleteVoice}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg
                className="w-16 h-16 mb-4 text-gray-400"
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
              <p className="text-lg font-medium">No voice selected</p>
              <p className="text-sm mt-1">
                Select a voice from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
