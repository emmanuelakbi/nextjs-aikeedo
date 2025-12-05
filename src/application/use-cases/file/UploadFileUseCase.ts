/**
 * Upload File Use Case
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4
 */

import { randomUUID } from 'crypto';
import { FileEntity } from '../../../domain/file/entities/File';
import { FileRepositoryInterface } from '../../../domain/file/repositories/FileRepositoryInterface';
import { FileStorage } from '../../../lib/storage/types';
import {
  generateFileKey,
  getContentType,
  validateFileType,
  validateFileSize,
} from '../../../lib/storage';
import {
  UploadFileCommand,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from '../../commands/file/UploadFileCommand';

export class UploadFileUseCase {
  constructor(
    private fileRepository: FileRepositoryInterface,
    private storage: FileStorage
  ) {}

  async execute(command: UploadFileCommand): Promise<FileEntity> {
    const { workspaceId, userId, file, metadata } = command;

    // Validate file type
    if (!validateFileType(file.name, ALLOWED_FILE_TYPES.all)) {
      throw new Error(
        `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.all.join(', ')}`
      );
    }

    // Determine max size based on file type
    let maxSize = MAX_FILE_SIZES.default;
    if (validateFileType(file.name, ALLOWED_FILE_TYPES.images)) {
      maxSize = MAX_FILE_SIZES.image;
    } else if (validateFileType(file.name, ALLOWED_FILE_TYPES.audio)) {
      maxSize = MAX_FILE_SIZES.audio;
    } else if (validateFileType(file.name, ALLOWED_FILE_TYPES.documents)) {
      maxSize = MAX_FILE_SIZES.document;
    }

    // Validate file size
    if (!validateFileSize(file.size, maxSize)) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize}MB`);
    }

    // Generate unique storage key
    const storageKey = generateFileKey(file.name, `${workspaceId}/${userId}`);

    // Get content type
    const contentType = file.type || getContentType(file.name);

    // Upload file to storage
    const url = await this.storage.upload(storageKey, file.buffer, {
      contentType,
      metadata: {
        workspaceId,
        userId,
        originalName: file.name,
        ...metadata,
      },
    });

    // Create file entity
    const fileEntity = new FileEntity({
      id: randomUUID(),
      workspaceId,
      userId,
      name: file.name,
      type: contentType,
      size: file.size,
      url,
      storageKey,
      metadata: metadata ?? {},
      createdAt: new Date(),
    });

    // Save file record to database
    return this.fileRepository.save(fileEntity);
  }
}
