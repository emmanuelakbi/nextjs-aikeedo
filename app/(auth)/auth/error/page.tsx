'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Auth Error Page
 *
 * Displays authentication errors.
 * Requirements: 9.1, 9.2
 */
export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null): string => {
    switch (errorCode) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'There was a problem signing in. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in using your original method.';
      case 'EmailSignin':
        return 'The email link is no longer valid. It may have expired or already been used.';
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Authentication Error
      </h2>

      <ErrorMessage message={getErrorMessage(error)} />

      <div className="mt-6 space-y-3">
        <Link
          href="/login"
          className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try signing in again
        </Link>
        <Link
          href="/register"
          className="block text-sm text-blue-600 hover:text-blue-500"
        >
          Create a new account
        </Link>
      </div>
    </div>
  );
}
