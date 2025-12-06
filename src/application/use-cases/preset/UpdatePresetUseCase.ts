import { Preset } from '../../../domain/preset/entities/Preset';
import { IPresetRepository } from '../../../domain/preset/repositories/IPresetRepository';
import { UpdatePresetCommand } from '../../commands/preset/UpdatePresetCommand';

/**
 * UpdatePresetUseCase
 *
 * Handles updating an existing preset.
 * Requirements: 9.4
 */

export class UpdatePresetUseCase {
  constructor(private readonly presetRepository: IPresetRepository) {}

  async execute(command: UpdatePresetCommand): Promise<Preset> {
    // Find existing preset
    const preset = await this.presetRepository.findById(command.id);

    if (!preset) {
      throw new Error('Preset not found');
    }

    // System presets cannot be updated
    if (preset.isSystemPreset()) {
      throw new Error('System presets cannot be modified');
    }

    // Update preset entity
    // Requirements: 9.4
    preset.update({
      name: command.name,
      description: command.description,
      category: command.category,
      template: command.template,
      model: command.model,
      parameters: command.parameters,
      isPublic: command.isPublic,
    });

    // Save to database
    const updatedPreset = await this.presetRepository.save(preset);

    return updatedPreset;
  }
}
