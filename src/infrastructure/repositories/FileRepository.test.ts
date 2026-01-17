/**
 * File Repository Tests
 * Requirements: Content Management 1.1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileRepository } from './FileRepository';
import { FileEntity } from '../../domain/file/entities/File';
import { prisma } from '../../lib/db';
import {
  createTestFixtures,
  type TestFixtures,
} from '../../lib/testing/test-fixtures';

describe('FileRepository', () => {
  let repository: FileRepository;
  let testFileIds: string[] = [];
  let fixtures: TestFixtures;

  beforeEach(async () => {
    repository = new FileRepository(prisma);
    fixtures = await createTestFixtures();
  });

  afterEach(async () => {
    if (testFileIds.length > 0) {
      await prisma.file.deleteMany({
        where: { id: { in: testFileIds } },
      });
      testFileIds = [];
    }
    await fixtures.cleanup();
  });

  describe('save', () => {
    it('should save a new file', async () => {
      const fileProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
        url: 'https://example.com/test.jpg',
        storageKey: `test/${crypto.randomUUID()}.jpg`,
        metadata: { width: 100, height: 100 },
        createdAt: new Date(),
      };

      const file = new FileEntity(fileProps);
      const saved = await repository.save(file);
      testFileIds.push(saved.getId());

      expect(saved.getId()).toBe(fileProps.id);
      expect(saved.getName()).toBe(fileProps.name);
    });
  });

  describe('findById', () => {
    it('should find a file by id', async () => {
      const fileProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        name: 'find-test.jpg',
        type: 'image/jpeg',
        size: 2048,
        url: 'https://example.com/find-test.jpg',
        storageKey: 'test/find-test.jpg',
        metadata: {},
        createdAt: new Date(),
      };

      const file = new FileEntity(fileProps);
      await repository.save(file);
      testFileIds.push(file.getId());

      const found = await repository.findById(file.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(file.getId());
    });

    it('should return null for non-existent file', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const fileProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        name: 'exists-test.jpg',
        type: 'image/jpeg',
        size: 1024,
        url: 'https://example.com/exists-test.jpg',
        storageKey: 'test/exists-test.jpg',
        metadata: {},
        createdAt: new Date(),
      };

      const file = new FileEntity(fileProps);
      await repository.save(file);
      testFileIds.push(file.getId());

      const exists = await repository.exists(file.getId());
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });
});
