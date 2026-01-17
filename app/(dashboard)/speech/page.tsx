/**
 * Speech Synthesis Page
 *
 * Main speech synthesis interface with text input, audio player, voice selector, speed control.
 * Supports both OpenAI TTS (paid) and Browser TTS (free).
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ModelSelector, { AIModel } from '@/components/ui/generation/ModelSelector';

interface GeneratedSpeech {
  id: string;
  text: string;
  model: string;
  voice: string;
  speed: number;
  format: string;
  credits: number;
  timestamp: Date;
  isBrowser: boolean;
}

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Browser voice options
const BROWSER_VOICES = [
  { id: 'default', name: 'Default', description: 'System default voice' },
  { id: 'en-US', name: 'English (US)', description: 'American English' },
  { id: 'en-GB', name: 'English (UK)', description: 'British English' },
  { id: 'es-ES', name: 'Spanish', description: 'Spanish voice' },
  { id: 'fr-FR', name: 'French', description: 'French voice' },
  { id: 'de-DE', name: 'German', description: 'German voice' },
  { id: 'it-IT', name: 'Italian', description: 'Italian voice' },
  { id: 'ja-JP', name: 'Japanese', description: 'Japanese voice' },
  { id: 'ko-KR', name: 'Korean', description: 'Korean voice' },
  { id: 'zh-CN', name: 'Chinese', description: 'Mandarin Chinese' },
];

// OpenAI voice options
const OPENAI_VOICES = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm and friendly' },
  { value: 'fable', label: 'Fable', description: 'Expressive and dynamic' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and authoritative' },
  { value: 'nova', label: 'Nova', description: 'Energetic and bright' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and gentle' },
];

const SpeechSynthesisPage: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>('browser-tts');
  const [text, setText] = useState('');
  const [openaiVoice, setOpenaiVoice] = useState<OpenAIVoice>('alloy');
  const [browserVoice, setBrowserVoice] = useState('default');
  const [speed, setSpeed] = useState(1.0);
  const [generatedSpeech, setGeneratedSpeech] = useState<GeneratedSpeech[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBrowserVoices, setAvailableBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  const isBrowserTTS = selectedModelId === 'browser-tts' || selectedModelId === 'browser';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableBrowserVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoadingModels(true);
      setError(null);
      const response = await fetch('/api/ai/models?capability=speech-synthesis');
      if (!response.ok) throw new Error('Failed to load models');
      const data = await response.json();
      const browserModel: AIModel = {
        id: 'browser-tts',
        name: 'Browser TTS (Free)',
        provider: 'browser',
        available: true,
        description: 'Free text-to-speech using your browser',
      };
      const allModels = [browserModel, ...data.data.filter((m: AIModel) => m.id !== 'browser-tts')];
      setModels(allModels);
      if (!selectedModelId) setSelectedModelId('browser-tts');
    } catch (err) {
      console.error('Error loading models:', err);
      setModels([{
        id: 'browser-tts',
        name: 'Browser TTS (Free)',
        provider: 'browser',
        available: true,
        description: 'Free text-to-speech using your browser',
      }]);
      setSelectedModelId('browser-tts');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelSelect = (model: AIModel) => setSelectedModelId(model.id);

  const findBrowserVoice = useCallback((voiceId: string): SpeechSynthesisVoice | null => {
    if (availableBrowserVoices.length === 0) return null;
    if (voiceId !== 'default') {
      const langCode = voiceId.split('-')[0];
      const voice = availableBrowserVoices.find(v => v.lang.startsWith(langCode));
      if (voice) return voice;
    }
    return availableBrowserVoices.find(v => v.lang.startsWith('en')) || availableBrowserVoices[0] || null;
  }, [availableBrowserVoices]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter text to convert to speech');
      return;
    }
    try {
      setIsGenerating(true);
      setError(null);
      const id = `speech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const selectedModel = models.find((m) => m.id === selectedModelId);

      if (isBrowserTTS) {
        const newSpeech: GeneratedSpeech = {
          id,
          text,
          model: selectedModel?.name || 'Browser TTS',
          voice: browserVoice,
          speed,
          format: 'browser',
          credits: 0,
          timestamp: new Date(),
          isBrowser: true,
        };
        setGeneratedSpeech([newSpeech, ...generatedSpeech]);
      } else {
        const response = await fetch('/api/ai/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            model: selectedModelId,
            provider: selectedModel?.provider || 'openai',
            voice: openaiVoice,
            speed,
            format: 'mp3',
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to generate speech');
        }
        const data = await response.json();
        const newSpeech: GeneratedSpeech = {
          id: data.data.id,
          text,
          model: selectedModel?.name || selectedModelId || '',
          voice: openaiVoice,
          speed,
          format: 'mp3',
          credits: data.data.credits,
          timestamp: new Date(),
          isBrowser: false,
        };
        setGeneratedSpeech([newSpeech, ...generatedSpeech]);
      }
    } catch (err) {
      console.error('Error generating speech:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = (speech: GeneratedSpeech) => {
    if (currentlyPlaying === speech.id) {
      window.speechSynthesis?.cancel();
      setCurrentlyPlaying(null);
    } else {
      window.speechSynthesis?.cancel();
      if (speech.isBrowser) {
        const utterance = new SpeechSynthesisUtterance(speech.text);
        utterance.rate = speech.speed;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        const voice = findBrowserVoice(speech.voice);
        if (voice) utterance.voice = voice;
        utterance.onend = () => setCurrentlyPlaying(null);
        utterance.onerror = () => setCurrentlyPlaying(null);
        window.speechSynthesis.speak(utterance);
        setCurrentlyPlaying(speech.id);
      } else {
        setError('OpenAI TTS playback requires API integration');
      }
    }
  };

  const handleDelete = (speechId: string) => {
    if (currentlyPlaying === speechId) {
      window.speechSynthesis?.cancel();
      setCurrentlyPlaying(null);
    }
    setGeneratedSpeech(generatedSpeech.filter((s) => s.id !== speechId));
  };

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Speech Synthesis</h1>
          <p className="mt-2 text-gray-600">Convert text to natural-sounding speech using AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Text to Convert</h2>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                rows={6}
                maxLength={4096}
                disabled={isGenerating}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">{text.length} / 4096 characters</span>
                <Button onClick={handleGenerate} disabled={isGenerating || !text.trim()} variant="primary" size="md" className="flex items-center space-x-2">
                  {isGenerating ? (<><Spinner size="sm" /><span>Generating...</span></>) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" /><path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" /></svg><span>Generate Speech</span></>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0"><svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div>
                  <div className="ml-3"><p className="text-sm text-red-700">{error}</p></div>
                  <div className="ml-auto pl-3"><button onClick={() => setError(null)} className="inline-flex text-red-400 hover:text-red-600"><span className="sr-only">Dismiss</span><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Speech</h2>
              {generatedSpeech.length === 0 ? (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                  <p className="text-gray-600">No speech generated yet. Enter text and click Generate Speech to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedSpeech.map((speech) => (
                    <div key={speech.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">{speech.text}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>{speech.voice}</span>
                            <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>{speech.speed}x</span>
                            <span className={speech.isBrowser ? 'text-green-600 font-medium' : ''}>{speech.isBrowser ? 'Free' : `${speech.credits} credits`}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handlePlayPause(speech)} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors" title={currentlyPlaying === speech.id ? 'Stop' : 'Play'}>
                          {currentlyPlaying === speech.id ? (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>)}
                        </button>
                        <button onClick={() => handleDelete(speech.id)} className="p-2 bg-gray-100 text-red-600 rounded-full hover:bg-red-50 transition-colors" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Model</h2>
              {isLoadingModels ? (<div className="flex items-center justify-center py-8"><Spinner size="md" /></div>) : (
                <ModelSelector models={models} selectedModelId={selectedModelId} onSelect={handleModelSelect} filterByCapability="speech-synthesis" />
              )}
            </div>

            {/* Dynamic Voice Selector based on model */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Voice</h2>
              {isBrowserTTS ? (
                <div className="space-y-2">
                  {BROWSER_VOICES.map((option) => (
                    <button key={option.id} onClick={() => setBrowserVoice(option.id)} disabled={isGenerating}
                      className={`w-full px-4 py-3 text-left rounded-lg border transition-colors ${browserVoice === option.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {OPENAI_VOICES.map((option) => (
                    <button key={option.value} onClick={() => setOpenaiVoice(option.value as OpenAIVoice)} disabled={isGenerating}
                      className={`w-full px-4 py-3 text-left rounded-lg border transition-colors ${openaiVoice === option.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Speed: {speed.toFixed(2)}x</h2>
              <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} disabled={isGenerating} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500 mt-2"><span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span></div>
              <p className="text-xs text-gray-500 mt-3">Adjust the playback speed of the generated speech</p>
            </div>

            {/* Tips section - dynamic based on model */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isBrowserTTS ? '💡 Browser TTS Tips' : '💡 OpenAI TTS Tips'}
              </h2>
              {isBrowserTTS ? (
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Free and instant - no API key needed</li>
                  <li>• Uses your browser&apos;s built-in voices</li>
                  <li>• Voice quality varies by browser/OS</li>
                  <li>• Works offline after page loads</li>
                  <li>• Best for quick previews and testing</li>
                </ul>
              ) : (
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• High-quality neural voices</li>
                  <li>• Consistent quality across devices</li>
                  <li>• Supports longer text passages</li>
                  <li>• Multiple audio format options</li>
                  <li>• Requires OpenAI API key</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechSynthesisPage;
