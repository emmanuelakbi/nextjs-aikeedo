'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, FormError } from '../ui';

/**
 * Example form component demonstrating the usage of all form UI components
 * This serves as a reference implementation for Requirements 11.3, 11.4, 11.5
 */
export default function ExampleForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    // Simulate validation
    const newErrors: FormError[] = [];

    if (!formData.email) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.push({ field: 'email', message: 'Email is invalid' });
    }

    if (!formData.password) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    } else if (formData.password.length < 8) {
      newErrors.push({
        field: 'password',
        message: 'Password must be at least 8 characters',
      });
    }

    if (!formData.firstName) {
      newErrors.push({ field: 'firstName', message: 'First name is required' });
    }

    if (!formData.acceptTerms) {
      newErrors.push({
        field: 'acceptTerms',
        message: 'You must accept the terms and conditions',
      });
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setLoading(false);
      // Reset form on success
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        acceptTerms: false,
      });
    }, 1500);
  };

  const getFieldError = (field: string) => {
    return errors.find((e) => e.field === field)?.message;
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Example Form</h1>

      <Form onSubmit={handleSubmit} errors={errors} loading={loading}>
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={getFieldError('email')}
          helperText="We'll never share your email with anyone else"
          required
          disabled={loading}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          error={getFieldError('password')}
          helperText="Must be at least 8 characters"
          required
          disabled={loading}
        />

        <Input
          label="First Name"
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          error={getFieldError('firstName')}
          required
          disabled={loading}
        />

        <Input
          label="Last Name"
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          error={getFieldError('lastName')}
          disabled={loading}
        />

        <Checkbox
          label="I accept the terms and conditions"
          name="acceptTerms"
          checked={formData.acceptTerms}
          onChange={(e) =>
            setFormData({ ...formData, acceptTerms: e.target.checked })
          }
          error={getFieldError('acceptTerms')}
          required
          disabled={loading}
        />

        <div className="flex gap-2">
          <Button type="submit" variant="primary" loading={loading} fullWidth>
            Submit
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                acceptTerms: false,
              });
              setErrors([]);
            }}
            disabled={loading}
          >
            Reset
          </Button>
        </div>
      </Form>
    </div>
  );
}
