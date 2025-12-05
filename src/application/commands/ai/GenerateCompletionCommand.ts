/**
 * Generate Completion Command
 *
 * Command for generating text completions from a prompt.
 * Requirements: 2.1, 2.3
 */

import { z } from 'zod';

export const GenerateCompletionCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(50000, 'Prompt is too long'),
  model: z.string().min(1, 'Model is required'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'openrouter']),
  maxTokens: z.number().int().positive().max(100000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stopSequences: z.array(z.string()).max(4).optional(),
  stream: z.boolean().optional().default(false),
});

export type GenerateCompletionCommand = z.infer<
  typeof GenerateCompletionCommandSchema
>;
