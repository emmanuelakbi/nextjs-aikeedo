/**
 * Speech Synthesis Page
 *
 * Main speech synthesis interface with text input, audio player, voice selector, speed control, and download functionality.
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ModelSelector, {
  AIModel,
} from '@/components/ui/generation/ModelSelector';
import PresetSelector, { Preset } from '@/components/ui/presets/PresetSelector';

interface GeneratedSpeech {
  id: string;
  url: string;
  text: string;
  model: string;
  voice: string;
  speed: number;
  format: string;
  credits: number;
  timestamp: Date;
}

type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

const SpeechSynthesisPage: React.FC = () => {
  // State
  const [models, setModels] = useState<AIModel[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<VoiceOption>('alloy');
  const [speed, setSpeed] = useState(1.0);
  const [format, setFormat] = useState<AudioFormat>('mp3');
  const [generatedSpeech, setGeneratedSpeech] = useState<GeneratedSpeech[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Load models from API
  const loadModels = async () => {
    try {
      setIsLoadingModels(true);
      setError(null);

      const response = await fetch(
        '/api/ai/models?capability=speech-synthesis'
      );

      if (!response.ok) {
        throw new Error('Failed to load models');
      }

      const data = await response.json();
      setModels(data.data);

      // Select first available model by default
      const firstAvailable = data.data.find((m: AIModel) => m.available);
      if (firstAvailable && !selectedModelId) {
        setSelectedModelId(firstAvailable.id);
      }
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load presets from API
  const loadPresets = async () => {
    try {
      setIsLoadingPresets(true);

      const response = await fetch(
        '/api/presets?category=speech&includeSystemPresets=true'
      );

      if (!response.ok) {
        throw new Error('Failed to load presets');
      }

      const data = await response.json();
      setPresets(data.data);
    } catch (err) {
      console.error('Error loading presets:', err);
      // Don't set error for presets, they're optional
    } finally {
      setIsLoadingPresets(false);
    }
  };

  // Handle preset selection
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPresetId(preset.id);
    setText(preset.template);

    // Apply preset model if available
    if (preset.model) {
      const model = models.find((m) => m.id === preset.model);
      if (model?.available) {
        setSelectedModelId(preset.model);
      }
    }
  };

  // Handle model selection
  const handleModelSelect = (model: AIModel) => {
    setSelectedModelId(model.id);
  };

  // Handle speech generation
  const handleGenerate = async () => {
    if (!selectedModelId) {
      setError('Please select a model');
      return;
    }

    if (!text.trim()) {
      setError('Please enter text to convert to speech');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const selectedModel = models.find((m) => m.id === selectedModelId);

      const response = await fetch('/api/ai/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          model: selectedModelId,
          provider: selectedModel?.provider || 'openai',
          voice,
          speed,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'Failed to generate speech'
        );
      }

      const data = await response.json();

      const newSpeech: GeneratedSpeech = {
        id: data.data.id,
        url: data.data.url,
        text,
        model: selectedModel?.name || selectedModelId,
        voice,
        speed,
        format,
        credits: data.data.credits,
        timestamp: new Date(),
      };

      setGeneratedSpeech([newSpeech, ...generatedSpeech]);
    } catch (err) {
      console.error('Error generating speech:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate speech'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle play/pause
  const handlePlayPause = (speech: GeneratedSpeech) => {
    if (currentlyPlaying === speech.id) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentlyPlaying(null);
    } else {
      // Play new audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(speech.url);
      audioRef.current.play();
      setCurrentlyPlaying(speech.id);

      // Reset when audio ends
      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  // Handle download
  const handleDownload = async (speech: GeneratedSpeech) => {
    try {
      const response = await fetch(speech.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech-${speech.id}.${speech.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading audio:', err);
      setError('Failed to download audio');
    }
  };

  // Handle delete
  const handleDelete = (speechId: string) => {
    if (currentlyPlaying === speechId && audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    }
    setGeneratedSpeech(generatedSpeech.filter((s) => s.id !== speechId));
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Speech Synthesis</h1>
          <p className="mt-2 text-gray-600">
            Convert text to natural-sounding speech using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Text to Convert
              </h2>
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
                <span className="text-sm text-gray-500">
                  {text.length} / 4096 characters
                </span>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedModelId || !text.trim()}
                  variant="primary"
                  size="md"
                  className="flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <Spinner size="sm" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                      </svg>
                      <span>Generate Speech</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex text-red-400 hover:text-red-600"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Speech List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Generated Speech
              </h2>
              {generatedSpeech.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                  <p className="text-gray-600">
                    No speech generated yet. Enter text and click Generate
                    Speech to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedSpeech.map((speech) => (
                    <div
                      key={speech.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                            {speech.text}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4 mr-1"
                              >
                                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                              </svg>
                              {speech.voice}
                            </span>
                            <span className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4 mr-1"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {speech.speed}x
                            </span>
                            <span>{speech.credits} credits</span>
                          </div>
                        </div>
                      </div>

                      {/* Audio Player Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePlayPause(speech)}
                          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                          title={
                            currentlyPlaying === speech.id ? 'Pause' : 'Play'
                          }
                        >
                          {currentlyPlaying === speech.id ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>

                        <button
                          onClick={() => handleDownload(speech)}
                          className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                          title="Download"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleDelete(speech.id)}
                          className="p-2 bg-gray-100 text-red-600 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                              clipRule="evenodd"
                            />
                          </svg>
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
            {/* Model Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Model
              </h2>
              {isLoadingModels ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <ModelSelector
                  models={models}
                  selectedModelId={selectedModelId}
                  onSelect={handleModelSelect}
                  filterByCapability="speech-synthesis"
                />
              )}
            </div>

            {/* Preset Selection */}
            {!isLoadingPresets && presets.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Presets
                </h2>
                <PresetSelector
                  presets={presets}
                  selectedPresetId={selectedPresetId}
                  onSelect={handlePresetSelect}
                  onClear={() => setSelectedPresetId(null)}
                  placeholder="Choose a preset..."
                />
              </div>
            )}

            {/* Voice Selector */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Voice
              </h2>
              <div className="space-y-2">
                {[
                  {
                    value: 'alloy',
                    label: 'Alloy',
                    description: 'Neutral and balanced',
                  },
                  {
                    value: 'echo',
                    label: 'Echo',
                    description: 'Warm and friendly',
                  },
                  {
                    value: 'fable',
                    label: 'Fable',
                    description: 'Expressive and dynamic',
                  },
                  {
                    value: 'onyx',
                    label: 'Onyx',
                    description: 'Deep and authoritative',
                  },
                  {
                    value: 'nova',
                    label: 'Nova',
                    description: 'Energetic and bright',
                  },
                  {
                    value: 'shimmer',
                    label: 'Shimmer',
                    description: 'Soft and gentle',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVoice(option.value as VoiceOption)}
                    disabled={isGenerating}
                    className={`w-full px-4 py-3 text-left rounded-lg border transition-colors ${
                      voice === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Control */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Speed: {speed.toFixed(2)}x
              </h2>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.25"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                disabled={isGenerating}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0.25x</span>
                <span>1.0x</span>
                <span>2.0x</span>
                <span>4.0x</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Adjust the playback speed of the generated speech
              </p>
            </div>

            {/* Format Selector */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Audio Format
              </h2>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as AudioFormat)}
                disabled={isGenerating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mp3">MP3</option>
                <option value="opus">Opus</option>
                <option value="aac">AAC</option>
                <option value="flac">FLAC</option>
                <option value="wav">WAV</option>
                <option value="pcm">PCM</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Choose the audio file format for download
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechSynthesisPage;
