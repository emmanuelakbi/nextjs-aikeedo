/**
 * Delete Voice Use Case
 * Requirements: Content Management 4.3
 */

import { VoiceRepositoryInterface } from '../../../domain/voice/repositories/VoiceRepositoryInterface';

export interface DeleteVoiceCommand {
  voiceId: string;
  workspaceId: string;
}

export class DeleteVoiceUseCase {
  constructor(private voiceRepository: VoiceRepositoryInterface) {}

  async execute(command: DeleteVoiceCommand): Promise<void> {
    const { voiceId, workspaceId } = command;

    // Find voice
    const voice = await this.voiceRepository.findById(voiceId);
    if (!voice) {
      throw new Error('Voice not found');
    }

    // Verify voice belongs to workspace
    if (!voice.belongsToWorkspace(workspaceId)) {
      throw new Error('Voice does not belong to this workspace');
    }

    // Delete voice
    await this.voiceRepository.delete(voiceId);

    // TODO: Clean up voice model from external service if needed
  }
}
