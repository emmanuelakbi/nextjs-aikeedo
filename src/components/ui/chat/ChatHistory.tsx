'use client';

import React, { useEffect, useRef } from 'react';
import ChatMessage, { ChatMessageProps } from './ChatMessage';
import Spinner from '../Spinner';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatHistoryProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string;
  emptyStateMessage?: string;
  autoScroll?: boolean;
  className?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingMessageId,
  emptyStateMessage = 'No messages yet. Start a conversation!',
  autoScroll = true,
  className = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-full ${className}`}
        role="status"
      >
        <div className="text-center text-gray-500">
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
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          <p className="text-lg font-medium">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {/* Messages */}
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
          isStreaming={isStreaming && message.id === streamingMessageId}
        />
      ))}

      {/* Loading indicator */}
      {isLoading && !isStreaming && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 rounded-lg px-4 py-3">
            <Spinner size="sm" />
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
