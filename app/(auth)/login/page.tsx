'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Input,
  Button,
  Form,
  FormError,
  useToast,
} from '@/components/ui';

/**
 * Login Page
 *
 * Provides user login functionality with email and password.
 * Requirements: 3.1, 3.2
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Check for redirect URL
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  // Show error message if present
  if (error && !loading) {
    if (error === 'CredentialsSignin') {
      showToast('Invalid email or password', 'error');
    } else {
      showToast('An error occurred. Please try again.', 'error');
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    // Email validation
    if (!formData.email) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({
        field: 'email',
        message: 'Please enter a valid email address',
      });
    }

    // Password validation
    if (!formData.password) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setErrors([{ message: 'Invalid email or password' }]);
        showToast('Invalid email or password', 'error');
      } else if (result?.ok) {
        showToast('Login successful!', 'success');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors([{ message: 'An error occurred. Please try again.' }]);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find((e) => e.field === field)?.message;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Sign in to your account
      </h2>

      <Form onSubmit={handleSubmit} errors={errors} loading={loading}>
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={getFieldError('email')}
          required
          disabled={loading}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          error={getFieldError('password')}
          required
          disabled={loading}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/auth/request-reset"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Sign in
        </Button>
      </Form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Don't have an account?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/register"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
