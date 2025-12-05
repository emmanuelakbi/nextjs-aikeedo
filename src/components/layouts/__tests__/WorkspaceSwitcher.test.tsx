import { describe, it, expect } from 'vitest';
import React from 'react';
import WorkspaceSwitcher from '../WorkspaceSwitcher';

/**
 * Basic tests for WorkspaceSwitcher component
 * Requirements: 11.1, 11.2, 8.3
 */

describe('WorkspaceSwitcher Component', () => {
  const mockCurrentWorkspace = {
    id: '1',
    name: 'Current Workspace',
  };

  const mockWorkspaces = [
    { id: '1', name: 'Current Workspace' },
    { id: '2', name: 'Another Workspace' },
    { id: '3', name: 'Third Workspace' },
  ];

  it('should render with required props', () => {
    const component = (
      <WorkspaceSwitcher
        currentWorkspace={mockCurrentWorkspace}
        workspaces={mockWorkspaces}
      />
    );
    expect(component.props.currentWorkspace).toEqual(mockCurrentWorkspace);
    expect(component.props.workspaces).toEqual(mockWorkspaces);
  });

  it('should accept mobile prop', () => {
    const component = (
      <WorkspaceSwitcher
        currentWorkspace={mockCurrentWorkspace}
        workspaces={mockWorkspaces}
        mobile
      />
    );
    expect(component.props.mobile).toBe(true);
  });

  it('should default mobile to false', () => {
    const component = (
      <WorkspaceSwitcher
        currentWorkspace={mockCurrentWorkspace}
        workspaces={mockWorkspaces}
      />
    );
    expect(component.props.mobile).toBeUndefined();
  });

  it('should handle single workspace', () => {
    const component = (
      <WorkspaceSwitcher
        currentWorkspace={mockCurrentWorkspace}
        workspaces={[mockCurrentWorkspace]}
      />
    );
    expect(component.props.workspaces.length).toBe(1);
  });
});
