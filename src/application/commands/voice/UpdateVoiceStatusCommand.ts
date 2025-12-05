/**
 * Update Voice Status Command
 * Requirements: Content Management 4.1, 4.2
 */

import { z } from 'zod';

export const UpdateVoiceStatusCommandSchema = z.object({
  voiceId: z.string().uuid(),
  status: z.enum(['TRAINING', 'READY', 'FAILED']),
  modelId: z.string().optional(),
});

export type UpdateVoiceStatusCommand = z.infer<
  typeof UpdateVoiceStatusCommandSchema
>;
