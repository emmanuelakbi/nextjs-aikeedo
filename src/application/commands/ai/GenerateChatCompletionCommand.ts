/**
 * Generate Chat Completion Command
 *
 * Command for generating chat completions from conversation history.
 * Requirements: 2.1, 2.2, 2.3
 */

import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content is required'),
});

export const GenerateChatCompletionCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'),
  messages: z
    .array(ChatMessageSchema)
    .min(1, 'At least one message is required'),
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

export type GenerateChatCompletionCommand = z.infer<
  typeof GenerateChatCompletionCommandSchema
>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
