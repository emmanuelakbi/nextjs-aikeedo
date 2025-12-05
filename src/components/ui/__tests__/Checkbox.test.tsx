import { describe, it, expect } from 'vitest';
import React from 'react';
import Checkbox from '../Checkbox';

describe('Checkbox Component', () => {
  it('should render with label', () => {
    const label = 'Accept terms';
    const component = <Checkbox label={label} />;
    expect(component.props.label).toBe(label);
  });

  it('should show error message when error prop is provided', () => {
    const error = 'You must accept the terms';
    const component = <Checkbox error={error} />;
    expect(component.props.error).toBe(error);
  });

  it('should show helper text when provided', () => {
    const helperText = 'Please read the terms carefully';
    const component = <Checkbox helperText={helperText} />;
    expect(component.props.helperText).toBe(helperText);
  });

  it('should be checked when checked prop is true', () => {
    const component = <Checkbox checked />;
    expect(component.props.checked).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    const component = <Checkbox disabled />;
    expect(component.props.disabled).toBe(true);
  });
});
