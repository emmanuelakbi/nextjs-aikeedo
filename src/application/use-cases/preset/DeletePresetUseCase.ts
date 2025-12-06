import { IPresetRepository } from '../../../domain/preset/repositories/IPresetRepository';
import { DeletePresetCommand } from '../../commands/preset/DeletePresetCommand';

/**
 * DeletePresetUseCase
 *
 * Handles deletion of a preset.
 * Requirements: 9.5
 */

export class DeletePresetUseCase {
  constructor(private readonly presetRepository: IPresetRepository) {}

  async execute(command: DeletePresetCommand): Promise<void> {
    // Find existing preset
    const preset = await this.presetRepository.findById(command.id);

    if (!preset) {
      throw new Error('Preset not found');
    }

    // System presets cannot be deleted
    if (preset.isSystemPreset()) {
      throw new Error('System presets cannot be deleted');
    }

    // If workspaceId is provided, verify ownership
    if (command.workspaceId) {
      if (!preset.belongsToWorkspace(command.workspaceId)) {
        throw new Error(
          'Access denied: Preset does not belong to this workspace'
        );
      }
    }

    // Delete from database
    // Requirements: 9.5
    await this.presetRepository.delete(command.id);
  }
}
