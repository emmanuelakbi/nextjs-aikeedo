/**
 * Voice Service
 * Requirements: Content Management 4.4
 *
 * Handles voice cloning integration with speech synthesis providers
 */

import { VoiceRepositoryInterface } from '../../domain/voice/repositories/VoiceRepositoryInterface';
import { VoiceEntity } from '../../domain/voice/entities/Voice';

export interface VoiceServiceInterface {
  /**
   * Get ready voices for a workspace
   */
  getReadyVoices(workspaceId: string): Promise<VoiceEntity[]>;

  /**
   * Check if a voice is ready for use
   */
  isVoiceReady(voiceId: string): Promise<boolean>;

  /**
   * Get voice by ID
   */
  getVoice(voiceId: string): Promise<VoiceEntity | null>;

  /**
   * Validate voice belongs to workspace
   */
  validateVoiceAccess(voiceId: string, workspaceId: string): Promise<boolean>;
}

export class VoiceService implements VoiceServiceInterface {
  constructor(private voiceRepository: VoiceRepositoryInterface) {}

  async getReadyVoices(workspaceId: string): Promise<VoiceEntity[]> {
    return this.voiceRepository.findByWorkspaceId(workspaceId, {
      status: 'READY',
    });
  }

  async isVoiceReady(voiceId: string): Promise<boolean> {
    const voice = await this.voiceRepository.findById(voiceId);
    return voice?.isReady() ?? false;
  }

  async getVoice(voiceId: string): Promise<VoiceEntity | null> {
    return this.voiceRepository.findById(voiceId);
  }

  async validateVoiceAccess(
    voiceId: string,
    workspaceId: string
  ): Promise<boolean> {
    const voice = await this.voiceRepository.findById(voiceId);
    if (!voice) {
      return false;
    }
    return voice.belongsToWorkspace(workspaceId) && voice.isReady();
  }
}
