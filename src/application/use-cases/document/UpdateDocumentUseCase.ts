/**
 * Update Document Use Case
 * Requirements: Content Management 2.2
 */

import { DocumentEntity } from '../../../domain/document/entities/Document';
import { DocumentRepositoryInterface } from '../../../domain/document/repositories/DocumentRepositoryInterface';

export interface UpdateDocumentInput {
  documentId: string;
  workspaceId: string;
  title?: string;
  content?: string;
}

export class UpdateDocumentUseCase {
  constructor(private documentRepository: DocumentRepositoryInterface) {}

  async execute(input: UpdateDocumentInput): Promise<DocumentEntity> {
    const document = await this.documentRepository.findById(input.documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify document belongs to workspace
    if (!document.belongsToWorkspace(input.workspaceId)) {
      throw new Error('Document does not belong to workspace');
    }

    // Update fields if provided
    if (input.title !== undefined) {
      document.updateTitle(input.title);
    }

    if (input.content !== undefined) {
      document.updateContent(input.content);
    }

    return this.documentRepository.save(document);
  }
}
