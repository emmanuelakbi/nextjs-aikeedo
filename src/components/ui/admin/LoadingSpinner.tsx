'use client';

/**
 * Loading Spinner Component
 *
 * Requirements: Admin Dashboard - All sections
 *
 * Displays a loading spinner with optional message.
 */

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <div
        className={`inline-block animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      {message && <p className="mt-2 text-gray-600">{message}</p>}
    </>
  );

  if (fullScreen) {
    return (
      <div className="flex justify-center items-center h-screen">{content}</div>
    );
  }

  return <div className="p-8 text-center">{content}</div>;
}
