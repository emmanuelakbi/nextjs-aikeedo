'use client';

import React, { useState } from 'react';
import Button from '../Button';

export interface GenerationResultProps {
  content: string;
  isLoading?: boolean;
  error?: string | null;
  onCopy?: () => void;
  onRetry?: () => void;
  className?: string;
  showActions?: boolean;
  metadata?: {
    model?: string;
    tokens?: number;
    credits?: number;
    duration?: number;
  };
}

const GenerationResult: React.FC<GenerationResultProps> = ({
  content,
  isLoading = false,
  error = null,
  onCopy,
  onRetry,
  className = '',
  showActions = true,
  metadata,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content || !onCopy) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="text-gray-600">Generating...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 rounded-lg border border-red-200 p-6 ${className}`}
        role="alert"
      >
        <div className="flex items-start space-x-3">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Generation Failed
            </h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div
        className={`bg-gray-50 rounded-lg border border-gray-200 p-6 ${className}`}
      >
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <p className="mt-2 text-sm">No content generated yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Content area */}
      <div className="p-6">
        <div
          className="prose prose-sm max-w-none whitespace-pre-wrap break-words text-gray-900"
          aria-label="Generated content"
        >
          {content}
        </div>
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            {metadata.model && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">Model:</span>
                <span>{metadata.model}</span>
              </div>
            )}
            {metadata.tokens !== undefined && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">Tokens:</span>
                <span>{metadata.tokens.toLocaleString()}</span>
              </div>
            )}
            {metadata.credits !== undefined && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">Credits:</span>
                <span>{metadata.credits.toLocaleString()}</span>
              </div>
            )}
            {metadata.duration !== undefined && (
              <div className="flex items-center space-x-1">
                <span className="font-medium">Duration:</span>
                <span>{metadata.duration.toFixed(2)}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-2">
            {onCopy && (
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!content}
                aria-label={copied ? 'Copied' : 'Copy to clipboard'}
              >
                {copied ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationResult;
