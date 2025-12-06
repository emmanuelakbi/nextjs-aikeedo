/**
 * Preset Repository Interface
 * 
 * Domain-level contract for preset data access operations.
 * This interface defines all operations needed to persist and retrieve presets
 * without exposing infrastructure implementation details.
 * 
 * @interface IPresetRepository
 */

import { Preset } from '../entities/Preset';
import { Id } from '../../user/value-objects/Id';

/**
 * Options for listing presets
 */
export interface ListPresetsOptions {
  workspaceId?: string | null;
  category?: string;
  isPublic?: boolean;
  includeSystemPresets?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Preset Repository Interface
 * 
 * Defines the contract for preset data access operations.
 * All implementations must provide these methods.
 */
export interface IPresetRepository {
  /**
   * Persist a preset entity (create or update)
   * 
   * @param preset - The preset entity to save
   * @returns Promise resolving to the saved preset
   */
  save(preset: Preset): Promise<Preset>;

  /**
   * Find a preset by its unique identifier
   * 
   * @param id - The preset's unique identifier
   * @returns Promise resolving to the preset or null if not found
   */
  findById(id: string): Promise<Preset | null>;

  /**
   * Find presets by workspace ID (includes system presets)
   * 
   * @param workspaceId - The workspace identifier
   * @returns Promise resolving to array of presets
   */
  findByWorkspaceId(workspaceId: string): Promise<Preset[]>;

  /**
   * Find presets by category
   * 
   * @param category - The preset category
   * @param workspaceId - Optional workspace identifier to include workspace-specific presets
   * @returns Promise resolving to array of presets
   */
  findByCategory(category: string, workspaceId?: string): Promise<Preset[]>;

  /**
   * Find all system presets (public presets with no workspace)
   * 
   * @returns Promise resolving to array of system presets
   */
  findSystemPresets(): Promise<Preset[]>;

  /**
   * List presets with optional filters
   * 
   * @param options - Query options (workspaceId, category, isPublic, includeSystemPresets, limit, offset)
   * @returns Promise resolving to array of presets
   */
  list(options?: ListPresetsOptions): Promise<Preset[]>;

  /**
   * Increment the usage count for a preset
   * 
   * @param id - The preset's unique identifier
   * @returns Promise resolving when increment is complete
   */
  incrementUsageCount(id: string): Promise<void>;

  /**
   * Delete a preset by its unique identifier
   * 
   * @param id - The preset's unique identifier
   * @returns Promise resolving when deletion is complete
   */
  delete(id: string): Promise<void>;
}
