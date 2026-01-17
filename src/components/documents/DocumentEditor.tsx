/**
 * Document Editor Component
 *
 * Rich editor for creating and editing documents with support for:
 * - TEXT: Rich text editor
 * - IMAGE: Image upload and preview
 * - AUDIO: Audio upload and player
 * 
 * Requirements: Content Management 2.1, 2.2
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO';
  fileId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentEditorProps {
  document: Document | null;
  onSave: (document: Partial<Document>) => Promise<void>;
  onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'TEXT' | 'IMAGE' | 'AUDIO'>('TEXT');
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize form with document data
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setType(document.type);
      setLastSaved(document.updatedAt);
      setHasChanges(false);
      
      // Set preview URL for image/audio content
      if (document.type === 'IMAGE' && document.content) {
        // Content could be a URL or base64
        setPreviewUrl(document.content);
      } else if (document.type === 'AUDIO' && document.content) {
        setPreviewUrl(document.content);
      }
    } else {
      setTitle('');
      setContent('');
      setType('TEXT');
      setLastSaved(null);
      setHasChanges(false);
      setPreviewUrl(null);
    }
  }, [document]);

  // Track changes
  useEffect(() => {
    if (document) {
      const changed =
        title !== document.title ||
        content !== document.content ||
        type !== document.type;
      setHasChanges(changed);
    } else {
      setHasChanges(title.length > 0 || content.length > 0);
    }
  }, [title, content, type, document]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await onSave({
        title: title || 'Untitled Document',
        content,
        type,
      });

      setHasChanges(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleTypeChange = (newType: 'TEXT' | 'IMAGE' | 'AUDIO') => {
    if (newType !== type) {
      // Clear content when switching types
      if (content && !confirm('Switching type will clear current content. Continue?')) {
        return;
      }
      setType(newType);
      setContent('');
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === 'IMAGE' && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (type === 'AUDIO' && !file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      reader.onload = () => {
        const base64 = reader.result as string;
        setContent(base64);
        setHasChanges(true);
        setUploadProgress(100);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setContent('');
    setPreviewUrl(null);
    setHasChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return 'Saved just now';
    if (minutes < 60) return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  };

  const renderTextEditor = () => (
    <div className="p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your document..."
        className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm text-gray-900 placeholder-gray-400"
      />
      <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
        <span>{content.length.toLocaleString()} characters</span>
        {hasChanges && <span className="text-amber-600">Unsaved changes</span>}
      </div>
    </div>
  );

  const renderImageEditor = () => (
    <div className="p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Document preview"
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
          />
          <button
            onClick={clearFile}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Remove image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="mt-4 text-center">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
              Replace Image
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-2">Drop an image here or click to upload</p>
          <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-1 text-center">{uploadProgress}% uploaded</p>
        </div>
      )}

      {hasChanges && <p className="mt-4 text-sm text-amber-600 text-center">Unsaved changes</p>}
    </div>
  );

  const renderAudioEditor = () => (
    <div className="p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white">
                <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
              </svg>
            </div>
          </div>
          
          <audio
            ref={audioRef}
            src={previewUrl}
            controls
            className="w-full"
          />
          
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
              Replace Audio
            </Button>
            <Button onClick={clearFile} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-2">Drop an audio file here or click to upload</p>
          <p className="text-sm text-gray-500">MP3, WAV, OGG up to 10MB</p>
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-1 text-center">{uploadProgress}% uploaded</p>
        </div>
      )}

      {hasChanges && <p className="mt-4 text-sm text-amber-600 text-center">Unsaved changes</p>}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {document ? 'Edit Document' : 'New Document'}
          </h2>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-sm text-gray-500">{formatLastSaved()}</span>
            )}
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              loading={isSaving}
              disabled={!hasChanges || isUploading}
            >
              Save
            </Button>
            <Button onClick={handleClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>

        {/* Title Input */}
        <Input
          type="text"
          placeholder="Document title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-medium"
        />

        {/* Type Selector */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handleTypeChange('TEXT')}
            className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
              type === 'TEXT'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
            </svg>
            Text
          </button>
          <button
            onClick={() => handleTypeChange('IMAGE')}
            className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
              type === 'IMAGE'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            Image
          </button>
          <button
            onClick={() => handleTypeChange('AUDIO')}
            className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
              type === 'AUDIO'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 010 7.778.75.75 0 001.06 1.06 7 7 0 000-9.899z" />
              <path d="M13.829 7.172a.75.75 0 00-1.061 1.06 2.5 2.5 0 010 3.536.75.75 0 001.06 1.06 4 4 0 000-5.656z" />
            </svg>
            Audio
          </button>
        </div>
      </div>

      {/* Content Editor - renders based on type */}
      {type === 'TEXT' && renderTextEditor()}
      {type === 'IMAGE' && renderImageEditor()}
      {type === 'AUDIO' && renderAudioEditor()}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Keyboard Shortcuts - only for text */}
      {type === 'TEXT' && (
        <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 font-medium mb-1">Keyboard Shortcuts</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">
                {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              {' + '}
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">S</kbd>
              {' - Save document'}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
