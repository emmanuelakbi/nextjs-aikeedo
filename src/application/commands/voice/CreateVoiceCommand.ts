/**
 * Create Voice Command
 * Requirements: Content Management 4.1, 4.2
 */

import { z } from 'zod';

export const CreateVoiceCommandSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z
    .string()
    .min(1, 'Voice name is required')
    .max(100, 'Voice name too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description too long'),
  sampleFileId: z.string().uuid('Valid sample file ID is required'),
});

export type CreateVoiceCommand = z.infer<typeof CreateVoiceCommandSchema>;
