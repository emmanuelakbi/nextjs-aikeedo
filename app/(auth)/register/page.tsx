'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button, Form, FormError, useToast } from '@/components/ui';

/**
 * Register Page
 *
 * Provides user registration functionality with email verification.
 * Requirements: 3.1, 4.1, 4.2
 */
export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
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

    // Password validation
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

    // Confirm password validation
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

    // First name validation
    if (!formData.firstName) {
      newErrors.push({ field: 'firstName', message: 'First name is required' });
    } else if (formData.firstName.length < 2) {
      newErrors.push({
        field: 'firstName',
        message: 'First name must be at least 2 characters long',
      });
    }

    // Last name validation
    if (!formData.lastName) {
      newErrors.push({ field: 'lastName', message: 'Last name is required' });
    } else if (formData.lastName.length < 2) {
      newErrors.push({
        field: 'lastName',
        message: 'Last name must be at least 2 characters long',
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
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
          setErrors([
            { message: data.error?.message || 'Registration failed' },
          ]);
        }
        showToast(data.error?.message || 'Registration failed', 'error');
        return;
      }

      // Success
      showToast(
        'Registration successful! Please check your email to verify your account.',
        'success'
      );

      // Redirect to verification page
      router.push(
        '/auth/verify-request?email=' + encodeURIComponent(formData.email)
      );
    } catch (error) {
      console.error('Registration error:', error);
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
        Create your account
      </h2>

      <Form onSubmit={handleSubmit} errors={errors} loading={loading}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            type="text"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            error={getFieldError('firstName')}
            required
            disabled={loading}
          />

          <Input
            label="Last name"
            type="text"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            error={getFieldError('lastName')}
            required
            disabled={loading}
          />
        </div>

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
          label="Confirm password"
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
          Create account
        </Button>
      </Form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
