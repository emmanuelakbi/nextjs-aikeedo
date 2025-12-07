/**
 * Media Processing API
 * Handles image processing operations
 * Requirements: Content Management 5.1, 5.2, 5.3, 5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMediaProcessingService } from '@/infrastructure/services/media-processing-service';
import { getFileStorageService } from '@/infrastructure/services/file-storage-service';
export const dynamic = 'force-dynamic';



export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const operation = formData.get('operation') as string;
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!operation) {
      return NextResponse.json(
        { error: 'No operation specified' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mediaService = getMediaProcessingService();

    switch (operation) {
      case 'thumbnail': {
        const width = parseInt(formData.get('width') as string) || 200;
        const height = parseInt(formData.get('height') as string) || 200;
        const quality = parseInt(formData.get('quality') as string) || 80;

        const thumbnail = await mediaService.generateThumbnail(buffer, {
          width,
          height,
          quality,
        });

        return new NextResponse(thumbnail, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': thumbnail.length.toString(),
          },
        });
      }

      case 'metadata': {
        const metadata = await mediaService.extractImageMetadata(buffer);
        return NextResponse.json({ metadata });
      }

      case 'optimize': {
        const quality = parseInt(formData.get('quality') as string) || 80;
        const maxWidth = formData.get('maxWidth')
          ? parseInt(formData.get('maxWidth') as string)
          : undefined;
        const maxHeight = formData.get('maxHeight')
          ? parseInt(formData.get('maxHeight') as string)
          : undefined;

        const optimized = await mediaService.optimizeImage(buffer, {
          quality,
          maxWidth,
          maxHeight,
        });

        return new NextResponse(optimized.data, {
          headers: {
            'Content-Type': optimized.contentType,
            'Content-Length': optimized.data.length.toString(),
            'X-Original-Size': buffer.length.toString(),
            'X-Optimized-Size': optimized.data.length.toString(),
            'X-Compression-Ratio': (
              (1 - optimized.data.length / buffer.length) *
              100
            ).toFixed(2),
          },
        });
      }

      case 'convert': {
        const format =
          (formData.get('format') as 'jpeg' | 'png' | 'webp') || 'jpeg';
        const quality = parseInt(formData.get('quality') as string) || 80;

        const converted = await mediaService.convertImageFormat(
          buffer,
          format,
          quality
        );

        return new NextResponse(converted, {
          headers: {
            'Content-Type': `image/${format}`,
            'Content-Length': converted.length.toString(),
          },
        });
      }

      case 'dimensions': {
        const dimensions = await mediaService.getImageDimensions(buffer);
        return NextResponse.json({ dimensions });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Media processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process media',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
