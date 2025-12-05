import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className={`
                w-4 h-4 border rounded
                focus:ring-2 focus:ring-offset-0
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
                ${
                  hasError
                    ? 'border-red-500 text-red-600 focus:ring-red-500'
                    : 'border-gray-300 text-blue-600 focus:ring-blue-500'
                }
                ${className}
              `}
              aria-invalid={hasError}
              aria-describedby={
                error
                  ? `${checkboxId}-error`
                  : helperText
                    ? `${checkboxId}-helper`
                    : undefined
              }
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3">
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-gray-700"
              >
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${checkboxId}-helper`}
            className="mt-1 ml-7 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
