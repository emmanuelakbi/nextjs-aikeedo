/**
 * Get Document Use Case
 * Requirements: Content Management 2.2
 */

import { DocumentEntity } from '../../../domain/document/entities/Document';
import { DocumentRepositoryInterface } from '../../../domain/document/repositories/DocumentRepositoryInterface';

export interface GetDocumentInput {
  documentId: string;
  workspaceId: string;
}

export class GetDocumentUseCase {
  constructor(private documentRepository: DocumentRepositoryInterface) {}

  async execute(input: GetDocumentInput): Promise<DocumentEntity | null> {
    const document = await this.documentRepository.findById(input.documentId);

    if (!document) {
      return null;
    }

    // Verify document belongs to workspace
    if (!document.belongsToWorkspace(input.workspaceId)) {
      throw new Error('Document does not belong to workspace');
    }

    return document;
  }
}
