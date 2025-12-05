import React, { FormHTMLAttributes, forwardRef } from 'react';

export interface FormError {
  field?: string;
  message: string;
}

export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  errors?: FormError[];
  loading?: boolean;
}

const Form = forwardRef<HTMLFormElement, FormProps>(
  (
    { children, errors = [], loading = false, className = '', ...props },
    ref
  ) => {
    // Filter out field-specific errors to show only general errors
    const generalErrors = errors.filter((error) => !error.field);

    return (
      <form
        ref={ref}
        className={`space-y-4 ${className}`}
        aria-busy={loading}
        {...props}
      >
        {generalErrors.length > 0 && (
          <div
            className="bg-red-50 border border-red-200 rounded-md p-4"
            role="alert"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {generalErrors.length === 1
                    ? 'There was an error with your submission'
                    : `There were ${generalErrors.length} errors with your submission`}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {generalErrors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

export default Form;
