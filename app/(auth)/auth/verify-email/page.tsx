'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Spinner, ErrorMessage, SuccessMessage } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * Email Verification Page
 *
 * Handles email verification using a token from the URL.
 * Requirements: 4.1, 4.2
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(
        'Invalid verification link. Please check your email for the correct link.'
      );
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(
          data.error?.message ||
            'Email verification failed. The link may be invalid or expired.'
        );
        return;
      }

      // Success
      setStatus('success');
      setMessage(
        'Your email has been verified successfully! You can now sign in to your account.'
      );
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Email Verification
      </h2>

      {status === 'loading' && (
        <div className="py-8">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Verifying your email address...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <SuccessMessage message={message} />
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push('/login')}
          >
            Sign in to your account
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          <ErrorMessage message={message} />
          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push('/auth/verify-request')}
            >
              Request new verification link
            </Button>
            <Link
              href="/login"
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
