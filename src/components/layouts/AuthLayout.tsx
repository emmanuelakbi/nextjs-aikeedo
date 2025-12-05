import React from 'react';
import Link from 'next/link';

/**
 * Authentication layout component for login, register, and related pages
 * Requirements: 11.1, 11.2
 */

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center">
          <span className="text-3xl font-bold text-blue-600">AIKEEDO</span>
        </Link>

        {/* Title and subtitle */}
        {title && (
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      {/* Main content card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <a
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms
            </a>
            <a
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy
            </a>
            <a
              href="/support"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Support
            </a>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} AIKEEDO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
