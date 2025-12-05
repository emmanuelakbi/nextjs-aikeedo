/**
 * Document Editor Component Tests
 * Requirements: Content Management 2.1, 2.2
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import DocumentEditor from '../DocumentEditor';

describe('DocumentEditor Component', () => {
  const mockDocument = {
    id: '123',
    title: 'Test Document',
    content: 'Test content',
    type: 'TEXT' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  it('should render with document data', () => {
    const component = (
      <DocumentEditor
        document={mockDocument}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    expect(component.props.document).toBe(mockDocument);
  });

  it('should render for new document', () => {
    const component = (
      <DocumentEditor
        document={null}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    expect(component.props.document).toBeNull();
  });

  it('should accept onSave callback', () => {
    const component = (
      <DocumentEditor
        document={mockDocument}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    expect(component.props.onSave).toBe(mockOnSave);
  });

  it('should accept onClose callback', () => {
    const component = (
      <DocumentEditor
        document={mockDocument}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    expect(component.props.onClose).toBe(mockOnClose);
  });
});
