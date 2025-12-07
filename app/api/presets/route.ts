/**
 * GET /api/presets
 * POST /api/presets
 *
 * Handles listing and creating presets.
 * Requirements: 9.1, 9.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { CreatePresetUseCase } from '@/application/use-cases/preset/CreatePresetUseCase';
import { ListPresetsUseCase } from '@/application/use-cases/preset/ListPresetsUseCase';
import { PresetRepository } from '@/infrastructure/repositories/PresetRepository';
import { WorkspaceRepository } from '@/infrastructure/repositories/WorkspaceRepository';
import { CreatePresetCommandSchema } from '@/application/commands/preset/CreatePresetCommand';
import { ListPresetsCommandSchema } from '@/application/commands/preset/ListPresetsCommand';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';



/**
 * GET /api/presets
 * List presets with optional filters
 * Requirements: 9.2
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const workspaceId =
      searchParams.get('workspaceId') || request.headers.get('x-workspace-id');
    const category = searchParams.get('category');
    const includeSystemPresets = searchParams.get('includeSystemPresets');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Validate input
    const command = ListPresetsCommandSchema.parse({
      workspaceId: workspaceId || undefined,
      category: category || undefined,
      includeSystemPresets:
        includeSystemPresets === 'true' || includeSystemPresets === '1',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    // Execute use case
    const presetRepository = new PresetRepository();
    const useCase = new ListPresetsUseCase(presetRepository);
    const presets = await useCase.execute(command);

    // Return presets
    return NextResponse.json({
      success: true,
      data: presets.map((preset) => ({
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
      })),
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

    // Handle other errors
    console.error('List presets error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while listing presets',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/presets
 * Create a new preset
 * Requirements: 9.1
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Parse request body
    const body = await request.json();

    // Get workspace ID from header or body
    const workspaceId =
      request.headers.get('x-workspace-id') || body.workspaceId;

    // Validate input
    const command = CreatePresetCommandSchema.parse({
      workspaceId: workspaceId || null,
      ...body,
    });

    // Execute use case
    const presetRepository = new PresetRepository();
    const workspaceRepository = new WorkspaceRepository();
    const useCase = new CreatePresetUseCase(
      presetRepository,
      workspaceRepository
    );
    const preset = await useCase.execute(command);

    // Return created preset
    return NextResponse.json(
      {
        success: true,
        message: 'Preset created successfully',
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
      },
      { status: 201 }
    );
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

    // Handle other errors
    console.error('Create preset error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating preset',
        },
      },
      { status: 500 }
    );
  }
}
