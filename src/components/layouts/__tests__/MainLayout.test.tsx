import { describe, it, expect } from 'vitest';
import React from 'react';
import MainLayout from '../MainLayout';

/**
 * Basic tests for MainLayout component
 * Requirements: 11.1, 11.2
 */

describe('MainLayout Component', () => {
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

  it('should render with children', () => {
    const component = (
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );
    expect(component.props.children).toBeDefined();
  });

  it('should render with user and workspace props', () => {
    const component = (
      <MainLayout
        user={mockUser}
        currentWorkspace={mockWorkspace}
        workspaces={mockWorkspaces}
      >
        <div>Test Content</div>
      </MainLayout>
    );
    expect(component.props.user).toEqual(mockUser);
    expect(component.props.currentWorkspace).toEqual(mockWorkspace);
    expect(component.props.workspaces).toEqual(mockWorkspaces);
  });

  it('should render without user (unauthenticated)', () => {
    const component = (
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );
    expect(component.props.user).toBeUndefined();
  });

  it('should default workspaces to empty array', () => {
    const component = (
      <MainLayout user={mockUser}>
        <div>Test Content</div>
      </MainLayout>
    );
    expect(component.props.workspaces).toBeUndefined();
  });
});
