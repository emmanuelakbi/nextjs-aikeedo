'use client';

import { ReactNode } from 'react';

/**
 * Card Component
 *
 * Requirements: Admin Dashboard - All sections
 *
 * Reusable card container with optional header and footer.
 */

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Header Component
 */

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function CardHeader({ title, subtitle, actions }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Card Section Component
 */

interface CardSectionProps {
  children: ReactNode;
  className?: string;
  divider?: boolean;
}

export function CardSection({ 
  children, 
  className = '',
  divider = false 
}: CardSectionProps) {
  return (
    <div className={`${divider ? 'border-t border-gray-200 pt-4 mt-4' : ''} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Grid Component
 */

interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export function CardGrid({ 
  children, 
  columns = 3,
  gap = 'md' 
}: CardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gapClasses[gap]}`}>
      {children}
    </div>
  );
}
