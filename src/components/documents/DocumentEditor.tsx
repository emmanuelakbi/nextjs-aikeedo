/**
 * Document Editor Component
 *
 * Rich text editor for creating and editing documents.
 * Requirements: Content Management 2.1, 2.2
 */

'use client';

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO';
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

  // Initialize form with document data
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setType(document.type);
      setLastSaved(document.updatedAt);
      setHasChanges(false);
    } else {
      setTitle('');
      setContent('');
      setType('TEXT');
      setLastSaved(null);
      setHasChanges(false);
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
      if (
        confirm('You have unsaved changes. Are you sure you want to close?')
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Cmd/Ctrl + S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;

    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) {
      return 'Saved just now';
    } else if (minutes < 60) {
      return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return `Saved at ${lastSaved.toLocaleTimeString()}`;
    }
  };

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
              disabled={!hasChanges}
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
            onClick={() => setType('TEXT')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              type === 'TEXT'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setType('IMAGE')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              type === 'IMAGE'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Image
          </button>
          <button
            onClick={() => setType('AUDIO')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              type === 'AUDIO'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Audio
          </button>
        </div>
      </div>

      {/* Content Editor */}
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your document..."
          className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm text-gray-900 placeholder-gray-400"
        />

        {/* Character Count */}
        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <span>{content.length.toLocaleString()} characters</span>
          {hasChanges && (
            <span className="text-amber-600">Unsaved changes</span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 font-medium mb-1">
            Keyboard Shortcuts
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              {' + '}
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded">
                S
              </kbd>
              {' - Save document'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
