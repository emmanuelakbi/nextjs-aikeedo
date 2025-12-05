/**
 * React Query Client Configuration
 *
 * Provides client-side caching and data fetching with React Query.
 * Optimizes network requests and provides automatic background refetching.
 *
 * Requirements: Performance considerations
 */

'use client';

import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Default query client configuration
 */
const defaultQueryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
};

/**
 * Create a new query client instance
 */
export function createQueryClient() {
  return new QueryClient(defaultQueryClientConfig);
}

/**
 * Query Client Provider Component
 * Wraps the application with React Query provider
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Create query client once per component lifecycle
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // User queries
  user: {
    all: ['users'] as const,
    me: () => [...queryKeys.user.all, 'me'] as const,
    detail: (id: string) => [...queryKeys.user.all, id] as const,
  },
  // Workspace queries
  workspace: {
    all: ['workspaces'] as const,
    list: () => [...queryKeys.workspace.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.workspace.all, id] as const,
    current: () => [...queryKeys.workspace.all, 'current'] as const,
  },
  // Session queries
  session: {
    all: ['session'] as const,
    current: () => [...queryKeys.session.all, 'current'] as const,
  },
} as const;

/**
 * Prefetch utilities for server-side rendering
 */
export const prefetchQueries = {
  /**
   * Prefetch user data
   */
  async user(queryClient: QueryClient, userId: string) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.user.detail(userId),
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        return response.json();
      },
    });
  },

  /**
   * Prefetch current user
   */
  async currentUser(queryClient: QueryClient) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.user.me(),
      queryFn: async () => {
        const response = await fetch('/api/users/me');
        if (!response.ok) {
          throw new Error('Failed to fetch current user');
        }
        return response.json();
      },
    });
  },

  /**
   * Prefetch workspaces
   */
  async workspaces(queryClient: QueryClient) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.workspace.list(),
      queryFn: async () => {
        const response = await fetch('/api/workspaces');
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces');
        }
        return response.json();
      },
    });
  },
};

/**
 * Cache invalidation utilities
 */
export const invalidateQueries = {
  /**
   * Invalidate all user queries
   */
  async users(queryClient: QueryClient) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.user.all,
    });
  },

  /**
   * Invalidate specific user
   */
  async user(queryClient: QueryClient, userId: string) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.user.detail(userId),
    });
  },

  /**
   * Invalidate all workspace queries
   */
  async workspaces(queryClient: QueryClient) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.workspace.all,
    });
  },

  /**
   * Invalidate specific workspace
   */
  async workspace(queryClient: QueryClient, workspaceId: string) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.workspace.detail(workspaceId),
    });
  },
};
