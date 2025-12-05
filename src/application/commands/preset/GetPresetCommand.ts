import { z } from 'zod';

/**
 * GetPresetCommand
 *
 * Command for retrieving a single preset.
 * Requirements: 9.3
 */

export const GetPresetCommandSchema = z.object({
  id: z.string().uuid('Invalid preset ID'),
  workspaceId: z.string().uuid('Invalid workspace ID').optional(),
});

export type GetPresetCommand = z.infer<typeof GetPresetCommandSchema>;
