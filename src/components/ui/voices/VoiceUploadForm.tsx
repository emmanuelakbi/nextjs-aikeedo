/**
 * Voice Upload Form Component
 *
 * Form for uploading voice samples and creating new voices.
 * Requirements: Content Management 4.1, 4.2
 */

'use client';

import React, { useState, useRef } from 'react';
import Input from '../Input';
import Button from '../Button';
import Label from '../Label';
import ErrorMessage from '../ErrorMessage';

interface VoiceUploadFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    sampleFileId: string;
  }) => Promise<void>;
  onCancel: () => void;
  onFileUpload: (file: File) => Promise<string>;
}

const VoiceUploadForm: React.FC<VoiceUploadFormProps> = ({
  onSubmit,
  onCancel,
  onFileUpload,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Upload file immediately
    try {
      setIsUploading(true);
      const fileId = await onFileUpload(selectedFile);
      setUploadedFileId(fileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!name.trim()) {
      setError('Voice name is required');
      return;
    }

    if (!description.trim()) {
      setError('Voice description is required');
      return;
    }

    if (!uploadedFileId) {
      setError('Please upload a voice sample');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        sampleFileId: uploadedFileId,
      });

      // Reset form
      setName('');
      setDescription('');
      setFile(null);
      setUploadedFileId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create voice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadedFileId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="voice-name">Voice Name</Label>
        <Input
          id="voice-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Professional Male Voice"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <Label htmlFor="voice-description">Description</Label>
        <textarea
          id="voice-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the voice characteristics..."
          disabled={isSubmitting}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400"
        />
      </div>

      <div>
        <Label htmlFor="voice-sample">Voice Sample (Audio File)</Label>
        <div className="mt-1">
          {!file ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="voice-sample"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-1 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Audio files (MP3, WAV, etc.) up to 10MB
                  </p>
                </div>
                <input
                  id="voice-sample"
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={isSubmitting || isUploading}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center gap-2">
                {isUploading ? (
                  <svg
                    className="w-5 h-5 text-blue-600 animate-spin"
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
                ) : uploadedFileId ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {isUploading && ' - Uploading...'}
                    {uploadedFileId && ' - Uploaded'}
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isSubmitting}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Upload a clear audio sample (at least 30 seconds recommended) for best
          results
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || isUploading || !uploadedFileId}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-4 h-4 mr-2 animate-spin"
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
              Creating Voice...
            </>
          ) : (
            'Create Voice'
          )}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default VoiceUploadForm;
