/**
 * Generate Image Command
 *
 * Command for generating images from text prompts.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { z } from 'zod';

export const GenerateImageCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(4000, 'Prompt is too long'),
  model: z.string().min(1, 'Model is required'),
  provider: z.enum(['openai', 'google', 'pollinations']),
  size: z
    .enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
    .optional(),
  style: z.enum(['natural', 'vivid', 'artistic', 'photographic']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  n: z.number().int().positive().max(10).optional().default(1),
});

export type GenerateImageCommand = z.infer<typeof GenerateImageCommandSchema>;
