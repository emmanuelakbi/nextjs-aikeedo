/**
 * GET /api/generations - List user's text generations
 * POST /api/generations - Create a new generation record
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createGenerationSchema = z.object({
  workspaceId: z.string().uuid(),
  prompt: z.string().min(1),
  result: z.string(),
  model: z.string(),
  provider: z.string(),
  tokens: z.number().int().min(0),
  credits: z.number().int().min(0),
});

// GET /api/generations - List generations
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type') || 'TEXT';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: currentUser.id,
      type: type as any,
      status: 'COMPLETED',
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          prompt: true,
          result: true,
          model: true,
          provider: true,
          tokens: true,
          credits: true,
          createdAt: true,
        },
      }),
      prisma.generation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: generations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + generations.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching generations:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch generations' } },
      { status: 500 }
    );
  }
}

// POST /api/generations - Save a generation
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    
    const data = createGenerationSchema.parse(body);

    const generation = await prisma.generation.create({
      data: {
        workspaceId: data.workspaceId,
        userId: currentUser.id,
        type: 'TEXT',
        prompt: data.prompt,
        result: data.result,
        model: data.model,
        provider: data.provider,
        tokens: data.tokens,
        credits: data.credits,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      select: {
        id: true,
        prompt: true,
        result: true,
        model: true,
        provider: true,
        tokens: true,
        credits: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: generation,
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving generation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to save generation' } },
      { status: 500 }
    );
  }
}
