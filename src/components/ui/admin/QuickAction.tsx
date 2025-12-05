'use client';

/**
 * Quick Action Component
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 *
 * Quick action cards for common admin tasks.
 */

interface QuickActionProps {
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function QuickAction({ 
  title, 
  description, 
  href, 
  onClick,
  icon 
}: QuickActionProps) {
  const className = "p-4 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors text-center block";

  const content = (
    <>
      {icon && (
        <div className="flex justify-center mb-2">
          <div className="w-8 h-8 text-gray-600">
            {icon}
          </div>
        </div>
      )}
      <div className="font-medium text-gray-900">{title}</div>
      {description && (
        <div className="text-sm text-gray-600 mt-1">{description}</div>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/**
 * Quick Actions Grid Component
 */

interface QuickActionsGridProps {
  children: React.ReactNode;
  columns?: 3 | 4 | 6;
}

export function QuickActionsGrid({ 
  children, 
  columns = 6 
}: QuickActionsGridProps) {
  const gridCols = {
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
