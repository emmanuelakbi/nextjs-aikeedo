/**
 * Preset Repository Tests
 * Requirements: Content Management 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PresetRepository } from './PresetRepository';
import { Preset } from '../../domain/preset/entities/Preset';
import { prisma } from '../../lib/db';
import {
  createTestFixtures,
  type TestFixtures,
} from '../../lib/testing/test-fixtures';

describe('PresetRepository', () => {
  let repository: PresetRepository;
  let testPresetIds: string[] = [];
  let fixtures: TestFixtures;

  beforeEach(async () => {
    repository = new PresetRepository();
    fixtures = await createTestFixtures();
  });

  afterEach(async () => {
    if (testPresetIds.length > 0) {
      await prisma.preset.deleteMany({
        where: { id: { in: testPresetIds } },
      });
      testPresetIds = [];
    }
    await fixtures.cleanup();
  });

  describe('create', () => {
    it('should create a new preset', async () => {
      const presetData = {
        workspaceId: fixtures.workspace.id,
        name: 'Test Preset',
        description: 'Test description',
        category: 'content',
        template: 'Test template',
        model: 'gpt-4',
        parameters: { temperature: 0.7 },
        isPublic: false,
      };

      const preset = await repository.create(presetData);
      testPresetIds.push(preset.getId().getValue());

      expect(preset.getName()).toBe(presetData.name);
      expect(preset.getDescription()).toBe(presetData.description);
    });
  });

  describe('findById', () => {
    it('should find a preset by id', async () => {
      const presetData = {
        workspaceId: crypto.randomUUID(),
        name: 'Find Test',
        description: 'Find test description',
        category: 'content',
        template: 'Find test template',
        model: 'gpt-4',
      };

      const created = await repository.create(presetData);
      testPresetIds.push(created.getId().getValue());

      const found = await repository.findById(created.getId().getValue());

      expect(found).not.toBeNull();
      expect(found?.getId().getValue()).toBe(created.getId().getValue());
    });

    it('should return null for non-existent preset', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a new preset', async () => {
      const preset = Preset.create({
        workspaceId: crypto.randomUUID(),
        name: 'Save Test',
        description: 'Save test description',
        category: 'content',
        template: 'Save test template',
        model: 'gpt-4',
      });

      const saved = await repository.save(preset);
      testPresetIds.push(saved.getId().getValue());

      expect(saved.getName()).toBe(preset.getName());
    });

    it('should update an existing preset', async () => {
      const preset = Preset.create({
        workspaceId: crypto.randomUUID(),
        name: 'Update Test',
        description: 'Update test description',
        category: 'content',
        template: 'Update test template',
        model: 'gpt-4',
      });

      const saved = await repository.save(preset);
      testPresetIds.push(saved.getId().getValue());

      preset.update({ name: 'Updated Name' });
      const updated = await repository.save(preset);

      expect(updated.getName()).toBe('Updated Name');
      expect(updated.getId().getValue()).toBe(saved.getId().getValue());
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usage count', async () => {
      const preset = Preset.create({
        workspaceId: crypto.randomUUID(),
        name: 'Usage Test',
        description: 'Usage test description',
        category: 'content',
        template: 'Usage test template',
        model: 'gpt-4',
      });

      const saved = await repository.save(preset);
      testPresetIds.push(saved.getId().getValue());

      await repository.incrementUsageCount(saved.getId().getValue());

      const found = await repository.findById(saved.getId().getValue());
      expect(found?.getUsageCount()).toBe(1);
    });
  });
});
