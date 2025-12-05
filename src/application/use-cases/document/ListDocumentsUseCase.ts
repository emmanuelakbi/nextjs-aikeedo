/**
 * List Documents Use Case
 * Requirements: Content Management 2.2, 2.3
 */

import {
  DocumentEntity,
  DocumentType,
} from '../../../domain/document/entities/Document';
import { DocumentRepositoryInterface } from '../../../domain/document/repositories/DocumentRepositoryInterface';

export interface ListDocumentsInput {
  workspaceId: string;
  userId?: string;
  type?: DocumentType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListDocumentsOutput {
  documents: DocumentEntity[];
  total: number;
}

export class ListDocumentsUseCase {
  constructor(private documentRepository: DocumentRepositoryInterface) {}

  async execute(input: ListDocumentsInput): Promise<ListDocumentsOutput> {
    const documents = await this.documentRepository.findByWorkspaceId(
      input.workspaceId,
      {
        userId: input.userId,
        type: input.type,
        search: input.search,
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
      }
    );

    const total = await this.documentRepository.countByWorkspaceId(
      input.workspaceId,
      {
        userId: input.userId,
        type: input.type,
        search: input.search,
      }
    );

    return { documents, total };
  }
}
