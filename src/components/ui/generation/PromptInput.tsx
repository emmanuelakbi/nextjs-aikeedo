'use client';

import React, { useState, useRef, KeyboardEvent, FormEvent } from 'react';
import Button from '../Button';

export interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = 'Enter your prompt...',
  maxLength = 4000,
  className = '',
  showSubmitButton = true,
  submitButtonText = 'Generate',
  value: controlledValue,
  onChange: controlledOnChange,
}) => {
  const [internalPrompt, setInternalPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use controlled value if provided, otherwise use internal state
  const prompt =
    controlledValue !== undefined ? controlledValue : internalPrompt;
  const setPrompt = controlledOnChange || setInternalPrompt;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitPrompt();
  };

  const submitPrompt = () => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt && !disabled) {
      onSubmit(trimmedPrompt);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitPrompt();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const characterCount = prompt.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      <div className="flex flex-col space-y-3">
        {/* Character counter */}
        {isNearLimit && (
          <div
            className={`text-xs text-right ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}
            role="status"
            aria-live="polite"
          >
            {characterCount} / {maxLength}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={4}
          className={`
            w-full px-4 py-3 border border-gray-300 rounded-lg
            resize-none overflow-hidden
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors duration-200
            min-h-[120px] max-h-[400px]
          `}
          aria-label="Prompt input"
          aria-describedby="prompt-input-hint"
        />

        {/* Actions row */}
        <div className="flex items-center justify-between">
          {/* Helper text */}
          <p id="prompt-input-hint" className="text-xs text-gray-500">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
              Ctrl + Enter
            </kbd>{' '}
            to submit
          </p>

          {/* Submit button */}
          {showSubmitButton && (
            <Button
              type="submit"
              disabled={disabled || !prompt.trim() || isOverLimit}
              variant="primary"
              size="md"
              loading={disabled}
              aria-label="Submit prompt"
            >
              {submitButtonText}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default PromptInput;
