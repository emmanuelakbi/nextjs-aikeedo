/**
 * Get Presigned Upload URL Command
 * Requirements: Content Management 1.1, 1.3
 */

import { z } from 'zod';

export const GetPresignedUploadUrlCommandSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().positive('File size must be positive'),
});

export type GetPresignedUploadUrlCommand = z.infer<
  typeof GetPresignedUploadUrlCommandSchema
>;
