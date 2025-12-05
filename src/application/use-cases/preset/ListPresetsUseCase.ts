import { Preset } from '../../../domain/preset/entities/Preset';
import { PresetRepository } from '../../../infrastructure/repositories/PresetRepository';
import { ListPresetsCommand } from '../../commands/preset/ListPresetsCommand';

/**
 * ListPresetsUseCase
 *
 * Handles listing presets with optional filters.
 * Requirements: 9.2
 */

export class ListPresetsUseCase {
  constructor(private readonly presetRepository: PresetRepository) {}

  async execute(command: ListPresetsCommand): Promise<Preset[]> {
    // List presets with filters
    // Requirements: 9.2
    const presets = await this.presetRepository.list({
      workspaceId: command.workspaceId,
      category: command.category,
      includeSystemPresets: command.includeSystemPresets ?? true,
      limit: command.limit,
      offset: command.offset,
    });

    return presets;
  }
}
