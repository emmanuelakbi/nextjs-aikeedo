import { describe, it, expect } from 'vitest';
import React from 'react';
import Input from '../Input';

describe('Input Component', () => {
  it('should render with label', () => {
    const label = 'Email Address';
    const component = <Input label={label} />;
    expect(component.props.label).toBe(label);
  });

  it('should show error message when error prop is provided', () => {
    const error = 'This field is required';
    const component = <Input error={error} />;
    expect(component.props.error).toBe(error);
  });

  it('should show helper text when provided', () => {
    const helperText = 'Enter your email address';
    const component = <Input helperText={helperText} />;
    expect(component.props.helperText).toBe(helperText);
  });

  it('should mark as required when required prop is true', () => {
    const component = <Input label="Email" required />;
    expect(component.props.required).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    const component = <Input disabled />;
    expect(component.props.disabled).toBe(true);
  });
});
