import { z } from 'zod';

/**
 * UpdatePresetCommand
 *
 * Command for updating an existing preset.
 * Requirements: 9.4
 */

export const UpdatePresetCommandSchema = z.object({
  id: z.string().uuid('Invalid preset ID'),
  name: z.string().min(1, 'Preset name cannot be empty').trim().optional(),
  description: z
    .string()
    .min(1, 'Preset description cannot be empty')
    .trim()
    .optional(),
  category: z.string().min(1, 'Category cannot be empty').trim().optional(),
  template: z.string().min(1, 'Template cannot be empty').trim().optional(),
  model: z.string().min(1, 'Model cannot be empty').optional(),
  parameters: z.record(z.string(), z.any()).optional(),
  isPublic: z.boolean().optional(),
});

export type UpdatePresetCommand = z.infer<typeof UpdatePresetCommandSchema>;
