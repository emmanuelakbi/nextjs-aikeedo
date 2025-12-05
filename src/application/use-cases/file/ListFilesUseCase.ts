/**
 * List Files Use Case
 * Requirements: Content Management 1.1
 */

import { FileEntity } from '../../../domain/file/entities/File';
import { FileRepositoryInterface } from '../../../domain/file/repositories/FileRepositoryInterface';
import { ListFilesCommand } from '../../commands/file/ListFilesCommand';

export interface ListFilesResult {
  files: FileEntity[];
  total: number;
  limit: number;
  offset: number;
}

export class ListFilesUseCase {
  constructor(private fileRepository: FileRepositoryInterface) {}

  async execute(command: ListFilesCommand): Promise<ListFilesResult> {
    const { workspaceId, userId, type, limit, offset } = command;

    // Get files
    const files = await this.fileRepository.findByWorkspaceId(workspaceId, {
      userId,
      type,
      limit,
      offset,
    });

    // Get total count
    const total = await this.fileRepository.countByWorkspaceId(workspaceId, {
      userId,
      type,
    });

    return {
      files,
      total,
      limit,
      offset,
    };
  }
}
