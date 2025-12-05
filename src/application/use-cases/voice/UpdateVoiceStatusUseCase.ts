/**
 * Update Voice Status Use Case
 * Requirements: Content Management 4.1, 4.2
 */

import { VoiceEntity } from '../../../domain/voice/entities/Voice';
import { VoiceRepositoryInterface } from '../../../domain/voice/repositories/VoiceRepositoryInterface';
import { UpdateVoiceStatusCommand } from '../../commands/voice/UpdateVoiceStatusCommand';

export class UpdateVoiceStatusUseCase {
  constructor(private voiceRepository: VoiceRepositoryInterface) {}

  async execute(command: UpdateVoiceStatusCommand): Promise<VoiceEntity> {
    const { voiceId, status, modelId } = command;

    // Find voice
    const voice = await this.voiceRepository.findById(voiceId);
    if (!voice) {
      throw new Error('Voice not found');
    }

    // Update status
    if (status === 'READY') {
      if (!modelId) {
        throw new Error('Model ID is required when marking voice as ready');
      }
      voice.markAsReady(modelId);
    } else if (status === 'FAILED') {
      voice.markAsFailed();
    }

    // Save updated voice
    return this.voiceRepository.save(voice);
  }
}
