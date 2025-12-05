import { z } from 'zod';

/**
 * DeletePresetCommand
 *
 * Command for deleting a preset.
 * Requirements: 9.5
 */

export const DeletePresetCommandSchema = z.object({
  id: z.string().uuid('Invalid preset ID'),
  workspaceId: z.string().uuid('Invalid workspace ID').optional(),
});

export type DeletePresetCommand = z.infer<typeof DeletePresetCommandSchema>;
