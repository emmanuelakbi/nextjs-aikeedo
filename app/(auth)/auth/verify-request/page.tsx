'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SuccessMessage } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Verification Request Page
 *
 * Displays a message after registration asking user to check their email.
 * Requirements: 4.1
 */
export default function VerifyRequestPage() {
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
            ? `We've sent a verification link to ${email}. Please check your inbox and click the link to verify your account.`
            : "We've sent a verification link to your email address. Please check your inbox and click the link to verify your account."
        }
      />

      <div className="mt-6 space-y-4">
        <p className="text-sm text-gray-600">
          Didn't receive the email? Check your spam folder or request a new
          verification link.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
