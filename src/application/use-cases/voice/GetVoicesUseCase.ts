/**
 * Get Voices Use Case
 * Requirements: Content Management 4.3
 */

import { VoiceEntity, VoiceStatus } from '../../../domain/voice/entities/Voice';
import { VoiceRepositoryInterface } from '../../../domain/voice/repositories/VoiceRepositoryInterface';

export interface GetVoicesQuery {
  workspaceId: string;
  status?: VoiceStatus;
  limit?: number;
  offset?: number;
}

export class GetVoicesUseCase {
  constructor(private voiceRepository: VoiceRepositoryInterface) {}

  async execute(query: GetVoicesQuery): Promise<{
    voices: VoiceEntity[];
    total: number;
  }> {
    const { workspaceId, status, limit, offset } = query;

    const [voices, total] = await Promise.all([
      this.voiceRepository.findByWorkspaceId(workspaceId, {
        status,
        limit,
        offset,
      }),
      this.voiceRepository.countByWorkspaceId(workspaceId, { status }),
    ]);

    return { voices, total };
  }
}
