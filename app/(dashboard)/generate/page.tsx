/**
 * Text Generation Page
 *
 * Main text generation interface with prompt input, model selection, preset support, and parameter controls.
 * Requirements: 2.1, 2.3, 9.2
 */

'use client';

import React, { useState, useEffect } from 'react';
import PromptInput from '@/components/ui/generation/PromptInput';
import GenerationResult from '@/components/ui/generation/GenerationResult';
import ModelSelector, {
  AIModel,
} from '@/components/ui/generation/ModelSelector';
import ParameterControls, {
  GenerationParameters,
} from '@/components/ui/generation/ParameterControls';
import PresetSelector, { Preset } from '@/components/ui/presets/PresetSelector';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface GenerationHistory {
  id: string;
  prompt: string;
  result: string;
  model: string;
  timestamp: Date;
  tokens?: number;
  credits?: number;
}

const GeneratePage: React.FC = () => {
  // State
  const [models, setModels] = useState<AIModel[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [result, setResult] = useState('');
  const [parameters, setParameters] = useState<GenerationParameters>({
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  });
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParameters, setShowParameters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [metadata, setMetadata] = useState<{
    model?: string;
    tokens?: number;
    credits?: number;
    duration?: number;
  } | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Load workspace ID and history on mount
  useEffect(() => {
    loadWorkspaceAndHistory();
  }, []);

  // Load workspace ID and generation history from database
  const loadWorkspaceAndHistory = async () => {
    try {
      setIsLoadingHistory(true);
      
      // Get workspace ID from session
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      if (sessionData?.user?.currentWorkspaceId) {
        setWorkspaceId(sessionData.user.currentWorkspaceId);
        
        // Load history from database
        const historyResponse = await fetch(
          `/api/generations?workspaceId=${sessionData.user.currentWorkspaceId}&type=TEXT&limit=50`
        );
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const loadedHistory: GenerationHistory[] = historyData.data.map((gen: any) => ({
            id: gen.id,
            prompt: gen.prompt,
            result: gen.result || '',
            model: gen.model,
            timestamp: new Date(gen.createdAt),
            tokens: gen.tokens,
            credits: gen.credits,
          }));
          setHistory(loadedHistory);
        }
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load models from API
  const loadModels = async () => {
    try {
      setIsLoadingModels(true);
      setError(null);

      const response = await fetch('/api/ai/models?capability=text-generation');

      if (!response.ok) {
        throw new Error('Failed to load models');
      }

      const data = await response.json();
      setModels(data.data);

      // Select gemini-2.5-flash by default, or first available model
      if (!selectedModelId) {
        const gemini25 = data.data.find((m: AIModel) => m.id === 'gemini-2.5-flash' && m.available);
        const firstAvailable = data.data.find((m: AIModel) => m.available);
        setSelectedModelId(gemini25?.id || firstAvailable?.id || null);
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

      const response = await fetch('/api/presets?includeSystemPresets=true');

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
    setCurrentPrompt(preset.template);

    // Apply preset model if available
    if (preset.model) {
      const model = models.find((m) => m.id === preset.model);
      if (model?.available) {
        setSelectedModelId(preset.model);
      }
    }

    // Apply preset parameters
    if (preset.parameters) {
      setParameters({
        temperature:
          (preset.parameters.temperature as number) ?? parameters.temperature,
        maxTokens:
          (preset.parameters.maxTokens as number) ?? parameters.maxTokens,
        topP: (preset.parameters.topP as number) ?? parameters.topP,
        frequencyPenalty:
          (preset.parameters.frequencyPenalty as number) ??
          parameters.frequencyPenalty,
        presencePenalty:
          (preset.parameters.presencePenalty as number) ??
          parameters.presencePenalty,
      });
    }
  };

  // Handle model selection
  const handleModelSelect = (model: AIModel) => {
    setSelectedModelId(model.id);
  };

  // Handle generation
  const handleGenerate = async (promptText: string) => {
    if (!selectedModelId) {
      setError('Please select a model');
      return;
    }

    // Store the prompt for history
    setCurrentPrompt(promptText);

    try {
      setIsGenerating(true);
      setError(null);
      setResult('');
      setMetadata(null);

      // Get workspace ID from session if not already loaded
      let currentWorkspaceId = workspaceId;
      if (!currentWorkspaceId) {
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        currentWorkspaceId = sessionData?.user?.currentWorkspaceId;
        if (currentWorkspaceId) {
          setWorkspaceId(currentWorkspaceId);
        }
      }

      if (!currentWorkspaceId) {
        setError('No workspace selected. Please select a workspace first.');
        setIsGenerating(false);
        return;
      }

      const selectedModel = models.find((m) => m.id === selectedModelId);
      const startTime = Date.now();

      const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          prompt: promptText,
          model: selectedModelId,
          provider: selectedModel?.provider,
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
          frequencyPenalty: parameters.frequencyPenalty,
          presencePenalty: parameters.presencePenalty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'Failed to generate completion'
        );
      }

      const data = await response.json();
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const generatedContent = data.data.content;
      const tokensUsed = data.data.tokens?.total || data.data.tokens || 0;
      const creditsUsed = data.data.credits || 0;

      setResult(generatedContent);
      setMetadata({
        model: selectedModel?.name,
        tokens: tokensUsed,
        credits: creditsUsed,
        duration,
      });

      // Save to database
      try {
        const saveResponse = await fetch('/api/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: currentWorkspaceId,
            prompt: promptText,
            result: generatedContent,
            model: selectedModelId,
            provider: selectedModel?.provider || 'unknown',
            tokens: tokensUsed,
            credits: creditsUsed,
          }),
        });

        if (saveResponse.ok) {
          const savedData = await saveResponse.json();
          // Add to history with the database ID
          const historyItem: GenerationHistory = {
            id: savedData.data.id,
            prompt: promptText,
            result: generatedContent,
            model: selectedModel?.name || selectedModelId,
            timestamp: new Date(savedData.data.createdAt),
            tokens: tokensUsed,
            credits: creditsUsed,
          };
          setHistory([historyItem, ...history]);
        } else {
          // Still add to local history even if save fails
          const historyItem: GenerationHistory = {
            id: crypto.randomUUID(),
            prompt: promptText,
            result: generatedContent,
            model: selectedModel?.name || selectedModelId,
            timestamp: new Date(),
            tokens: tokensUsed,
            credits: creditsUsed,
          };
          setHistory([historyItem, ...history]);
        }
      } catch (saveErr) {
        console.error('Error saving generation to database:', saveErr);
        // Still add to local history
        const historyItem: GenerationHistory = {
          id: crypto.randomUUID(),
          prompt: promptText,
          result: generatedContent,
          model: selectedModel?.name || selectedModelId,
          timestamp: new Date(),
          tokens: tokensUsed,
          credits: creditsUsed,
        };
        setHistory([historyItem, ...history]);
      }
    } catch (err) {
      console.error('Error generating completion:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate completion'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle copy
  const handleCopy = () => {
    // Copy feedback is handled by GenerationResult component
  };

  // Handle retry
  const handleRetry = () => {
    if (currentPrompt) {
      handleGenerate(currentPrompt);
    }
  };

  // Load history item
  const loadHistoryItem = (item: GenerationHistory) => {
    setCurrentPrompt(item.prompt);
    setResult(item.result);
    setMetadata({
      model: item.model,
      tokens: item.tokens,
      credits: item.credits,
    });
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Text Generation</h1>
          <p className="mt-2 text-gray-600">
            Generate high-quality text content using AI models
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
              <PromptInput
                value={currentPrompt}
                onChange={setCurrentPrompt}
                onSubmit={handleGenerate}
                disabled={isGenerating || !selectedModelId}
                placeholder="Enter your prompt here..."
                maxLength={4000}
              />
            </div>

            {/* Result Display */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Result</h2>
                {history.length > 0 && (
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    variant="outline"
                    size="sm"
                  >
                    {showHistory ? 'Hide' : 'Show'} History ({history.length})
                  </Button>
                )}
              </div>
              <GenerationResult
                content={result}
                isLoading={isGenerating}
                error={error}
                onCopy={handleCopy}
                onRetry={handleRetry}
                metadata={metadata || undefined}
              />
            </div>

            {/* History Panel */}
            {showHistory && history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Generation History
                </h2>
                <div className="space-y-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.prompt.substring(0, 100)}
                            {item.prompt.length > 100 ? '...' : ''}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {item.model}
                            </span>
                            {item.tokens && (
                              <span className="text-xs text-gray-400">
                                • {item.tokens.toLocaleString()} tokens
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              • {item.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                  filterByCapability="text-generation"
                />
              )}
            </div>

            {/* Preset Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Presets
              </h2>
              {isLoadingPresets ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <PresetSelector
                  presets={presets}
                  selectedPresetId={selectedPresetId}
                  onSelect={handlePresetSelect}
                  onClear={() => setSelectedPresetId(null)}
                  placeholder="Choose a preset..."
                />
              )}
            </div>

            {/* Parameters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <button
                onClick={() => setShowParameters(!showParameters)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  Parameters
                </h2>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showParameters ? 'transform rotate-180' : ''
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
              {showParameters && (
                <ParameterControls
                  parameters={parameters}
                  onChange={setParameters}
                  disabled={isGenerating}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
