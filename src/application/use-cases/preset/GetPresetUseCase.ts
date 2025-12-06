import { Preset } from '../../../domain/preset/entities/Preset';
import { IPresetRepository } from '../../../domain/preset/repositories/IPresetRepository';
import { GetPresetCommand } from '../../commands/preset/GetPresetCommand';

/**
 * GetPresetUseCase
 *
 * Handles retrieving a single preset by ID.
 * Requirements: 9.3
 */

export class GetPresetUseCase {
  constructor(private readonly presetRepository: IPresetRepository) {}

  async execute(command: GetPresetCommand): Promise<Preset> {
    // Find preset by ID
    // Requirements: 9.3
    const preset = await this.presetRepository.findById(command.id);

    if (!preset) {
      throw new Error('Preset not found');
    }

    // If workspaceId is provided, verify access
    if (command.workspaceId) {
      if (!preset.isAccessibleToWorkspace(command.workspaceId)) {
        throw new Error(
          'Access denied: Preset not accessible to this workspace'
        );
      }
    }

    // Increment usage count when preset is retrieved
    // Requirements: 9.5
    await this.presetRepository.incrementUsageCount(command.id);

    return preset;
  }
}
