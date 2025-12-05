/**
 * Lazy Loading Hook for Conversations
 *
 * Implements infinite scroll and lazy loading for conversation lists
 * to improve performance with large datasets.
 *
 * Task: 36.3 - Add lazy loading for conversations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface Conversation {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  model: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseLazyLoadConversationsOptions {
  workspaceId?: string;
  userId?: string;
  pageSize?: number;
  enabled?: boolean;
}

export interface UseLazyLoadConversationsResult {
  conversations: Conversation[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  total: number;
}

/**
 * Hook for lazy loading conversations with infinite scroll support
 *
 * @param options - Configuration options
 * @returns Lazy load state and controls
 */
export function useConversationsLazyLoad(
  options: UseLazyLoadConversationsOptions = {}
): UseLazyLoadConversationsResult {
  const { workspaceId, userId, pageSize = 20, enabled = true } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  // Track if we're currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);

  /**
   * Fetch conversations from API
   */
  const fetchConversations = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      if (!enabled || isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        // Build query parameters
        const params = new URLSearchParams({
          limit: pageSize.toString(),
          offset: currentOffset.toString(),
        });

        if (workspaceId) {
          params.append('workspaceId', workspaceId);
        }

        if (userId) {
          params.append('userId', userId);
        }

        // Fetch conversations
        const response = await fetch(`/api/conversations?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error?.message || 'Failed to fetch conversations'
          );
        }

        const fetchedConversations = data.data.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));

        // Update state
        if (append) {
          setConversations((prev) => [...prev, ...fetchedConversations]);
        } else {
          setConversations(fetchedConversations);
        }

        // Update pagination state
        const newTotal = data.total || fetchedConversations.length;
        setTotal(newTotal);
        setHasMore(currentOffset + fetchedConversations.length < newTotal);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [enabled, workspaceId, userId, pageSize]
  );

  /**
   * Load more conversations (for infinite scroll)
   */
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isFetchingRef.current) {
      return;
    }

    const newOffset = offset + pageSize;
    setOffset(newOffset);
    fetchConversations(newOffset, true);
  }, [hasMore, isLoadingMore, offset, pageSize, fetchConversations]);

  /**
   * Refresh conversations (reset to first page)
   */
  const refresh = useCallback(() => {
    setOffset(0);
    setConversations([]);
    setHasMore(true);
    fetchConversations(0, false);
  }, [fetchConversations]);

  // Initial load
  useEffect(() => {
    if (enabled) {
      fetchConversations(0, false);
    }
  }, [enabled, workspaceId, userId]); // Only re-fetch when filters change

  return {
    conversations,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
  };
}

/**
 * Hook for intersection observer (infinite scroll trigger)
 *
 * @param callback - Function to call when element is visible
 * @param options - Intersection observer options
 * @returns Ref to attach to sentinel element
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
}
