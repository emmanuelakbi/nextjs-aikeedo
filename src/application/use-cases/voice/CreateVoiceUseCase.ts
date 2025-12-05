/**
 * Create Voice Use Case
 * Requirements: Content Management 4.1, 4.2
 */

import { randomUUID } from 'crypto';
import { VoiceEntity } from '../../../domain/voice/entities/Voice';
import { VoiceRepositoryInterface } from '../../../domain/voice/repositories/VoiceRepositoryInterface';
import { FileRepositoryInterface } from '../../../domain/file/repositories/FileRepositoryInterface';
import { CreateVoiceCommand } from '../../commands/voice/CreateVoiceCommand';

export class CreateVoiceUseCase {
  constructor(
    private voiceRepository: VoiceRepositoryInterface,
    private fileRepository: FileRepositoryInterface
  ) {}

  async execute(command: CreateVoiceCommand): Promise<VoiceEntity> {
    const { workspaceId, name, description, sampleFileId } = command;

    // Verify sample file exists and is audio
    const sampleFile = await this.fileRepository.findById(sampleFileId);
    if (!sampleFile) {
      throw new Error('Sample file not found');
    }

    if (!sampleFile.isAudio()) {
      throw new Error('Sample file must be an audio file');
    }

    if (!sampleFile.belongsToWorkspace(workspaceId)) {
      throw new Error('Sample file does not belong to this workspace');
    }

    // Create voice entity with TRAINING status
    const voice = new VoiceEntity({
      id: randomUUID(),
      workspaceId,
      name,
      description,
      sampleFileId,
      modelId: null,
      status: 'TRAINING',
      createdAt: new Date(),
    });

    // Save voice to database
    const savedVoice = await this.voiceRepository.save(voice);

    // TODO: Trigger voice training job (e.g., queue job to train voice model)
    // This would typically involve:
    // 1. Sending the audio file to a voice cloning service (e.g., ElevenLabs, Play.ht)
    // 2. Waiting for the training to complete
    // 3. Updating the voice status to READY or FAILED

    return savedVoice;
  }
}
