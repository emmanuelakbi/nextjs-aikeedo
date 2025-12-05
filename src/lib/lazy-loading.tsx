/**
 * Lazy Loading Utilities
 *
 * Provides utilities for lazy loading components and code splitting:
 * - Dynamic imports with loading states
 * - Intersection Observer for viewport-based loading
 * - Preloading utilities
 *
 * Requirements: Performance considerations
 */

'use client';

import {
  ComponentType,
  lazy,
  Suspense,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * Lazy load a component with a loading fallback
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Default loading spinner
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

/**
 * Lazy load component when it enters viewport
 * Uses Intersection Observer for efficient viewport detection
 */
export function LazyLoadOnView({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.01,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isInView ? children : fallback || <div className="h-32" />}
    </div>
  );
}

/**
 * Preload a component
 * Useful for preloading components that will be needed soon
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  // Trigger the import but don't wait for it
  importFunc().catch((error) => {
    console.error('Failed to preload component:', error);
  });
}

/**
 * Hook to preload a component on hover
 */
export function usePreloadOnHover<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const hasPreloaded = useRef(false);

  const handleMouseEnter = () => {
    if (!hasPreloaded.current) {
      preloadComponent(importFunc);
      hasPreloaded.current = true;
    }
  };

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Lazy load a modal/dialog component
 * Only loads when the modal is opened
 */
export function useLazyModal<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const [isOpen, setIsOpen] = useState(false);
  const [Component, setComponent] = useState<T | null>(null);

  useEffect(() => {
    if (isOpen && !Component) {
      importFunc().then((module) => {
        setComponent(() => module.default);
      });
    }
  }, [isOpen, Component, importFunc]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    Component,
  };
}

/**
 * Lazy load content below the fold
 * Defers loading until after initial page render
 */
export function BelowTheFold({ children }: { children: ReactNode }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Defer rendering until after initial paint
    const timeoutId = setTimeout(() => {
      setShouldRender(true);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Lazy load a route component with loading state
 */
export function LazyRoute({
  component: Component,
  loading,
  ...props
}: {
  component: ComponentType<any>;
  loading?: ReactNode;
  [key: string]: any;
}) {
  return (
    <Suspense fallback={loading || <LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
}
