/**
 * Generate Transcription Command
 *
 * Command for transcribing audio files to text using speech-to-text models.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { z } from 'zod';

export const GenerateTranscriptionCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID'),
  userId: z.string().uuid('Invalid user ID'),
  audioFile: z.object({
    data: z.instanceof(Buffer),
    filename: z.string().min(1, 'Filename is required'),
    mimeType: z.string().min(1, 'MIME type is required'),
  }),
  provider: z.enum(['openai']),
  language: z.string().optional(),
  format: z.enum(['text', 'json', 'verbose_json', 'srt', 'vtt']).optional(),
  timestamps: z.boolean().optional(),
  temperature: z.number().min(0).max(1).optional(),
  prompt: z.string().optional(),
});

export type GenerateTranscriptionCommand = z.infer<
  typeof GenerateTranscriptionCommandSchema
>;
