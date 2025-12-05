import { z } from 'zod';

/**
 * CreatePresetCommand
 *
 * Command for creating a new preset.
 * Requirements: 9.1
 */

export const CreatePresetCommandSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID').optional().nullable(),
  name: z.string().min(1, 'Preset name is required').trim(),
  description: z.string().min(1, 'Preset description is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  template: z.string().min(1, 'Template is required').trim(),
  model: z.string().min(1, 'Model is required'),
  parameters: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
});

export type CreatePresetCommand = z.infer<typeof CreatePresetCommandSchema>;
