/**
 * GET /api/presets/[id]
 * PUT /api/presets/[id]
 * DELETE /api/presets/[id]
 *
 * Handles retrieving, updating, and deleting individual presets.
 * Requirements: 9.3, 9.4, 9.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GetPresetUseCase } from '@/application/use-cases/preset/GetPresetUseCase';
import { UpdatePresetUseCase } from '@/application/use-cases/preset/UpdatePresetUseCase';
import { DeletePresetUseCase } from '@/application/use-cases/preset/DeletePresetUseCase';
import { PresetRepository } from '@/infrastructure/repositories/PresetRepository';
import { GetPresetCommandSchema } from '@/application/commands/preset/GetPresetCommand';
import { UpdatePresetCommandSchema } from '@/application/commands/preset/UpdatePresetCommand';
import { DeletePresetCommandSchema } from '@/application/commands/preset/DeletePresetCommand';
import { ZodError } from 'zod';

/**
 * GET /api/presets/[id]
 * Retrieve a single preset by ID
 * Requirements: 9.3
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const _currentUser = await getCurrentUser();

    // Get workspace ID from header
    const workspaceId = request.headers.get('x-workspace-id');

    // Validate input
    const command = GetPresetCommandSchema.parse({
      id: params.id,
      workspaceId: workspaceId || undefined,
    });

    // Execute use case
    const presetRepository = new PresetRepository();
    const useCase = new GetPresetUseCase(presetRepository);
    const preset = await useCase.execute(command);

    // Return preset
    return NextResponse.json({
      success: true,
      data: {
        id: preset.getId().getValue(),
        workspaceId: preset.getWorkspaceId(),
        name: preset.getName(),
        description: preset.getDescription(),
        category: preset.getCategory(),
        template: preset.getTemplate(),
        model: preset.getModel(),
        parameters: preset.getParameters(),
        isPublic: preset.getIsPublic(),
        usageCount: preset.getUsageCount(),
        createdAt: preset.getCreatedAt(),
        updatedAt: preset.getUpdatedAt(),
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};

      error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      });

      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            fields: fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    // Handle access denied errors
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        },
        { status: 403 }
      );
    }

    // Handle other errors
    console.error('Get preset error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while retrieving preset',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/presets/[id]
 * Update an existing preset
 * Requirements: 9.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const _currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Validate input
    const command = UpdatePresetCommandSchema.parse({
      id: params.id,
      ...body,
    });

    // Execute use case
    const presetRepository = new PresetRepository();
    const useCase = new UpdatePresetUseCase(presetRepository);
    const preset = await useCase.execute(command);

    // Return updated preset
    return NextResponse.json({
      success: true,
      message: 'Preset updated successfully',
      data: {
        id: preset.getId().getValue(),
        workspaceId: preset.getWorkspaceId(),
        name: preset.getName(),
        description: preset.getDescription(),
        category: preset.getCategory(),
        template: preset.getTemplate(),
        model: preset.getModel(),
        parameters: preset.getParameters(),
        isPublic: preset.getIsPublic(),
        usageCount: preset.getUsageCount(),
        createdAt: preset.getCreatedAt(),
        updatedAt: preset.getUpdatedAt(),
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};

      error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      });

      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            fields: fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    // Handle system preset modification errors
    if (
      error instanceof Error &&
      error.message.includes('System presets cannot be modified')
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        },
        { status: 403 }
      );
    }

    // Handle other errors
    console.error('Update preset error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating preset',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/presets/[id]
 * Delete a preset
 * Requirements: 9.5
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const _currentUser = await getCurrentUser();

    // Get workspace ID from header
    const workspaceId = request.headers.get('x-workspace-id');

    // Validate input
    const command = DeletePresetCommandSchema.parse({
      id: params.id,
      workspaceId: workspaceId || undefined,
    });

    // Execute use case
    const presetRepository = new PresetRepository();
    const useCase = new DeletePresetUseCase(presetRepository);
    await useCase.execute(command);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Preset deleted successfully',
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};

      error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      });

      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            fields: fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    // Handle access denied errors
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        },
        { status: 403 }
      );
    }

    // Handle system preset deletion errors
    if (
      error instanceof Error &&
      error.message.includes('System presets cannot be deleted')
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        },
        { status: 403 }
      );
    }

    // Handle other errors
    console.error('Delete preset error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting preset',
        },
      },
      { status: 500 }
    );
  }
}
