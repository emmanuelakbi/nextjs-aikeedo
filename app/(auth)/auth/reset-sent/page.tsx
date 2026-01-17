'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SuccessMessage } from '@/components/ui';

function ResetSentContent() {
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

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

/**
 * Password Reset Sent Page
 */
export default function ResetSentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetSentContent />
    </Suspense>
  );
}
