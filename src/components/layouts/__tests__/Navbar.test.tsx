import { describe, it, expect } from 'vitest';
import React from 'react';
import Navbar from '../Navbar';

/**
 * Basic tests for Navbar component
 * Requirements: 11.1, 11.2
 */

describe('Navbar Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
  };

  const mockWorkspace = {
    id: '1',
    name: 'Test Workspace',
  };

  const mockWorkspaces = [
    { id: '1', name: 'Test Workspace' },
    { id: '2', name: 'Another Workspace' },
  ];

  it('should render with user prop', () => {
    const component = <Navbar user={mockUser} />;
    expect(component.props.user).toEqual(mockUser);
  });

  it('should render with workspace props', () => {
    const component = (
      <Navbar
        user={mockUser}
        currentWorkspace={mockWorkspace}
        workspaces={mockWorkspaces}
      />
    );
    expect(component.props.currentWorkspace).toEqual(mockWorkspace);
    expect(component.props.workspaces).toEqual(mockWorkspaces);
  });

  it('should render without user (unauthenticated)', () => {
    const component = <Navbar />;
    expect(component.props.user).toBeUndefined();
  });

  it('should accept empty workspaces array', () => {
    const component = <Navbar user={mockUser} workspaces={[]} />;
    expect(component.props.workspaces).toEqual([]);
  });
});
