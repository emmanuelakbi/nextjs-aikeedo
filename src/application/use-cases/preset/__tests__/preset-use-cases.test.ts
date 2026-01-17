import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreatePresetUseCase } from '../CreatePresetUseCase';
import { ListPresetsUseCase } from '../ListPresetsUseCase';
import { GetPresetUseCase } from '../GetPresetUseCase';
import { UpdatePresetUseCase } from '../UpdatePresetUseCase';
import { DeletePresetUseCase } from '../DeletePresetUseCase';
import { PresetRepository } from '../../../../infrastructure/repositories/PresetRepository';
import { WorkspaceRepository } from '../../../../infrastructure/repositories/WorkspaceRepository';
import { Preset } from '../../../../domain/preset/entities/Preset';
import { Workspace } from '../../../../domain/workspace/entities/Workspace';

describe('Preset Use Cases', () => {
  let presetRepository: PresetRepository;
  let workspaceRepository: WorkspaceRepository;

  beforeEach(() => {
    presetRepository = new PresetRepository();
    workspaceRepository = new WorkspaceRepository();
  });

  describe('CreatePresetUseCase', () => {
    it('should create a preset successfully', async () => {
      const useCase = new CreatePresetUseCase(
        presetRepository,
        workspaceRepository
      );

      const mockWorkspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: '123e4567-e89b-42d3-a456-426614174000',
        creditCount: 100,
      });

      vi.spyOn(workspaceRepository, 'findById').mockResolvedValue(
        mockWorkspace
      );
      vi.spyOn(presetRepository, 'save').mockImplementation(
        async (preset) => preset
      );

      const command = {
        workspaceId: mockWorkspace.getId().getValue(),
        name: 'Blog Post Writer',
        description: 'Generate engaging blog posts',
        category: 'Content Writing',
        template: 'Write a blog post about {topic}',
        model: 'gpt-4',
        parameters: { temperature: 0.7, maxTokens: 1000 },
        isPublic: false,
      };

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Preset);
      expect(result.getName()).toBe('Blog Post Writer');
      expect(result.getCategory()).toBe('Content Writing');
      expect(result.getModel()).toBe('gpt-4');
    });

    it('should create a system preset without workspace', async () => {
      const useCase = new CreatePresetUseCase(
        presetRepository,
        workspaceRepository
      );

      vi.spyOn(presetRepository, 'save').mockImplementation(
        async (preset) => preset
      );

      const command = {
        workspaceId: null,
        name: 'Email Writer',
        description: 'Write professional emails',
        category: 'Communication',
        template: 'Write an email about {subject}',
        model: 'gpt-4',
        isPublic: true,
      };

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Preset);
      expect(result.isSystemPreset()).toBe(true);
      expect(result.getIsPublic()).toBe(true);
    });

    it('should throw error if workspace not found', async () => {
      const useCase = new CreatePresetUseCase(
        presetRepository,
        workspaceRepository
      );

      vi.spyOn(workspaceRepository, 'findById').mockResolvedValue(null);

      const command = {
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        name: 'Test Preset',
        description: 'Test description',
        category: 'Test',
        template: 'Test template',
        model: 'gpt-4',
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Workspace not found'
      );
    });
  });

  describe('ListPresetsUseCase', () => {
    it('should list presets for a workspace', async () => {
      const useCase = new ListPresetsUseCase(presetRepository);

      const mockPresets = [
        Preset.create({
          workspaceId: '123e4567-e89b-42d3-a456-426614174000',
          name: 'Preset 1',
          description: 'Description 1',
          category: 'Category A',
          template: 'Template 1',
          model: 'gpt-4',
        }),
        Preset.create({
          workspaceId: null,
          name: 'System Preset',
          description: 'System description',
          category: 'Category B',
          template: 'System template',
          model: 'gpt-4',
          isPublic: true,
        }),
      ];

      vi.spyOn(presetRepository, 'list').mockResolvedValue(mockPresets);

      const command = {
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        includeSystemPresets: true,
      };

      const result = await useCase.execute(command);

      expect(result).toHaveLength(2);
      const firstPreset = result[0];
      const secondPreset = result[1];
      if (firstPreset && secondPreset) {
        expect(firstPreset.getName()).toBe('Preset 1');
        expect(secondPreset.getName()).toBe('System Preset');
      }
    });

    it('should filter presets by category', async () => {
      const useCase = new ListPresetsUseCase(presetRepository);

      const mockPresets = [
        Preset.create({
          workspaceId: '123e4567-e89b-42d3-a456-426614174000',
          name: 'Preset 1',
          description: 'Description 1',
          category: 'Content Writing',
          template: 'Template 1',
          model: 'gpt-4',
        }),
      ];

      vi.spyOn(presetRepository, 'list').mockResolvedValue(mockPresets);

      const command = {
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        category: 'Content Writing',
      };

      const result = await useCase.execute(command);

      expect(result).toHaveLength(1);
      const firstPreset = result[0];
      if (firstPreset) {
        expect(firstPreset.getCategory()).toBe('Content Writing');
      }
    });
  });

  describe('GetPresetUseCase', () => {
    it('should retrieve a preset and increment usage count', async () => {
      const useCase = new GetPresetUseCase(presetRepository);

      const mockPreset = Preset.create({
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        name: 'Test Preset',
        description: 'Test description',
        category: 'Test',
        template: 'Test template',
        model: 'gpt-4',
      });

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(mockPreset);
      vi.spyOn(presetRepository, 'incrementUsageCount').mockResolvedValue(
        undefined
      );

      const command = {
        id: mockPreset.getId().getValue(),
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
      };

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Preset);
      expect(result.getName()).toBe('Test Preset');
      expect(presetRepository.incrementUsageCount).toHaveBeenCalledWith(
        mockPreset.getId().getValue()
      );
    });

    it('should throw error if preset not found', async () => {
      const useCase = new GetPresetUseCase(presetRepository);

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(null);

      const command = {
        id: '123e4567-e89b-42d3-a456-426614174000',
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Preset not found'
      );
    });

    it('should throw error if preset not accessible to workspace', async () => {
      const useCase = new GetPresetUseCase(presetRepository);

      const mockPreset = Preset.create({
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        name: 'Test Preset',
        description: 'Test description',
        category: 'Test',
        template: 'Test template',
        model: 'gpt-4',
        isPublic: false,
      });

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(mockPreset);

      const command = {
        id: mockPreset.getId().getValue(),
        workspaceId: '123e4567-e89b-42d3-a456-426614174999', // Different workspace
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Access denied: Preset not accessible to this workspace'
      );
    });
  });

  describe('UpdatePresetUseCase', () => {
    it('should update a preset successfully', async () => {
      const useCase = new UpdatePresetUseCase(presetRepository);

      const mockPreset = Preset.create({
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        name: 'Original Name',
        description: 'Original description',
        category: 'Original Category',
        template: 'Original template',
        model: 'gpt-4',
      });

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(mockPreset);
      vi.spyOn(presetRepository, 'save').mockImplementation(
        async (preset) => preset
      );

      const command = {
        id: mockPreset.getId().getValue(),
        name: 'Updated Name',
        description: 'Updated description',
      };

      const result = await useCase.execute(command);

      expect(result.getName()).toBe('Updated Name');
      expect(result.getDescription()).toBe('Updated description');
    });

    it('should throw error if preset not found', async () => {
      const useCase = new UpdatePresetUseCase(presetRepository);

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(null);

      const command = {
        id: '123e4567-e89b-42d3-a456-426614174000',
        name: 'Updated Name',
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Preset not found'
      );
    });

    it('should throw error when trying to update system preset', async () => {
      const useCase = new UpdatePresetUseCase(presetRepository);

      const mockPreset = Preset.create({
        workspaceId: null,
        name: 'System Preset',
        description: 'System description',
        category: 'System',
        template: 'System template',
        model: 'gpt-4',
        isPublic: true,
      });

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(mockPreset);

      const command = {
        id: mockPreset.getId().getValue(),
        name: 'Updated Name',
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'System presets cannot be modified'
      );
    });
  });

  describe('DeletePresetUseCase', () => {
    it('should delete a preset successfully', async () => {
      const useCase = new DeletePresetUseCase(presetRepository);

      const workspaceId = '123e4567-e89b-42d3-a456-426614174000';
      const mockPreset = Preset.create({
        workspaceId,
        name: 'Test Preset',
        description: 'Test description',
        category: 'Test',
        template: 'Test template',
        model: 'gpt-4',
      });

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(mockPreset);
      vi.spyOn(presetRepository, 'delete').mockResolvedValue(undefined);

      const command = {
        id: mockPreset.getId().getValue(),
        workspaceId,
      };

      await useCase.execute(command);

      expect(presetRepository.delete).toHaveBeenCalledWith(
        mockPreset.getId().getValue()
      );
    });

    it('should throw error if preset not found', async () => {
      const useCase = new DeletePresetUseCase(presetRepository);

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(null);

      const command = {
        id: '123e4567-e89b-42d3-a456-426614174000',
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Preset not found'
      );
    });

    it('should throw error when trying to delete system preset', async () => {
      const useCase = new DeletePresetUseCase(presetRepository);

      const mockPreset = Preset.create({
        workspaceId: null,
        name: 'System Preset',
        description: 'System description',
        category: 'System',
        template: 'System template',
        model: 'gpt-4',
        isPublic: true,
      });

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(mockPreset);

      const command = {
        id: mockPreset.getId().getValue(),
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'System presets cannot be deleted'
      );
    });

    it('should throw error if preset does not belong to workspace', async () => {
      const useCase = new DeletePresetUseCase(presetRepository);

      const mockPreset = Preset.create({
        workspaceId: '123e4567-e89b-42d3-a456-426614174000',
        name: 'Test Preset',
        description: 'Test description',
        category: 'Test',
        template: 'Test template',
        model: 'gpt-4',
      });

      vi.spyOn(presetRepository, 'findById').mockResolvedValue(mockPreset);

      const command = {
        id: mockPreset.getId().getValue(),
        workspaceId: '123e4567-e89b-42d3-a456-426614174999', // Different workspace
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Access denied: Preset does not belong to this workspace'
      );
    });
  });
});
