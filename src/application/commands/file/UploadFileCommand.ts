/**
 * Upload File Command
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4
 */

import { z } from 'zod';

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.csv'],
  all: [] as string[], // Will be populated below
};

// Populate 'all' with all allowed types
ALLOWED_FILE_TYPES.all = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.audio,
  ...ALLOWED_FILE_TYPES.documents,
];

/**
 * Maximum file sizes in MB
 */
export const MAX_FILE_SIZES = {
  image: 10, // 10 MB
  audio: 50, // 50 MB
  document: 25, // 25 MB
  default: 10, // 10 MB
};

export const UploadFileCommandSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  file: z.object({
    name: z.string().min(1, 'File name is required'),
    type: z.string().min(1, 'File type is required'),
    size: z.number().positive('File size must be positive'),
    buffer: z.any(), // Buffer type - using any for Zod compatibility
  }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UploadFileCommand = z.infer<typeof UploadFileCommandSchema>;
