/**
 * Speech Synthesis API Route
 * 
 * Generates speech from text using various TTS providers:
 * - ElevenLabs (free tier: 10,000 chars/month)
 * - OpenAI TTS (paid, requires API key)
 * - Browser TTS (fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, model, provider, voice = 'Rachel' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: { message: 'Text is required' } },
        { status: 400 }
      );
    }

    // Handle ElevenLabs TTS (free tier available)
    if (provider === 'elevenlabs') {
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
      if (!elevenLabsKey) {
        return NextResponse.json(
          { error: { message: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to your .env file.' } },
          { status: 400 }
        );
      }

      // ElevenLabs voice IDs
      const voiceIds: Record<string, string> = {
        'Rachel': '21m00Tcm4TlvDq8ikWAM',
        'Domi': 'AZnzlk1XvdvUeBnXmlld',
        'Bella': 'EXAVITQu4vr4xnSDxMaL',
        'Antoni': 'ErXwobaYiN019PkySvjV',
        'Elli': 'MF3mGyEYCl7XYWbV9V6O',
        'Josh': 'TxGEqnHWrfWFTfGW9XjX',
        'Arnold': 'VR6AewLTigWG4xSOukaG',
        'Adam': 'pNInz6obpgDQGcFmaJgB',
        'Sam': 'yoZ06aMxZJJ28mfd3POQ',
      };

      // ElevenLabs model IDs - default to eleven_multilingual_v2 if not specified
      const validModels = [
        'eleven_multilingual_v3',
        'eleven_multilingual_v2',
        'eleven_flash_v2_5',
        'eleven_turbo_v2_5',
        'eleven_turbo_v2',
        'eleven_flash_v2',
        'eleven_monolingual_v1',
        'eleven_multilingual_v1',
      ];
      const modelId = model && validModels.includes(model) ? model : 'eleven_multilingual_v2';

      const voiceId = voiceIds[voice] || voiceIds['Rachel'];

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('ElevenLabs error:', errorData);
        return NextResponse.json(
          { error: { message: errorData.detail?.message || 'ElevenLabs TTS failed' } },
          { status: response.status }
        );
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      return NextResponse.json({
        data: {
          id: `speech-${Date.now()}`,
          audio: base64Audio,
          format: 'mp3',
          model: modelId,
          provider: 'elevenlabs',
          voice: voice,
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

      const { speed = 1.0, format = 'mp3' } = body;

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'tts-1',
          input: text,
          voice: voice || 'alloy',
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
          credits: Math.ceil(text.length / 100),
        }
      });
    }

    // Fallback: Browser TTS
    return NextResponse.json({
      data: {
        id: `speech-${Date.now()}`,
        useBrowserTTS: true,
        text: text,
        voice: voice,
        format: 'browser',
        model: 'browser-tts',
        provider: 'browser',
        credits: 0,
      }
    });

  } catch (error) {
    console.error('Speech API error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
