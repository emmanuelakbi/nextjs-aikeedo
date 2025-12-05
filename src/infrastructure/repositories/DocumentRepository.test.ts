/**
 * Document Repository Tests
 * Requirements: Content Management 2.1, 2.2, 2.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocumentRepository } from './DocumentRepository';
import { DocumentEntity } from '../../domain/document/entities/Document';
import { prisma } from '../../lib/db';
import { createTestFixtures, type TestFixtures } from '../../lib/testing/test-fixtures';

describe('DocumentRepository', () => {
  let repository: DocumentRepository;
  let testDocumentIds: string[] = [];
  let fixtures: TestFixtures;

  beforeEach(async () => {
    repository = new DocumentRepository();
    fixtures = await createTestFixtures();
  });

  afterEach(async () => {
    if (testDocumentIds.length > 0) {
      await prisma.document.deleteMany({
        where: { id: { in: testDocumentIds } },
      });
      testDocumentIds = [];
    }
    await fixtures.cleanup();
  });

  describe('save', () => {
    it('should save a new document', async () => {
      const documentProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        title: 'Test Document',
        content: 'Test content',
        type: 'TEXT' as const,
        fileId: null,
        generationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const document = new DocumentEntity(documentProps);
      const saved = await repository.save(document);
      testDocumentIds.push(saved.getId());

      expect(saved.getId()).toBe(documentProps.id);
      expect(saved.getTitle()).toBe(documentProps.title);
    });
  });

  describe('findById', () => {
    it('should find a document by id', async () => {
      const documentProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        title: 'Find Test',
        content: 'Find test content',
        type: 'TEXT' as const,
        fileId: null,
        generationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const document = new DocumentEntity(documentProps);
      await repository.save(document);
      testDocumentIds.push(document.getId());

      const found = await repository.findById(document.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(document.getId());
    });

    it('should return null for non-existent document', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing document', async () => {
      const documentProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        title: 'Exists Test',
        content: 'Exists test content',
        type: 'TEXT' as const,
        fileId: null,
        generationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const document = new DocumentEntity(documentProps);
      await repository.save(document);
      testDocumentIds.push(document.getId());

      const exists = await repository.exists(document.getId());
      expect(exists).toBe(true);
    });

    it('should return false for non-existent document', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });
});
