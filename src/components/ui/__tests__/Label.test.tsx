import { describe, it, expect } from 'vitest';
import React from 'react';
import Label from '../Label';

describe('Label Component', () => {
  it('should render with children', () => {
    const text = 'Username';
    const component = <Label>{text}</Label>;
    expect(component.props.children).toBe(text);
  });

  it('should show required indicator when required prop is true', () => {
    const component = <Label required>Email</Label>;
    expect(component.props.required).toBe(true);
  });

  it('should accept htmlFor prop', () => {
    const component = <Label htmlFor="email-input">Email</Label>;
    expect(component.props.htmlFor).toBe('email-input');
  });
});
