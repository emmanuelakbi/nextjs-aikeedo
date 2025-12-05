/**
 * Component Preloading Utilities
 *
 * Provides utilities for preloading components and routes to improve
 * perceived performance and reduce loading times.
 *
 * Requirements: Performance considerations
 */

'use client';

import { ComponentType } from 'react';

/**
 * Preloaded components cache
 */
const preloadedComponents = new Map<string, Promise<any>>();

/**
 * Preload a component
 * Loads the component in the background without rendering it
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentId?: string
): Promise<{ default: T }> {
  const id = componentId || importFn.toString();

  // Check if already preloaded
  const cached = preloadedComponents.get(id);
  if (cached) {
    return cached;
  }

  // Start preloading
  const promise = importFn().catch((error) => {
    console.error('Failed to preload component:', error);
    // Remove from cache on error so it can be retried
    preloadedComponents.delete(id);
    throw error;
  });

  preloadedComponents.set(id, promise);
  return promise;
}

/**
 * Preload multiple components in parallel
 */
export async function preloadComponents(
  imports: Array<() => Promise<any>>
): Promise<void> {
  await Promise.all(imports.map((importFn) => preloadComponent(importFn)));
}

/**
 * Preload a route's components
 * Useful for prefetching the next page in a flow
 */
export function preloadRoute(route: string): void {
  // Use Next.js router prefetch
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }
}

/**
 * Preload multiple routes
 */
export function preloadRoutes(routes: string[]): void {
  routes.forEach(preloadRoute);
}

/**
 * Hook for preloading on hover
 */
export function usePreloadOnHover<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentId?: string
) {
  let hasPreloaded = false;

  const handleMouseEnter = () => {
    if (!hasPreloaded) {
      preloadComponent(importFn, componentId);
      hasPreloaded = true;
    }
  };

  const handleTouchStart = () => {
    if (!hasPreloaded) {
      preloadComponent(importFn, componentId);
      hasPreloaded = true;
    }
  };

  return {
    onMouseEnter: handleMouseEnter,
    onTouchStart: handleTouchStart,
  };
}

/**
 * Preload on viewport intersection
 * Preloads when element is about to enter viewport
 */
export function preloadOnIntersection(
  element: HTMLElement,
  importFn: () => Promise<any>,
  options?: IntersectionObserverInit
): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return () => {};
  }

  let hasPreloaded = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasPreloaded) {
          preloadComponent(importFn);
          hasPreloaded = true;
          observer.disconnect();
        }
      });
    },
    {
      rootMargin: '50px',
      ...options,
    }
  );

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}

/**
 * Preload critical resources
 * Should be called early in the application lifecycle
 */
export function preloadCriticalResources(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Preload fonts
  const fonts = ['/fonts/GeistVF.woff', '/fonts/GeistMonoVF.woff'];

  fonts.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Preload images
 */
export function preloadImages(urls: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Prefetch DNS for external domains
 */
export function prefetchDNS(domains: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains
 * Establishes early connections to important third-party origins
 */
export function preconnect(domains: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}
