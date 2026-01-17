/**
 * Speech Synthesis API Route
 * 
 * Generates speech from text using various TTS providers:
 * - HuggingFace (free AI voices)
 * - OpenAI TTS (paid, requires API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// HuggingFace model mapping
const HF_MODELS: Record<string, string> = {
  'speecht5': 'microsoft/speecht5_tts',
  'mms-tts-eng': 'facebook/mms-tts-eng',
  'bark-small': 'suno/bark-small',
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, model, provider } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: { message: 'Text is required' } },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: { message: 'Text is too long (max 4096 characters)' } },
        { status: 400 }
      );
    }

    // Handle HuggingFace TTS
    if (provider === 'huggingface' || HF_MODELS[model]) {
      const hfModelId = HF_MODELS[model] || 'microsoft/speecht5_tts';
      
      const response = await fetch(
        `https://router.huggingface.co/hf-inference/models/${hfModelId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (response.status === 503) {
        // Model is loading
        const estimatedTime = response.headers.get('X-Estimated-Time') || '20';
        return NextResponse.json(
          { 
            error: { 
              message: `AI model is loading. Please try again in ${estimatedTime} seconds.`,
              code: 'MODEL_LOADING',
              retryAfter: parseInt(estimatedTime),
            } 
          },
          { status: 503 }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HuggingFace API error:', response.status, errorText);
        return NextResponse.json(
          { error: { message: `Speech generation failed: ${response.status}` } },
          { status: response.status }
        );
      }

      // Get audio blob
      const audioBuffer = await response.arrayBuffer();
      
      // Return audio as base64 for easy client handling
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      
      return NextResponse.json({
        data: {
          id: `speech-${Date.now()}`,
          audio: base64Audio,
          format: 'wav',
          model: model,
          provider: 'huggingface',
          credits: 0,
        }
      });
    }

    // Handle OpenAI TTS (if API key is available)
    if (provider === 'openai') {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return NextResponse.json(
          { error: { message: 'OpenAI API key not configured' } },
          { status: 400 }
        );
      }

      const { voice = 'alloy', speed = 1.0, format = 'mp3' } = body;

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'tts-1',
          input: text,
          voice,
          speed,
          response_format: format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: { message: errorData.error?.message || 'OpenAI TTS failed' } },
          { status: response.status }
        );
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      return NextResponse.json({
        data: {
          id: `speech-${Date.now()}`,
          audio: base64Audio,
          format,
          model: model || 'tts-1',
          provider: 'openai',
          credits: Math.ceil(text.length / 100), // Rough credit calculation
        }
      });
    }

    return NextResponse.json(
      { error: { message: 'Invalid provider' } },
      { status: 400 }
    );

  } catch (error) {
    console.error('Speech API error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
