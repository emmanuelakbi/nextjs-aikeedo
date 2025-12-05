/**
 * Get Presigned Upload URL Use Case
 * Requirements: Content Management 1.1, 1.3
 */

import { randomUUID } from 'crypto';
import { FileStorage } from '../../../lib/storage/types';
import {
  generateFileKey,
  getContentType,
  validateFileType,
  validateFileSize,
} from '../../../lib/storage';
import { GetPresignedUploadUrlCommand } from '../../commands/file/GetPresignedUploadUrlCommand';
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from '../../commands/file/UploadFileCommand';

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  fileId: string;
  storageKey: string;
  expiresIn: number;
}

export class GetPresignedUploadUrlUseCase {
  constructor(private storage: FileStorage) {}

  async execute(
    command: GetPresignedUploadUrlCommand
  ): Promise<PresignedUploadUrlResult> {
    const { workspaceId, userId, fileName, fileType, fileSize } = command;

    // Validate file type
    if (!validateFileType(fileName, ALLOWED_FILE_TYPES.all)) {
      throw new Error(
        `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.all.join(', ')}`
      );
    }

    // Determine max size based on file type
    let maxSize = MAX_FILE_SIZES.default;
    if (validateFileType(fileName, ALLOWED_FILE_TYPES.images)) {
      maxSize = MAX_FILE_SIZES.image;
    } else if (validateFileType(fileName, ALLOWED_FILE_TYPES.audio)) {
      maxSize = MAX_FILE_SIZES.audio;
    } else if (validateFileType(fileName, ALLOWED_FILE_TYPES.documents)) {
      maxSize = MAX_FILE_SIZES.document;
    }

    // Validate file size
    if (!validateFileSize(fileSize, maxSize)) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize}MB`);
    }

    // Generate unique storage key
    const storageKey = generateFileKey(fileName, `${workspaceId}/${userId}`);

    // Get content type
    const contentType = fileType || getContentType(fileName);

    // Generate presigned upload URL
    const expiresIn = 3600; // 1 hour
    const uploadUrl = await this.storage.getPresignedUploadUrl(storageKey, {
      expiresIn,
      contentType,
    });

    // Generate file ID for later confirmation
    const fileId = randomUUID();

    return {
      uploadUrl,
      fileId,
      storageKey,
      expiresIn,
    };
  }
}
