/**
 * Preset Entity Tests
 * Requirements: Content Management 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { Preset } from '../entities/Preset';

describe('Preset', () => {
  const mockCreateProps = {
    workspaceId: '123e4567-e89b-42d3-a456-426614174001',
    name: 'Test Preset',
    description: 'A test preset',
    category: 'content',
    template: 'Write a blog post about {{topic}}',
    model: 'gpt-4',
    parameters: { temperature: 0.7, maxTokens: 1000 },
    isPublic: false,
  };

  describe('create', () => {
    it('should create a preset with valid data', () => {
      const preset = Preset.create(mockCreateProps);

      expect(preset.getName()).toBe(mockCreateProps.name);
      expect(preset.getDescription()).toBe(mockCreateProps.description);
      expect(preset.getCategory()).toBe(mockCreateProps.category);
      expect(preset.getTemplate()).toBe(mockCreateProps.template);
      expect(preset.getModel()).toBe(mockCreateProps.model);
      expect(preset.getParameters()).toEqual(mockCreateProps.parameters);
      expect(preset.getIsPublic()).toBe(mockCreateProps.isPublic);
      expect(preset.getUsageCount()).toBe(0);
    });

    it('should create a system preset when workspaceId is null', () => {
      const preset = Preset.create({
        ...mockCreateProps,
        workspaceId: null,
        isPublic: true,
      });

      expect(preset.isSystemPreset()).toBe(true);
      expect(preset.getWorkspaceId()).toBeNull();
    });

    it('should throw error when name is empty', () => {
      expect(() => Preset.create({ ...mockCreateProps, name: '' })).toThrow(
        'Preset name is required'
      );
    });

    it('should throw error when description is empty', () => {
      expect(() =>
        Preset.create({ ...mockCreateProps, description: '' })
      ).toThrow('Preset description is required');
    });

    it('should throw error when category is empty', () => {
      expect(() => Preset.create({ ...mockCreateProps, category: '' })).toThrow(
        'Preset category is required'
      );
    });

    it('should throw error when template is empty', () => {
      expect(() => Preset.create({ ...mockCreateProps, template: '' })).toThrow(
        'Preset template is required'
      );
    });

    it('should throw error when model is empty', () => {
      expect(() => Preset.create({ ...mockCreateProps, model: '' })).toThrow(
        'Model is required'
      );
    });

    it('should trim whitespace from fields', () => {
      const preset = Preset.create({
        ...mockCreateProps,
        name: '  Test Preset  ',
        description: '  A test preset  ',
        category: '  content  ',
        template: '  Write a blog post  ',
      });

      expect(preset.getName()).toBe('Test Preset');
      expect(preset.getDescription()).toBe('A test preset');
      expect(preset.getCategory()).toBe('content');
      expect(preset.getTemplate()).toBe('Write a blog post');
    });
  });

  describe('update', () => {
    it('should update preset name', () => {
      const preset = Preset.create(mockCreateProps);
      const newName = 'Updated Preset';

      preset.update({ name: newName });

      expect(preset.getName()).toBe(newName);
    });

    it('should update preset description', () => {
      const preset = Preset.create(mockCreateProps);
      const newDescription = 'Updated description';

      preset.update({ description: newDescription });

      expect(preset.getDescription()).toBe(newDescription);
    });

    it('should update preset category', () => {
      const preset = Preset.create(mockCreateProps);
      const newCategory = 'marketing';

      preset.update({ category: newCategory });

      expect(preset.getCategory()).toBe(newCategory);
    });

    it('should update preset template', () => {
      const preset = Preset.create(mockCreateProps);
      const newTemplate = 'New template {{variable}}';

      preset.update({ template: newTemplate });

      expect(preset.getTemplate()).toBe(newTemplate);
    });

    it('should update preset model', () => {
      const preset = Preset.create(mockCreateProps);
      const newModel = 'gpt-3.5-turbo';

      preset.update({ model: newModel });

      expect(preset.getModel()).toBe(newModel);
    });

    it('should update preset parameters', () => {
      const preset = Preset.create(mockCreateProps);
      const newParameters = { temperature: 0.9, maxTokens: 2000 };

      preset.update({ parameters: newParameters });

      expect(preset.getParameters()).toEqual(newParameters);
    });

    it('should update preset isPublic', () => {
      const preset = Preset.create(mockCreateProps);

      preset.update({ isPublic: true });

      expect(preset.getIsPublic()).toBe(true);
    });

    it('should throw error when updating name to empty', () => {
      const preset = Preset.create(mockCreateProps);

      expect(() => preset.update({ name: '' })).toThrow(
        'Preset name cannot be empty'
      );
    });

    it('should throw error when updating description to empty', () => {
      const preset = Preset.create(mockCreateProps);

      expect(() => preset.update({ description: '' })).toThrow(
        'Preset description cannot be empty'
      );
    });

    it('should update updatedAt timestamp', () => {
      const preset = Preset.create(mockCreateProps);
      const originalUpdatedAt = preset.getUpdatedAt();

      preset.update({ name: 'New Name' });

      expect(preset.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usage count', () => {
      const preset = Preset.create(mockCreateProps);
      const initialCount = preset.getUsageCount();

      preset.incrementUsageCount();

      expect(preset.getUsageCount()).toBe(initialCount + 1);
    });

    it('should update updatedAt timestamp when incrementing', () => {
      const preset = Preset.create(mockCreateProps);
      const originalUpdatedAt = preset.getUpdatedAt();

      preset.incrementUsageCount();

      expect(preset.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('workspace checks', () => {
    it('should check if preset belongs to workspace', () => {
      const preset = Preset.create(mockCreateProps);

      expect(preset.belongsToWorkspace(mockCreateProps.workspaceId)).toBe(true);
      expect(preset.belongsToWorkspace('different-workspace-id')).toBe(false);
    });

    it('should check if preset is accessible to workspace', () => {
      const workspacePreset = Preset.create(mockCreateProps);
      expect(
        workspacePreset.isAccessibleToWorkspace(mockCreateProps.workspaceId)
      ).toBe(true);
      expect(
        workspacePreset.isAccessibleToWorkspace('different-workspace-id')
      ).toBe(false);
    });

    it('should make public system presets accessible to all workspaces', () => {
      const systemPreset = Preset.create({
        ...mockCreateProps,
        workspaceId: null,
        isPublic: true,
      });

      expect(systemPreset.isAccessibleToWorkspace('any-workspace-id')).toBe(
        true
      );
    });

    it('should not make private system presets accessible to workspaces', () => {
      const systemPreset = Preset.create({
        ...mockCreateProps,
        workspaceId: null,
        isPublic: false,
      });

      expect(systemPreset.isAccessibleToWorkspace('any-workspace-id')).toBe(
        false
      );
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const preset = Preset.create(mockCreateProps);
      const persistence = preset.toPersistence();

      expect(persistence.name).toBe(mockCreateProps.name);
      expect(persistence.description).toBe(mockCreateProps.description);
      expect(persistence.category).toBe(mockCreateProps.category);
      expect(persistence.template).toBe(mockCreateProps.template);
      expect(persistence.model).toBe(mockCreateProps.model);
      expect(persistence.parameters).toEqual(mockCreateProps.parameters);
      expect(persistence.isPublic).toBe(mockCreateProps.isPublic);
      expect(persistence.usageCount).toBe(0);
    });
  });
});
