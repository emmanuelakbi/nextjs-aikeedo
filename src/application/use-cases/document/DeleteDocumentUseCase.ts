/**
 * Delete Document Use Case
 * Requirements: Content Management 2.2
 */

import { DocumentRepositoryInterface } from '../../../domain/document/repositories/DocumentRepositoryInterface';

export interface DeleteDocumentInput {
  documentId: string;
  workspaceId: string;
}

export class DeleteDocumentUseCase {
  constructor(private documentRepository: DocumentRepositoryInterface) {}

  async execute(input: DeleteDocumentInput): Promise<void> {
    const document = await this.documentRepository.findById(input.documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify document belongs to workspace
    if (!document.belongsToWorkspace(input.workspaceId)) {
      throw new Error('Document does not belong to workspace');
    }

    await this.documentRepository.delete(input.documentId);
  }
}
