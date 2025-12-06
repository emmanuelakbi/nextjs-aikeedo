'use client';

import React, { useState, useRef, KeyboardEvent, FormEvent } from 'react';
import Button from '../Button';

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <form
      onSubmit={handleSubmit}
      className={`border-t border-gray-200 bg-white p-4 ${className}`}
    >
      <div className="flex flex-col space-y-2">
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

        {/* Input area */}
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              rows={1}
              className={`
                w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg
                bg-white text-gray-900 placeholder-gray-400
                resize-none overflow-hidden
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors duration-200
                max-h-32
              `}
              aria-label="Message input"
              aria-describedby="chat-input-hint"
            />

            {/* Hint text */}
            <div
              id="chat-input-hint"
              className="absolute right-3 bottom-3 text-xs text-gray-400 pointer-events-none"
            >
              {disabled ? 'Sending...' : 'Enter to send'}
            </div>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={disabled || !message.trim() || isOverLimit}
            variant="primary"
            size="md"
            className="px-6"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500">
          Press{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
            Enter
          </kbd>{' '}
          to send,
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs ml-1">
            Shift + Enter
          </kbd>{' '}
          for new line
        </p>
      </div>
    </form>
  );
};

export default ChatInput;
