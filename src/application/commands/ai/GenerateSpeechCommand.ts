/**
 * Generate Speech Command
 *
 * Command for generating speech from text using text-to-speech models.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { z } from 'zod';

export const GenerateSpeechCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'),
  text: z.string().min(1, 'Text is required').max(4096, 'Text is too long'),
  model: z.string().min(1, 'Model is required'),
  provider: z.enum(['openai', 'browser']),
  voice: z
    .enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'default', 'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN'])
    .optional(),
  customVoiceId: z.string().uuid('Invalid custom voice ID').optional(),
  format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm', 'browser']).optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
  quality: z.enum(['standard', 'high']).optional(),
});

export type GenerateSpeechCommand = z.infer<typeof GenerateSpeechCommandSchema>;
