/**
 * Image Generation Page
 *
 * Main image generation interface with prompt input, image gallery, size selector, style selector, and download functionality.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ModelSelector, {
  AIModel,
} from '@/components/ui/generation/ModelSelector';
import PresetSelector, { Preset } from '@/components/ui/presets/PresetSelector';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  size: string;
  style?: string;
  quality?: string;
  credits: number;
  timestamp: Date;
}

type ImageSize =
  | '256x256'
  | '512x512'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';
type ImageStyle = 'natural' | 'vivid' | 'artistic' | 'photographic';
type ImageQuality = 'standard' | 'hd';

const ImageGenerationPage: React.FC = () => {
  // State
  const [models, setModels] = useState<AIModel[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [style, setStyle] = useState<ImageStyle>('natural');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        '/api/ai/models?capability=image-generation'
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
        '/api/presets?category=image&includeSystemPresets=true'
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
    setPrompt(preset.template);

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

  // Handle image generation
  const handleGenerate = async () => {
    if (!selectedModelId) {
      setError('Please select a model');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const selectedModel = models.find((m) => m.id === selectedModelId);

      const response = await fetch('/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModelId,
          provider: selectedModel?.provider,
          size,
          style,
          quality,
          n: numberOfImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate image');
      }

      const data = await response.json();

      // Handle multiple images
      if (data.data.images) {
        const newImages: GeneratedImage[] = data.data.images.map(
          (img: any) => ({
            id: img.id,
            url: img.url,
            prompt,
            model: selectedModel?.name || selectedModelId,
            size,
            style,
            quality,
            credits: img.credits,
            timestamp: new Date(),
          })
        );
        setGeneratedImages([...newImages, ...generatedImages]);
      } else {
        // Single image
        const newImage: GeneratedImage = {
          id: data.data.id,
          url: data.data.url,
          prompt,
          model: selectedModel?.name || selectedModelId,
          size,
          style,
          quality,
          credits: data.data.credits,
          timestamp: new Date(),
        };
        setGeneratedImages([newImage, ...generatedImages]);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle download
  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
      setError('Failed to download image');
    }
  };

  // Handle delete
  const handleDelete = (imageId: string) => {
    setGeneratedImages(generatedImages.filter((img) => img.id !== imageId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Image Generation</h1>
          <p className="mt-2 text-gray-600">
            Create stunning images from text descriptions using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Prompt
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                rows={4}
                maxLength={4000}
                disabled={isGenerating}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">
                  {prompt.length} / 4000 characters
                </span>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedModelId || !prompt.trim()}
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
                        <path
                          fillRule="evenodd"
                          d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Generate Image</span>
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

            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Generated Images
              </h2>
              {generatedImages.length === 0 ? (
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
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                  <p className="text-gray-600">
                    No images generated yet. Enter a prompt and click Generate
                    Image to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative group border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownload(image)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="Download"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-6 h-6 text-gray-700"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(image.id)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-6 h-6 text-red-600"
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
                      <div className="p-3 bg-gray-50">
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                          {image.prompt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{image.model}</span>
                          <span>{image.size}</span>
                          <span>{image.credits} credits</span>
                        </div>
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
                  filterByCapability="image-generation"
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

            {/* Size Selector */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Image Size
              </h2>
              <div className="space-y-2">
                {[
                  { value: '256x256', label: 'Small (256×256)' },
                  { value: '512x512', label: 'Medium (512×512)' },
                  { value: '1024x1024', label: 'Large (1024×1024)' },
                  { value: '1792x1024', label: 'Wide (1792×1024)' },
                  { value: '1024x1792', label: 'Tall (1024×1792)' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSize(option.value as ImageSize)}
                    disabled={isGenerating}
                    className={`w-full px-4 py-2 text-left rounded-lg border transition-colors ${
                      size === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Style
              </h2>
              <div className="space-y-2">
                {[
                  { value: 'natural', label: 'Natural' },
                  { value: 'vivid', label: 'Vivid' },
                  { value: 'artistic', label: 'Artistic' },
                  { value: 'photographic', label: 'Photographic' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStyle(option.value as ImageStyle)}
                    disabled={isGenerating}
                    className={`w-full px-4 py-2 text-left rounded-lg border transition-colors ${
                      style === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  Advanced Options
                </h2>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showAdvanced ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showAdvanced && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality
                    </label>
                    <select
                      value={quality}
                      onChange={(e) =>
                        setQuality(e.target.value as ImageQuality)
                      }
                      disabled={isGenerating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="hd">HD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Images: {numberOfImages}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={numberOfImages}
                      onChange={(e) =>
                        setNumberOfImages(parseInt(e.target.value))
                      }
                      disabled={isGenerating}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationPage;
