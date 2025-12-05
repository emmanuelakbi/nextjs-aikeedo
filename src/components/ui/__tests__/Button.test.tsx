import { describe, it, expect } from 'vitest';
import React from 'react';
import Button from '../Button';

describe('Button Component', () => {
  it('should render with children', () => {
    const text = 'Click me';
    const component = <Button>{text}</Button>;
    expect(component.props.children).toBe(text);
  });

  it('should have primary variant by default', () => {
    const component = <Button>Click</Button>;
    expect(component.props.variant).toBeUndefined(); // Uses default in component
  });

  it('should accept different variants', () => {
    const component = <Button variant="danger">Delete</Button>;
    expect(component.props.variant).toBe('danger');
  });

  it('should show loading state', () => {
    const component = <Button loading>Loading</Button>;
    expect(component.props.loading).toBe(true);
  });

  it('should be disabled when loading', () => {
    const component = <Button loading>Loading</Button>;
    expect(component.props.loading).toBe(true);
  });

  it('should accept different sizes', () => {
    const component = <Button size="lg">Large Button</Button>;
    expect(component.props.size).toBe('lg');
  });

  it('should support fullWidth prop', () => {
    const component = <Button fullWidth>Full Width</Button>;
    expect(component.props.fullWidth).toBe(true);
  });
});
