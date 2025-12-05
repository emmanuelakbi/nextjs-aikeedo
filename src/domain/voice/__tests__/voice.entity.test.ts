/**
 * Voice Entity Tests
 * Requirements: Content Management 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import { VoiceEntity } from '../entities/Voice';

describe('VoiceEntity', () => {
  const mockVoiceProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    workspaceId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Voice',
    description: 'A test voice',
    sampleFileId: '123e4567-e89b-12d3-a456-426614174002',
    modelId: null,
    status: 'TRAINING' as const,
    createdAt: new Date('2024-01-01'),
  };

  it('should create a voice entity', () => {
    const voice = new VoiceEntity(mockVoiceProps);

    expect(voice.getId()).toBe(mockVoiceProps.id);
    expect(voice.getName()).toBe(mockVoiceProps.name);
    expect(voice.getStatus()).toBe('TRAINING');
  });

  it('should check if voice belongs to workspace', () => {
    const voice = new VoiceEntity(mockVoiceProps);

    expect(voice.belongsToWorkspace(mockVoiceProps.workspaceId)).toBe(true);
    expect(voice.belongsToWorkspace('different-workspace-id')).toBe(false);
  });

  it('should check voice status', () => {
    const voice = new VoiceEntity(mockVoiceProps);

    expect(voice.isTraining()).toBe(true);
    expect(voice.isReady()).toBe(false);
    expect(voice.hasFailed()).toBe(false);
  });

  it('should mark voice as ready', () => {
    const voice = new VoiceEntity(mockVoiceProps);
    const modelId = 'model-123';

    voice.markAsReady(modelId);

    expect(voice.getStatus()).toBe('READY');
    expect(voice.getModelId()).toBe(modelId);
    expect(voice.isReady()).toBe(true);
    expect(voice.isTraining()).toBe(false);
  });

  it('should mark voice as failed', () => {
    const voice = new VoiceEntity(mockVoiceProps);

    voice.markAsFailed();

    expect(voice.getStatus()).toBe('FAILED');
    expect(voice.hasFailed()).toBe(true);
    expect(voice.isReady()).toBe(false);
  });

  it('should convert to JSON', () => {
    const voice = new VoiceEntity(mockVoiceProps);
    const json = voice.toJSON();

    expect(json).toEqual(mockVoiceProps);
  });
});
