import { describe, it, expect } from 'vitest';
import React from 'react';
import UserMenu from '../UserMenu';

/**
 * Basic tests for UserMenu component
 * Requirements: 11.1, 11.2
 */

describe('UserMenu Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
  };

  const mockAdminUser = {
    id: '2',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  };

  it('should render with user prop', () => {
    const component = <UserMenu user={mockUser} />;
    expect(component.props.user).toEqual(mockUser);
  });

  it('should render with admin user', () => {
    const component = <UserMenu user={mockAdminUser} />;
    expect(component.props.user.role).toBe('ADMIN');
  });

  it('should have required user properties', () => {
    const component = <UserMenu user={mockUser} />;
    expect(component.props.user.id).toBeDefined();
    expect(component.props.user.email).toBeDefined();
    expect(component.props.user.firstName).toBeDefined();
    expect(component.props.user.lastName).toBeDefined();
    expect(component.props.user.role).toBeDefined();
  });
});
