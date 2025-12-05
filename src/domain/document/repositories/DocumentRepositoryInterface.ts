/**
 * Document Repository Interface
 * Requirements: Content Management 2.1, 2.2, 2.3
 */

import { DocumentEntity, DocumentType } from '../entities/Document';

export interface DocumentSearchOptions {
  userId?: string;
  type?: DocumentType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DocumentRepositoryInterface {
  /**
   * Save a document record
   */
  save(document: DocumentEntity): Promise<DocumentEntity>;

  /**
   * Find a document by ID
   */
  findById(id: string): Promise<DocumentEntity | null>;

  /**
   * Find documents by workspace ID with optional filters
   */
  findByWorkspaceId(
    workspaceId: string,
    options?: DocumentSearchOptions
  ): Promise<DocumentEntity[]>;

  /**
   * Count documents by workspace ID with optional filters
   */
  countByWorkspaceId(
    workspaceId: string,
    options?: Omit<DocumentSearchOptions, 'limit' | 'offset'>
  ): Promise<number>;

  /**
   * Search documents by title or content
   */
  search(
    workspaceId: string,
    query: string,
    options?: Omit<DocumentSearchOptions, 'search'>
  ): Promise<DocumentEntity[]>;

  /**
   * Delete a document record
   */
  delete(id: string): Promise<void>;

  /**
   * Check if document exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Find documents by generation ID
   */
  findByGenerationId(generationId: string): Promise<DocumentEntity[]>;

  /**
   * Find documents by file ID
   */
  findByFileId(fileId: string): Promise<DocumentEntity[]>;
}
