'use client';

import { ToastProvider } from '@/components/ui';
import { SessionProvider } from 'next-auth/react';

/**
 * Auth Layout
 *
 * Provides a centered layout for authentication pages.
 * Requirements: 11.1, 11.2
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h1 className="text-center text-3xl font-bold text-gray-900">
              AIKEEDO
            </h1>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {children}
            </div>
          </div>
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
