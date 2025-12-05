/**
 * Delete File Use Case
 * Requirements: Content Management 1.1
 */

import { FileRepositoryInterface } from '../../../domain/file/repositories/FileRepositoryInterface';
import { FileStorage } from '../../../lib/storage/types';
import { DeleteFileCommand } from '../../commands/file/DeleteFileCommand';

export class DeleteFileUseCase {
  constructor(
    private fileRepository: FileRepositoryInterface,
    private storage: FileStorage
  ) {}

  async execute(command: DeleteFileCommand): Promise<void> {
    const { fileId, userId, workspaceId } = command;

    // Find the file
    const file = await this.fileRepository.findById(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    // Verify ownership
    if (!file.belongsToUser(userId) || !file.belongsToWorkspace(workspaceId)) {
      throw new Error('Unauthorized to delete this file');
    }

    // Delete from storage
    try {
      await this.storage.delete(file.getStorageKey());
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await this.fileRepository.delete(fileId);
  }
}
