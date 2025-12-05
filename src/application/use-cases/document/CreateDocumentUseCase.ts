/**
 * Create Document Use Case
 * Requirements: Content Management 2.1
 */

import { randomUUID } from 'crypto';
import {
  DocumentEntity,
  DocumentType,
} from '../../../domain/document/entities/Document';
import { DocumentRepositoryInterface } from '../../../domain/document/repositories/DocumentRepositoryInterface';

export interface CreateDocumentInput {
  workspaceId: string;
  userId: string;
  title: string;
  content: string;
  type: DocumentType;
  fileId?: string;
  generationId?: string;
}

export class CreateDocumentUseCase {
  constructor(private documentRepository: DocumentRepositoryInterface) {}

  async execute(input: CreateDocumentInput): Promise<DocumentEntity> {
    const now = new Date();

    const document = new DocumentEntity({
      id: randomUUID(),
      workspaceId: input.workspaceId,
      userId: input.userId,
      title: input.title,
      content: input.content,
      type: input.type,
      fileId: input.fileId ?? null,
      generationId: input.generationId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return this.documentRepository.save(document);
  }
}
