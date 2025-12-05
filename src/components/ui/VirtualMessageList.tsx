/**
 * Virtual Message List Component
 *
 * Implements virtual scrolling for message lists to handle large
 * conversation histories efficiently.
 *
 * Task: 36.4 - Implement virtual scrolling for messages
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface VirtualMessageListProps {
  messages: Message[];
  itemHeight?: number;
  overscan?: number;
  className?: string;
  renderMessage: (message: Message, index: number) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

/**
 * Virtual Message List
 *
 * Renders only visible messages in the viewport for optimal performance
 * with large message lists.
 */
export function VirtualMessageList({
  messages,
  itemHeight = 100,
  overscan = 3,
  className = '',
  renderMessage,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: VirtualMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    messages.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleMessages = messages.slice(startIndex, endIndex);
  const totalHeight = messages.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  /**
   * Handle scroll events
   */
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setScrollTop(scrollTop);

    // Load more when scrolling near the top (for chat history)
    if (scrollTop < 200 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  /**
   * Update container height on resize
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Attach scroll listener
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    // Only auto-scroll if user is near the bottom
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%', position: 'relative' }}
    >
      {/* Spacer for total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible messages container */}
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {isLoading && startIndex === 0 && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
            </div>
          )}

          {visibleMessages.map((message, index) => (
            <div
              key={message.id}
              style={{ minHeight: itemHeight }}
              data-index={startIndex + index}
            >
              {renderMessage(message, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple Message List (fallback without virtualization)
 *
 * Use this for small message lists where virtualization overhead
 * isn't worth it (< 50 messages).
 */
export function SimpleMessageList({
  messages,
  className = '',
  renderMessage,
}: {
  messages: Message[];
  className?: string;
  renderMessage: (message: Message, index: number) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      {messages.map((message, index) => (
        <div key={message.id}>{renderMessage(message, index)}</div>
      ))}
    </div>
  );
}

/**
 * Hook to determine if virtualization should be used
 *
 * @param messageCount - Number of messages
 * @param threshold - Threshold for enabling virtualization
 * @returns True if virtualization should be used
 */
export function useVirtualization(
  messageCount: number,
  threshold: number = 50
): boolean {
  return messageCount > threshold;
}
