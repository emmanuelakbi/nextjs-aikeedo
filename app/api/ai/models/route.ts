/**
 * GET /api/ai/models
 *
 * Retrieves available AI models with filtering and pricing information.
 * Requirements: 8.1, 8.2, 8.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getAIServiceFactory } from '@/lib/ai/factory';
import type { ServiceCapability } from '@/lib/ai/factory';
export const dynamic = 'force-dynamic';


/**
 * GET /api/ai/models
 * List available AI models with optional filtering
 * Requirements: 8.1, 8.2, 8.3
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await getCurrentUser();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const capability = searchParams.get(
      'capability'
    ) as ServiceCapability | null;
    const provider = searchParams.get('provider');

    // Get factory instance
    const factory = getAIServiceFactory();

    // Get models based on filters (with caching)
    let models;

    if (provider && capability) {
      // Filter by both provider and capability
      models = await factory.getModelsByProvider(provider as any, capability);
    } else if (provider) {
      // Filter by provider only
      models = await factory.getModelsByProvider(provider as any);
    } else if (capability) {
      // Filter by capability only
      models = await factory.getAvailableModels(capability);
    } else {
      // Get all models
      models = await factory.getAvailableModels();
    }

    // Check provider availability for each model (with caching)
    const modelsWithAvailability = await Promise.all(
      models.map(async (model) => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        capabilities: model.capabilities,
        description: model.description,
        contextWindow: model.contextWindow,
        maxOutputTokens: model.maxOutputTokens,
        pricing: model.pricing,
        available: await factory.isProviderAvailable(model.provider),
        deprecated: model.deprecated || false,
        replacementModel: model.replacementModel,
      }))
    );

    // Return models
    return NextResponse.json({
      success: true,
      data: modelsWithAvailability,
    });
  } catch (error) {
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
    console.error('List models error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while listing models',
        },
      },
      { status: 500 }
    );
  }
}
