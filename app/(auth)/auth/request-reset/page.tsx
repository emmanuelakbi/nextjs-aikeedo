'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Form, FormError, useToast } from '@/components/ui';

/**
 * Password Reset Request Page
 *
 * Allows users to request a password reset link.
 * Requirements: 5.1, 5.2
 */
export default function RequestResetPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState({
    email: '',
  });

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
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.fields) {
          // Handle field-specific errors
          const fieldErrors: FormError[] = [];
          Object.entries(data.error.fields).forEach(([field, messages]) => {
            (messages as string[]).forEach((message) => {
              fieldErrors.push({ field, message });
            });
          });
          setErrors(fieldErrors);
        } else {
          setErrors([{ message: data.error?.message || 'Request failed' }]);
        }
        showToast(data.error?.message || 'Request failed', 'error');
        return;
      }

      // Success - always show success message for security
      showToast(
        'If an account exists with this email, a password reset link has been sent.',
        'success'
      );

      // Redirect to confirmation page
      router.push(
        '/auth/reset-sent?email=' + encodeURIComponent(formData.email)
      );
    } catch (error) {
      console.error('Password reset request error:', error);
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Reset your password
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

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

        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Send reset link
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
