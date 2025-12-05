/**
 * Search Documents Use Case
 * Requirements: Content Management 2.3
 */

import {
  DocumentEntity,
  DocumentType,
} from '../../../domain/document/entities/Document';
import { DocumentRepositoryInterface } from '../../../domain/document/repositories/DocumentRepositoryInterface';

export interface SearchDocumentsInput {
  workspaceId: string;
  query: string;
  userId?: string;
  type?: DocumentType;
  limit?: number;
  offset?: number;
}

export interface SearchDocumentsOutput {
  documents: DocumentEntity[];
  total: number;
}

export class SearchDocumentsUseCase {
  constructor(private documentRepository: DocumentRepositoryInterface) {}

  async execute(input: SearchDocumentsInput): Promise<SearchDocumentsOutput> {
    const documents = await this.documentRepository.search(
      input.workspaceId,
      input.query,
      {
        userId: input.userId,
        type: input.type,
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
      }
    );

    const total = await this.documentRepository.countByWorkspaceId(
      input.workspaceId,
      {
        userId: input.userId,
        type: input.type,
        search: input.query,
      }
    );

    return { documents, total };
  }
}
