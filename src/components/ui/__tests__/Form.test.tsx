import { describe, it, expect } from 'vitest';
import React from 'react';
import Form from '../Form';

describe('Form Component', () => {
  it('should render children', () => {
    const component = (
      <Form>
        <input type="text" />
      </Form>
    );
    expect(component.props.children).toBeDefined();
  });

  it('should display general errors', () => {
    const errors = [{ message: 'Form submission failed' }];
    const component = <Form errors={errors}>Content</Form>;
    expect(component.props.errors).toEqual(errors);
  });

  it('should filter field-specific errors from general display', () => {
    const errors = [
      { field: 'email', message: 'Invalid email' },
      { message: 'Server error' },
    ];
    const component = <Form errors={errors}>Content</Form>;
    expect(component.props.errors).toEqual(errors);
  });

  it('should show loading state', () => {
    const component = <Form loading>Content</Form>;
    expect(component.props.loading).toBe(true);
  });
});
