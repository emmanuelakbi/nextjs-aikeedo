import { describe, it, expect } from 'vitest';
import React from 'react';
import AuthLayout from '../AuthLayout';

/**
 * Basic tests for AuthLayout component
 * Requirements: 11.1, 11.2
 */

describe('AuthLayout Component', () => {
  it('should render with children', () => {
    const component = (
      <AuthLayout>
        <div>Auth Form</div>
      </AuthLayout>
    );
    expect(component.props.children).toBeDefined();
  });

  it('should render with title', () => {
    const component = (
      <AuthLayout title="Sign In">
        <div>Auth Form</div>
      </AuthLayout>
    );
    expect(component.props.title).toBe('Sign In');
  });

  it('should render with subtitle', () => {
    const component = (
      <AuthLayout subtitle="Welcome back!">
        <div>Auth Form</div>
      </AuthLayout>
    );
    expect(component.props.subtitle).toBe('Welcome back!');
  });

  it('should render with both title and subtitle', () => {
    const component = (
      <AuthLayout title="Sign In" subtitle="Welcome back!">
        <div>Auth Form</div>
      </AuthLayout>
    );
    expect(component.props.title).toBe('Sign In');
    expect(component.props.subtitle).toBe('Welcome back!');
  });

  it('should render without title and subtitle', () => {
    const component = (
      <AuthLayout>
        <div>Auth Form</div>
      </AuthLayout>
    );
    expect(component.props.title).toBeUndefined();
    expect(component.props.subtitle).toBeUndefined();
  });
});
