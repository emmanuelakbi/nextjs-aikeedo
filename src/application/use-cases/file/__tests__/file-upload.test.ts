/**
 * File Upload Use Case Tests
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UploadFileUseCase } from '../UploadFileUseCase';
import { FileRepositoryInterface } from '../../../../domain/file/repositories/FileRepositoryInterface';
import { FileEntity } from '../../../../domain/file/entities/File';
import { LocalStorage } from '../../../../lib/storage/local-storage';
import { randomUUID } from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;
  let fileRepository: FileRepositoryInterface;
  let storage: LocalStorage;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    testDir = path.join(process.cwd(), 'test-uploads', randomUUID());
    await fs.mkdir(testDir, { recursive: true });

    // Initialize storage
    storage = new LocalStorage({
      basePath: testDir,
      publicUrl: '/test-uploads',
    });

    // Mock repository
    fileRepository = {
      save: vi.fn(async (file: FileEntity) => file),
      findById: vi.fn(),
      findByWorkspaceId: vi.fn(),
      countByWorkspaceId: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    useCase = new UploadFileUseCase(fileRepository, storage);
  });

  it('should upload a valid image file', async () => {
    const workspaceId = randomUUID();
    const userId = randomUUID();
    const fileBuffer = Buffer.from('fake image data');

    const command = {
      workspaceId,
      userId,
      file: {
        name: 'test-image.jpg',
        type: 'image/jpeg',
        size: fileBuffer.length,
        buffer: fileBuffer,
      },
      metadata: { description: 'Test image' },
    };

    const result = await useCase.execute(command);

    expect(result.getId()).toBeDefined();
    expect(result.getWorkspaceId()).toBe(workspaceId);
    expect(result.getUserId()).toBe(userId);
    expect(result.getName()).toBe('test-image.jpg');
    expect(result.getType()).toBe('image/jpeg');
    expect(result.getSize()).toBe(fileBuffer.length);
    expect(result.getUrl()).toContain('test-image');
    expect(result.getMetadata()).toEqual({ description: 'Test image' });
  });

  it('should reject invalid file types', async () => {
    const workspaceId = randomUUID();
    const userId = randomUUID();
    const fileBuffer = Buffer.from('fake file data');

    const command = {
      workspaceId,
      userId,
      file: {
        name: 'test-file.exe',
        type: 'application/x-msdownload',
        size: fileBuffer.length,
        buffer: fileBuffer,
      },
    };

    await expect(useCase.execute(command)).rejects.toThrow(
      'File type not allowed'
    );
  });

  it('should reject files that are too large', async () => {
    const workspaceId = randomUUID();
    const userId = randomUUID();
    const largeSize = 11 * 1024 * 1024; // 11 MB (exceeds 10 MB limit for images)

    const command = {
      workspaceId,
      userId,
      file: {
        name: 'large-image.jpg',
        type: 'image/jpeg',
        size: largeSize,
        buffer: Buffer.alloc(largeSize),
      },
    };

    await expect(useCase.execute(command)).rejects.toThrow(
      'File size exceeds maximum'
    );
  });

  it('should handle audio files with correct size limits', async () => {
    const workspaceId = randomUUID();
    const userId = randomUUID();
    const fileBuffer = Buffer.from('fake audio data');

    const command = {
      workspaceId,
      userId,
      file: {
        name: 'test-audio.mp3',
        type: 'audio/mpeg',
        size: fileBuffer.length,
        buffer: fileBuffer,
      },
    };

    const result = await useCase.execute(command);

    expect(result.getName()).toBe('test-audio.mp3');
    expect(result.getType()).toBe('audio/mpeg');
    expect(result.isAudio()).toBe(true);
  });

  it('should handle document files', async () => {
    const workspaceId = randomUUID();
    const userId = randomUUID();
    const fileBuffer = Buffer.from('fake pdf data');

    const command = {
      workspaceId,
      userId,
      file: {
        name: 'test-document.pdf',
        type: 'application/pdf',
        size: fileBuffer.length,
        buffer: fileBuffer,
      },
    };

    const result = await useCase.execute(command);

    expect(result.getName()).toBe('test-document.pdf');
    expect(result.getType()).toBe('application/pdf');
    expect(result.isDocument()).toBe(true);
  });
});
