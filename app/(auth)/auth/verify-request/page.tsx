'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SuccessMessage } from '@/components/ui';

function VerifyRequestContent() {
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

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

/**
 * Verification Request Page
 */
export default function VerifyRequestPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyRequestContent />
    </Suspense>
  );
}
