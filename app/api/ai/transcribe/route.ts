/**
 * POST /api/ai/transcribe
 *
 * Transcribes audio files to text using speech-to-text models.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GenerateTranscriptionUseCase } from '@/application/use-cases/ai/GenerateTranscriptionUseCase';
import { InsufficientCreditsError } from '@/infrastructure/services/CreditDeductionService';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { ZodError } from 'zod';
export const dynamic = 'force-dynamic';


/**
 * POST /api/ai/transcribe
 * Transcribe audio file to text
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withAIRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Require authentication
    const currentUser = await getCurrentUser();

    // Parse multipart form data
    const formData = await request.formData();

    // Get workspace ID from header or form data
    const workspaceId =
      request.headers.get('x-workspace-id') || formData.get('workspaceId');

    if (!workspaceId || typeof workspaceId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_WORKSPACE',
            message: 'Workspace ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Get audio file from form data
    const audioFile = formData.get('file');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_FILE',
            message: 'Audio file is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size (25 MB max for OpenAI Whisper)
    const maxFileSize = 25 * 1024 * 1024; // 25 MB
    if (audioFile.size > maxFileSize) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds maximum of ${maxFileSize / (1024 * 1024)} MB`,
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const supportedFormats = [
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/m4a',
      'audio/wav',
      'audio/webm',
      'audio/flac',
      'audio/ogg',
    ];

    if (!supportedFormats.includes(audioFile.type)) {
      return NextResponse.json(
        {
          error: {
            code: 'UNSUPPORTED_FORMAT',
            message: `Unsupported audio format: ${audioFile.type}. Supported formats: ${supportedFormats.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get optional parameters
    const provider = (formData.get('provider') as string) || 'openai';
    const language = formData.get('language') as string | undefined;
    const format = (formData.get('format') as string) || 'verbose_json';
    const timestamps = formData.get('timestamps') === 'true';
    const temperatureStr = formData.get('temperature') as string | undefined;
    const temperature = temperatureStr ? parseFloat(temperatureStr) : undefined;
    const prompt = formData.get('prompt') as string | undefined;

    // Validate provider
    if (provider !== 'openai') {
      return NextResponse.json(
        {
          error: {
            code: 'UNSUPPORTED_PROVIDER',
            message:
              'Only OpenAI provider is currently supported for transcription',
          },
        },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ['text', 'json', 'verbose_json', 'srt', 'vtt'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FORMAT',
            message: `Invalid format: ${format}. Supported formats: ${validFormats.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate temperature if provided
    if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TEMPERATURE',
            message: 'Temperature must be between 0 and 1',
          },
        },
        { status: 400 }
      );
    }

    // Execute use case
    const useCase = new GenerateTranscriptionUseCase();
    const result = await useCase.execute({
      userId: currentUser.id,
      workspaceId,
      audioFile: {
        data: buffer,
        filename: audioFile.name,
        mimeType: audioFile.type,
      },
      provider: 'openai',
      language,
      format: format as 'text' | 'json' | 'verbose_json' | 'srt' | 'vtt',
      timestamps,
      temperature,
      prompt,
    });

    // Return result
    return NextResponse.json({
      success: true,
      data: result,
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

    // Handle insufficient credits
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: error.message,
            details: {
              required: error.required,
              available: error.available,
            },
          },
        },
        { status: 402 }
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

    // Handle provider errors
    if (error instanceof Error && error.message.includes('not available')) {
      return NextResponse.json(
        {
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: error.message,
          },
        },
        { status: 503 }
      );
    }

    // Handle file format errors
    if (error instanceof Error && error.message.includes('format')) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FORMAT',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    // Handle language errors
    if (error instanceof Error && error.message.includes('language')) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_LANGUAGE',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    // Handle file size errors
    if (error instanceof Error && error.message.includes('too large')) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Generate transcription error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while transcribing audio',
        },
      },
      { status: 500 }
    );
  }
}
