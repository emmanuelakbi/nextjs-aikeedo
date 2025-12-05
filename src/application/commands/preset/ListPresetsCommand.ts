import { z } from 'zod';

/**
 * ListPresetsCommand
 *
 * Command for listing presets with filters.
 * Requirements: 9.2
 */

export const ListPresetsCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID').optional(),
  category: z.string().optional(),
  includeSystemPresets: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type ListPresetsCommand = z.infer<typeof ListPresetsCommandSchema>;
