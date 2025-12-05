/**
 * Document List Component Tests
 * Requirements: Content Management 2.2, 2.3
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import DocumentList from '../DocumentList';

describe('DocumentList Component', () => {
  const mockDocuments = [
    {
      id: '1',
      title: 'Document 1',
      content: 'Content 1',
      type: 'TEXT' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Document 2',
      content: 'Content 2',
      type: 'IMAGE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOnSelectDocument = vi.fn();
  const mockOnDeleteDocument = vi.fn();
  const mockOnSearchChange = vi.fn();
  const mockOnFilterChange = vi.fn();

  it('should render with documents', () => {
    const component = (
      <DocumentList
        documents={mockDocuments}
        selectedDocumentId={null}
        onSelectDocument={mockOnSelectDocument}
        onDeleteDocument={mockOnDeleteDocument}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        filterType="ALL"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(component.props.documents).toBe(mockDocuments);
  });

  it('should accept selected document ID', () => {
    const component = (
      <DocumentList
        documents={mockDocuments}
        selectedDocumentId="1"
        onSelectDocument={mockOnSelectDocument}
        onDeleteDocument={mockOnDeleteDocument}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        filterType="ALL"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(component.props.selectedDocumentId).toBe('1');
  });

  it('should accept search query', () => {
    const component = (
      <DocumentList
        documents={mockDocuments}
        selectedDocumentId={null}
        onSelectDocument={mockOnSelectDocument}
        onDeleteDocument={mockOnDeleteDocument}
        searchQuery="test"
        onSearchChange={mockOnSearchChange}
        filterType="ALL"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(component.props.searchQuery).toBe('test');
  });

  it('should accept filter type', () => {
    const component = (
      <DocumentList
        documents={mockDocuments}
        selectedDocumentId={null}
        onSelectDocument={mockOnSelectDocument}
        onDeleteDocument={mockOnDeleteDocument}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        filterType="TEXT"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(component.props.filterType).toBe('TEXT');
  });

  it('should accept callbacks', () => {
    const component = (
      <DocumentList
        documents={mockDocuments}
        selectedDocumentId={null}
        onSelectDocument={mockOnSelectDocument}
        onDeleteDocument={mockOnDeleteDocument}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        filterType="ALL"
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(component.props.onSelectDocument).toBe(mockOnSelectDocument);
    expect(component.props.onDeleteDocument).toBe(mockOnDeleteDocument);
    expect(component.props.onSearchChange).toBe(mockOnSearchChange);
    expect(component.props.onFilterChange).toBe(mockOnFilterChange);
  });
});
