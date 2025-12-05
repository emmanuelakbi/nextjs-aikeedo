/**
 * Basic Document Use Cases Tests
 * Requirements: Content Management 2.1, 2.2, 2.3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CreateDocumentUseCase } from '../CreateDocumentUseCase';
import { GetDocumentUseCase } from '../GetDocumentUseCase';
import { UpdateDocumentUseCase } from '../UpdateDocumentUseCase';
import { DeleteDocumentUseCase } from '../DeleteDocumentUseCase';
import { DocumentRepository } from '../../../../infrastructure/repositories/DocumentRepository';
import { prisma } from '../../../../lib/db';
import { randomUUID } from 'crypto';

describe('Document Basic Operations', () => {
  let documentRepository: DocumentRepository;
  let testWorkspaceId: string;
  let testUserId: string;
  let testDocumentId: string;

  beforeAll(async () => {
    documentRepository = new DocumentRepository(prisma);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `test-doc-basic-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test workspace
    const testWorkspace = await prisma.workspace.create({
      data: {
        id: randomUUID(),
        name: 'Test Workspace',
        ownerId: testUserId,
      },
    });
    testWorkspaceId = testWorkspace.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testDocumentId) {
      await prisma.document.deleteMany({
        where: { workspaceId: testWorkspaceId },
      });
    }
    if (testWorkspaceId) {
      await prisma.workspace.delete({ where: { id: testWorkspaceId } });
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  it('should create, read, update, and delete a document', async () => {
    // CREATE
    const createUseCase = new CreateDocumentUseCase(documentRepository);
    const created = await createUseCase.execute({
      workspaceId: testWorkspaceId,
      userId: testUserId,
      title: 'Test Document',
      content: 'This is test content',
      type: 'TEXT',
    });

    testDocumentId = created.getId();

    expect(created.getId()).toBeDefined();
    expect(created.getTitle()).toBe('Test Document');
    expect(created.getContent()).toBe('This is test content');
    expect(created.getType()).toBe('TEXT');

    // READ
    const getUseCase = new GetDocumentUseCase(documentRepository);
    const retrieved = await getUseCase.execute({
      documentId: testDocumentId,
      workspaceId: testWorkspaceId,
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved?.getId()).toBe(testDocumentId);
    expect(retrieved?.getTitle()).toBe('Test Document');

    // UPDATE
    const updateUseCase = new UpdateDocumentUseCase(documentRepository);
    const updated = await updateUseCase.execute({
      documentId: testDocumentId,
      workspaceId: testWorkspaceId,
      title: 'Updated Title',
      content: 'Updated content',
    });

    expect(updated.getTitle()).toBe('Updated Title');
    expect(updated.getContent()).toBe('Updated content');

    // DELETE
    const deleteUseCase = new DeleteDocumentUseCase(documentRepository);
    await deleteUseCase.execute({
      documentId: testDocumentId,
      workspaceId: testWorkspaceId,
    });

    const exists = await documentRepository.exists(testDocumentId);
    expect(exists).toBe(false);
  });

  it('should handle document without file reference', async () => {
    const createUseCase = new CreateDocumentUseCase(documentRepository);

    const document = await createUseCase.execute({
      workspaceId: testWorkspaceId,
      userId: testUserId,
      title: 'Image Document',
      content: 'Generated image',
      type: 'IMAGE',
    });

    expect(document.getFileId()).toBeNull();
    expect(document.hasFile()).toBe(false);

    // Cleanup
    await prisma.document.delete({ where: { id: document.getId() } });
  });

  it('should handle document with generation reference', async () => {
    const createUseCase = new CreateDocumentUseCase(documentRepository);
    const generationId = randomUUID();

    const document = await createUseCase.execute({
      workspaceId: testWorkspaceId,
      userId: testUserId,
      title: 'AI Generated',
      content: 'AI generated content',
      type: 'TEXT',
      generationId,
    });

    expect(document.getGenerationId()).toBe(generationId);
    expect(document.isGenerated()).toBe(true);

    // Cleanup
    await prisma.document.delete({ where: { id: document.getId() } });
  });
});
