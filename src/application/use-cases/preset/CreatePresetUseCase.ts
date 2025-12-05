import { Preset } from '../../../domain/preset/entities/Preset';
import { PresetRepository } from '../../../infrastructure/repositories/PresetRepository';
import { WorkspaceRepository } from '../../../infrastructure/repositories/WorkspaceRepository';
import { CreatePresetCommand } from '../../commands/preset/CreatePresetCommand';

/**
 * CreatePresetUseCase
 *
 * Handles creation of new presets.
 * Requirements: 9.1
 */

export class CreatePresetUseCase {
  constructor(
    private readonly presetRepository: PresetRepository,
    private readonly workspaceRepository: WorkspaceRepository
  ) {}

  async execute(command: CreatePresetCommand): Promise<Preset> {
    // If workspaceId is provided, verify the workspace exists
    if (command.workspaceId) {
      const workspace = await this.workspaceRepository.findById(
        command.workspaceId
      );
      if (!workspace) {
        throw new Error('Workspace not found');
      }
    }

    // Create preset entity
    // Requirements: 9.1
    const preset = Preset.create({
      workspaceId: command.workspaceId,
      name: command.name,
      description: command.description,
      category: command.category,
      template: command.template,
      model: command.model,
      parameters: command.parameters,
      isPublic: command.isPublic,
    });

    // Save to database
    const savedPreset = await this.presetRepository.save(preset);

    return savedPreset;
  }
}
