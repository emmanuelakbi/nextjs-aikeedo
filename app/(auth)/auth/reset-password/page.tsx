'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Input,
  Button,
  Form,
  FormError,
  useToast,
  ErrorMessage,
} from '@/components/ui';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [tokenError, setTokenError] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    if (!formData.password) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    } else if (formData.password.length < 8) {
      newErrors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
      });
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.push({
        field: 'password',
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    }

    if (!formData.confirmPassword) {
      newErrors.push({
        field: 'confirmPassword',
        message: 'Please confirm your password',
      });
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.push({
        field: 'confirmPassword',
        message: 'Passwords do not match',
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.fields) {
          const fieldErrors: FormError[] = [];
          Object.entries(data.error.fields).forEach(([field, messages]) => {
            (messages as string[]).forEach((message) => {
              fieldErrors.push({ field, message });
            });
          });
          setErrors(fieldErrors);
        } else {
          setErrors([
            { message: data.error?.message || 'Password reset failed' },
          ]);
        }
        showToast(data.error?.message || 'Password reset failed', 'error');
        return;
      }

      showToast(
        'Password reset successfully! You can now sign in with your new password.',
        'success'
      );
      router.push('/login');
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors([{ message: 'An error occurred. Please try again.' }]);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find((e) => e.field === field)?.message;
  };

  if (tokenError) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Reset Password
        </h2>
        <ErrorMessage message={tokenError} />
        <div className="mt-6 space-y-3">
          <Link
            href="/auth/request-reset"
            className="block text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Request a new reset link
          </Link>
          <Link
            href="/login"
            className="block text-sm text-gray-600 hover:text-gray-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Set new password
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Please enter your new password below.
      </p>

      <Form onSubmit={handleSubmit} errors={errors} loading={loading}>
        <Input
          label="New password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          error={getFieldError('password')}
          helperText="Must be at least 8 characters with uppercase, lowercase, and number"
          required
          disabled={loading}
        />

        <Input
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          error={getFieldError('confirmPassword')}
          required
          disabled={loading}
        />

        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Reset password
        </Button>
      </Form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          Back to sign in
        </Link>
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
 * Password Reset Page
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
