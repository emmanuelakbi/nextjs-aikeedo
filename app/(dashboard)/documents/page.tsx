/**
 * Documents Page
 *
 * Main document management interface with list view and editor.
 * Requirements: Content Management 2.1, 2.2, 2.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import DocumentList from '@/components/documents/DocumentList';
import DocumentEditor from '@/components/documents/DocumentEditor';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export interface Document {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO';
  fileId: string | null;
  generationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<
    'TEXT' | 'IMAGE' | 'AUDIO' | 'ALL'
  >('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Load workspace ID from session on mount
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data?.user?.currentWorkspaceId) {
          setWorkspaceId(data.user.currentWorkspaceId);
        } else {
          setError('No workspace selected. Please select a workspace first.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading workspace:', err);
        setError('Failed to load workspace');
        setIsLoading(false);
      }
    };
    loadWorkspace();
  }, []);

  // Load documents when workspace ID is available
  useEffect(() => {
    if (workspaceId) {
      loadDocuments();
    }
  }, [workspaceId, searchQuery, filterType]);

  const loadDocuments = async () => {
    if (!workspaceId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('workspaceId', workspaceId);
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (filterType !== 'ALL') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/documents?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      setDocuments(
        data.data.documents.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        }))
      );
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedDocument(null);
  };

  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsCreating(false);
  };

  const handleSaveDocument = async (document: Partial<Document>) => {
    if (!workspaceId) {
      throw new Error('No workspace selected');
    }
    
    try {
      if (selectedDocument) {
        // Update existing document
        const response = await fetch(`/api/documents/${selectedDocument.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId,
          },
          body: JSON.stringify({
            title: document.title,
            content: document.content,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update document');
        }

        const data = await response.json();
        const updatedDoc = {
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        };

        setDocuments(
          documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
        );
        setSelectedDocument(updatedDoc);
      } else {
        // Create new document
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-workspace-id': workspaceId,
          },
          body: JSON.stringify({
            title: document.title || 'Untitled Document',
            content: document.content || '',
            type: document.type || 'TEXT',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create document');
        }

        const data = await response.json();
        const newDoc = {
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        };

        setDocuments([newDoc, ...documents]);
        setSelectedDocument(newDoc);
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Error saving document:', err);
      throw err;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!workspaceId) {
      throw new Error('No workspace selected');
    }
    
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'x-workspace-id': workspaceId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter((doc) => doc.id !== documentId));
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  const handleCloseEditor = () => {
    setSelectedDocument(null);
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="mt-2 text-gray-600">
              Manage your generated content and documents
            </p>
          </div>
          <Button onClick={handleCreateNew} variant="primary">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Document
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-red-600">{error}</p>
                  <Button
                    onClick={loadDocuments}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <DocumentList
                  documents={documents}
                  selectedDocumentId={selectedDocument?.id || null}
                  onSelectDocument={handleSelectDocument}
                  onDeleteDocument={handleDeleteDocument}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterType={filterType}
                  onFilterChange={setFilterType}
                />
              )}
            </div>
          </div>

          {/* Document Editor */}
          <div className="lg:col-span-2">
            {selectedDocument || isCreating ? (
              <DocumentEditor
                document={selectedDocument}
                onSave={handleSaveDocument}
                onClose={handleCloseEditor}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No document selected
                </h3>
                <p className="mt-2 text-gray-500">
                  Select a document from the list or create a new one to get
                  started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
