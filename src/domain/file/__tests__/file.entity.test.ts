/**
 * File Entity Tests
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect } from 'vitest';
import { FileEntity } from '../entities/File';

describe('FileEntity', () => {
  const mockFileProps = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    workspaceId: '123e4567-e89b-42d3-a456-426614174001',
    userId: '123e4567-e89b-42d3-a456-426614174002',
    name: 'test-file.jpg',
    type: 'image/jpeg',
    size: 1024000,
    url: 'https://example.com/files/test-file.jpg',
    storageKey: 'workspace-1/test-file.jpg',
    metadata: { width: 1920, height: 1080 },
    createdAt: new Date('2024-01-01'),
  };

  it('should create a file entity', () => {
    const file = new FileEntity(mockFileProps);

    expect(file.getId()).toBe(mockFileProps.id);
    expect(file.getName()).toBe(mockFileProps.name);
    expect(file.getType()).toBe(mockFileProps.type);
    expect(file.getSize()).toBe(mockFileProps.size);
  });

  it('should check if file belongs to user', () => {
    const file = new FileEntity(mockFileProps);

    expect(file.belongsToUser(mockFileProps.userId)).toBe(true);
    expect(file.belongsToUser('different-user-id')).toBe(false);
  });

  it('should check if file belongs to workspace', () => {
    const file = new FileEntity(mockFileProps);

    expect(file.belongsToWorkspace(mockFileProps.workspaceId)).toBe(true);
    expect(file.belongsToWorkspace('different-workspace-id')).toBe(false);
  });

  it('should get file extension', () => {
    const file = new FileEntity(mockFileProps);
    expect(file.getExtension()).toBe('.jpg');

    const fileWithoutExt = new FileEntity({
      ...mockFileProps,
      name: 'noextension',
    });
    expect(fileWithoutExt.getExtension()).toBe('');
  });

  it('should identify image files', () => {
    const imageFile = new FileEntity(mockFileProps);
    expect(imageFile.isImage()).toBe(true);

    const pdfFile = new FileEntity({
      ...mockFileProps,
      type: 'application/pdf',
    });
    expect(pdfFile.isImage()).toBe(false);
  });

  it('should identify audio files', () => {
    const audioFile = new FileEntity({
      ...mockFileProps,
      type: 'audio/mpeg',
    });
    expect(audioFile.isAudio()).toBe(true);

    const imageFile = new FileEntity(mockFileProps);
    expect(imageFile.isAudio()).toBe(false);
  });

  it('should identify document files', () => {
    const pdfFile = new FileEntity({
      ...mockFileProps,
      type: 'application/pdf',
    });
    expect(pdfFile.isDocument()).toBe(true);

    const imageFile = new FileEntity(mockFileProps);
    expect(imageFile.isDocument()).toBe(false);
  });

  it('should convert to JSON', () => {
    const file = new FileEntity(mockFileProps);
    const json = file.toJSON();

    expect(json).toEqual(mockFileProps);
  });
});
