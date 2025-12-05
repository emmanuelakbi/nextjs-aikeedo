/**
 * File Repository Interface
 * Requirements: Content Management 1.1
 */

import { FileEntity } from '../entities/File';

export interface FileRepositoryInterface {
  /**
   * Save a file record
   */
  save(file: FileEntity): Promise<FileEntity>;

  /**
   * Find a file by ID
   */
  findById(id: string): Promise<FileEntity | null>;

  /**
   * Find files by workspace ID
   */
  findByWorkspaceId(
    workspaceId: string,
    options?: {
      userId?: string;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<FileEntity[]>;

  /**
   * Count files by workspace ID
   */
  countByWorkspaceId(
    workspaceId: string,
    options?: {
      userId?: string;
      type?: string;
    }
  ): Promise<number>;

  /**
   * Delete a file record
   */
  delete(id: string): Promise<void>;

  /**
   * Check if file exists
   */
  exists(id: string): Promise<boolean>;
}
