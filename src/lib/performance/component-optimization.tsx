/**
 * Component-level Performance Optimizations
 *
 * Provides utilities for optimizing React component performance:
 * - Memoization helpers
 * - Render optimization
 * - Virtual scrolling
 * - Intersection observer hooks
 *
 * Requirements: Performance considerations
 */

'use client';

import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
  ComponentType,
  ReactNode,
} from 'react';

/**
 * Memoize a component with custom comparison
 */
export function memoComponent<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): ComponentType<P> {
  return memo(Component, propsAreEqual) as ComponentType<P>;
}

/**
 * Hook for debounced value
 * Useful for search inputs and expensive operations
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callback
 * Limits how often a function can be called
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Hook for intersection observer
 * Detects when element enters viewport
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry?.isIntersecting ?? false);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Hook for lazy loading content when in viewport
 */
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  options?: IntersectionObserverInit
): [React.RefObject<HTMLDivElement>, T | null, boolean] {
  const [ref, isIntersecting] = useIntersectionObserver(options);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded.current) {
      hasLoaded.current = true;
      setIsLoading(true);

      loadFn()
        .then(setData)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isIntersecting, loadFn]);

  return [ref, data, isLoading];
}

/**
 * Virtual list component for rendering large lists efficiently
 */
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(items.length, visibleEnd + overscan);

  const visibleItems = items.slice(start, end);
  const offsetY = start * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={start + index} style={{ height: itemHeight }}>
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for measuring component render time
 */
export function useRenderTime(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const duration = performance.now() - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Render] ${componentName} #${renderCount.current}: ${duration.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });
}

/**
 * Hook for preventing unnecessary re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Hook for memoizing expensive computations
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Component wrapper for conditional rendering
 * Only renders children when condition is true
 */
export function ConditionalRender({
  condition,
  children,
  fallback,
}: {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!condition) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Lazy render component
 * Defers rendering until after initial page load
 */
export function LazyRender({
  children,
  delay = 100,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook for window size with debouncing
 */
export function useWindowSize(debounceMs: number = 150) {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return size;
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}
