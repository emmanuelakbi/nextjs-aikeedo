'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SuccessMessage } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Password Reset Sent Page
 *
 * Displays a message after password reset request.
 * Requirements: 5.1
 */
export default function ResetSentPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Check your email
      </h2>

      <SuccessMessage
        message={
          email
            ? `If an account exists with ${email}, we've sent a password reset link. Please check your inbox.`
            : "If an account exists with your email address, we've sent a password reset link. Please check your inbox."
        }
      />

      <div className="mt-6 space-y-4">
        <p className="text-sm text-gray-600">
          Didn't receive the email? Check your spam folder or try requesting a
          new link.
        </p>

        <div className="pt-4 space-y-3">
          <Link
            href="/auth/request-reset"
            className="block text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Request another reset link
          </Link>
          <Link
            href="/login"
            className="block text-sm text-gray-600 hover:text-gray-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
