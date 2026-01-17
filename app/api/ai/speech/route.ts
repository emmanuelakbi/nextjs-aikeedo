/**
 * Speech Synthesis API Route
 * 
 * Generates speech from text using various TTS providers:
 * - StreamElements (free, no API key)
 * - OpenAI TTS (paid, requires API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// StreamElements voices (free)
const SE_VOICES: Record<string, string> = {
  'brian': 'Brian',
  'amy': 'Amy', 
  'emma': 'Emma',
  'joanna': 'Joanna',
  'kendra': 'Kendra',
  'kimberly': 'Kimberly',
  'salli': 'Salli',
  'joey': 'Joey',
  'justin': 'Justin',
  'matthew': 'Matthew',
};

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
    const { text, model, provider, voice = 'brian' } = body;

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

    // Handle StreamElements TTS (free)
    if (provider === 'streamelements' || model === 'streamelements' || 
        model === 'brian' || model === 'amy' || model === 'emma') {
      
      const seVoice = SE_VOICES[voice] || SE_VOICES[model] || 'Brian';
      const encodedText = encodeURIComponent(text);
      
      // StreamElements TTS API
      const response = await fetch(
        `https://api.streamelements.com/kappa/v2/speech?voice=${seVoice}&text=${encodedText}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        console.error('StreamElements API error:', response.status);
        return NextResponse.json(
          { error: { message: `Speech generation failed: ${response.status}` } },
          { status: response.status }
        );
      }

      // Get audio blob
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      
      return NextResponse.json({
        data: {
          id: `speech-${Date.now()}`,
          audio: base64Audio,
          format: 'mp3',
          model: model || 'streamelements',
          provider: 'streamelements',
          voice: seVoice,
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

    // Default to StreamElements
    const encodedText = encodeURIComponent(text);
    const response = await fetch(
      `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodedText}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: 'Speech generation failed' } },
        { status: 500 }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({
      data: {
        id: `speech-${Date.now()}`,
        audio: base64Audio,
        format: 'mp3',
        model: 'streamelements',
        provider: 'streamelements',
        voice: 'Brian',
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
