'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

/**
 * Logout Page
 *
 * Handles user logout and redirects to login page.
 * Requirements: 6.3
 */
export default function LogoutPage() {
  const router = useRouter();
  const [, setIsLoggingOut] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Sign out using NextAuth
        await signOut({
          redirect: false,
          callbackUrl: '/login',
        });

        // Redirect to login page
        router.push('/login');
      } catch (err) {
        console.error('Logout error:', err);
        setError('Failed to logout. Please try again.');
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Logout Error</h2>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Logging out...</h2>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
