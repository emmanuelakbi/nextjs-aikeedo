/**
 * Voice Repository Interface
 * Requirements: Content Management 4.1
 */

import { VoiceEntity, VoiceStatus } from '../entities/Voice';

export interface VoiceRepositoryInterface {
  /**
   * Save a voice record
   */
  save(voice: VoiceEntity): Promise<VoiceEntity>;

  /**
   * Find a voice by ID
   */
  findById(id: string): Promise<VoiceEntity | null>;

  /**
   * Find voices by workspace ID
   */
  findByWorkspaceId(
    workspaceId: string,
    options?: {
      status?: VoiceStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<VoiceEntity[]>;

  /**
   * Count voices by workspace ID
   */
  countByWorkspaceId(
    workspaceId: string,
    options?: {
      status?: VoiceStatus;
    }
  ): Promise<number>;

  /**
   * Delete a voice record
   */
  delete(id: string): Promise<void>;

  /**
   * Check if voice exists
   */
  exists(id: string): Promise<boolean>;
}
