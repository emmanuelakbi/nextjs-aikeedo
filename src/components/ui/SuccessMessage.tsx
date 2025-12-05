import React from 'react';

export interface SuccessMessageProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  title = 'Success',
  onDismiss,
  className = '',
  variant = 'inline',
}) => {
  const variantStyles = {
    inline: 'p-3 rounded-md bg-green-50 border border-green-200',
    card: 'p-6 rounded-lg bg-green-50 border border-green-200 shadow-sm',
    banner: 'p-4 bg-green-50 border-l-4 border-green-500',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-green-500">
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-semibold text-green-800 mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm text-green-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;
