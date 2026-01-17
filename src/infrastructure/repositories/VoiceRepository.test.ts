/**
 * Voice Repository Tests
 * Requirements: Content Management 4.1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VoiceRepository } from './VoiceRepository';
import { VoiceEntity } from '../../domain/voice/entities/Voice';
import { FileEntity } from '../../domain/file/entities/File';
import { FileRepository } from './FileRepository';
import { prisma } from '../../lib/db';
import {
  createTestFixtures,
  type TestFixtures,
} from '../../lib/testing/test-fixtures';

describe('VoiceRepository', () => {
  let repository: VoiceRepository;
  let fileRepository: FileRepository;
  let testVoiceIds: string[] = [];
  let testFileIds: string[] = [];
  let fixtures: TestFixtures;

  beforeEach(async () => {
    repository = new VoiceRepository(prisma);
    fileRepository = new FileRepository(prisma);
    fixtures = await createTestFixtures();
  });

  afterEach(async () => {
    if (testVoiceIds.length > 0) {
      await prisma.voice.deleteMany({
        where: { id: { in: testVoiceIds } },
      });
      testVoiceIds = [];
    }
    if (testFileIds.length > 0) {
      await prisma.file.deleteMany({
        where: { id: { in: testFileIds } },
      });
      testFileIds = [];
    }
    await fixtures.cleanup();
  });

  describe('save', () => {
    it('should save a new voice', async () => {
      // Create a sample file first
      const fileProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        name: 'sample.mp3',
        type: 'audio/mpeg',
        size: 2048,
        url: 'https://example.com/sample.mp3',
        storageKey: `samples/${crypto.randomUUID()}.mp3`,
        metadata: {},
        createdAt: new Date(),
      };
      const file = new FileEntity(fileProps);
      await fileRepository.save(file);
      testFileIds.push(file.getId());

      const voiceProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        name: 'Test Voice',
        description: 'Test description',
        sampleFileId: file.getId(),
        modelId: null,
        status: 'TRAINING' as const,
        createdAt: new Date(),
      };

      const voice = new VoiceEntity(voiceProps);
      const saved = await repository.save(voice);
      testVoiceIds.push(saved.getId());

      expect(saved.getId()).toBe(voiceProps.id);
      expect(saved.getName()).toBe(voiceProps.name);
    });
  });

  describe('findById', () => {
    it('should find a voice by id', async () => {
      // Create a sample file first
      const fileProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        name: 'find-sample.mp3',
        type: 'audio/mpeg',
        size: 2048,
        url: 'https://example.com/find-sample.mp3',
        storageKey: `samples/${crypto.randomUUID()}.mp3`,
        metadata: {},
        createdAt: new Date(),
      };
      const file = new FileEntity(fileProps);
      await fileRepository.save(file);
      testFileIds.push(file.getId());

      const voiceProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        name: 'Find Test Voice',
        description: 'Find test description',
        sampleFileId: file.getId(),
        modelId: null,
        status: 'TRAINING' as const,
        createdAt: new Date(),
      };

      const voice = new VoiceEntity(voiceProps);
      await repository.save(voice);
      testVoiceIds.push(voice.getId());

      const found = await repository.findById(voice.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(voice.getId());
    });

    it('should return null for non-existent voice', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing voice', async () => {
      // Create a sample file first
      const fileProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        userId: fixtures.user.id,
        name: 'exists-sample.mp3',
        type: 'audio/mpeg',
        size: 2048,
        url: 'https://example.com/exists-sample.mp3',
        storageKey: `samples/${crypto.randomUUID()}.mp3`,
        metadata: {},
        createdAt: new Date(),
      };
      const file = new FileEntity(fileProps);
      await fileRepository.save(file);
      testFileIds.push(file.getId());

      const voiceProps = {
        id: crypto.randomUUID(),
        workspaceId: fixtures.workspace.id,
        name: 'Exists Test Voice',
        description: 'Exists test description',
        sampleFileId: file.getId(),
        modelId: null,
        status: 'TRAINING' as const,
        createdAt: new Date(),
      };

      const voice = new VoiceEntity(voiceProps);
      await repository.save(voice);
      testVoiceIds.push(voice.getId());

      const exists = await repository.exists(voice.getId());
      expect(exists).toBe(true);
    });

    it('should return false for non-existent voice', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });
});
