/**
 * Optimized Image Component
 *
 * Wrapper around Next.js Image component with performance optimizations:
 * - Automatic lazy loading
 * - Responsive image sizing
 * - Blur placeholder support
 * - WebP format optimization
 *
 * Requirements: Performance considerations
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  /**
   * Show blur placeholder while loading
   */
  showPlaceholder?: boolean;

  /**
   * Custom placeholder color (hex or rgb)
   */
  placeholderColor?: string;

  /**
   * Callback when image loads
   */
  onLoad?: () => void;
}

/**
 * OptimizedImage component with automatic performance optimizations
 */
export function OptimizedImage({
  showPlaceholder = true,
  placeholderColor = '#f3f4f6',
  onLoad,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const imageClassName = `
    ${props.className || ''}
    ${isLoading && showPlaceholder ? 'blur-sm' : 'blur-0'}
    transition-all duration-300
  `;

  return (
    <Image
      {...props}
      className={imageClassName}
      loading={props.loading || 'lazy'}
      placeholder={showPlaceholder ? 'blur' : undefined}
      blurDataURL={
        showPlaceholder
          ? `data:image/svg+xml;base64,${toBase64(shimmer(700, 475, placeholderColor))}`
          : undefined
      }
      onLoad={handleLoad}
    />
  );
}

/**
 * Generate a shimmer SVG for placeholder
 */
function shimmer(w: number, h: number, color: string): string {
  return `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="${color}" offset="20%" />
          <stop stop-color="#e5e7eb" offset="50%" />
          <stop stop-color="${color}" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="${color}" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `;
}

/**
 * Convert SVG to base64
 */
function toBase64(str: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return window.btoa(str);
}

/**
 * Avatar image with optimized loading
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      showPlaceholder
      placeholderColor="#e5e7eb"
    />
  );
}

/**
 * Logo image with optimized loading
 */
export function LogoImage({
  src,
  alt,
  width,
  height,
  className = '',
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority // Logos should load immediately
      showPlaceholder={false}
    />
  );
}
