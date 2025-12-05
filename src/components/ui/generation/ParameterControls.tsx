'use client';

import React from 'react';

export interface GenerationParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ParameterControlsProps {
  parameters: GenerationParameters;
  onChange: (parameters: GenerationParameters) => void;
  className?: string;
  disabled?: boolean;
}

const ParameterControls: React.FC<ParameterControlsProps> = ({
  parameters,
  onChange,
  className = '',
  disabled = false,
}) => {
  const handleChange = (key: keyof GenerationParameters, value: number) => {
    onChange({
      ...parameters,
      [key]: value,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Temperature */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Temperature
          </label>
          <span className="text-sm text-gray-500">
            {parameters.temperature?.toFixed(2) ?? '0.70'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={parameters.temperature ?? 0.7}
          onChange={(e) =>
            handleChange('temperature', parseFloat(e.target.value))
          }
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Temperature"
        />
        <p className="text-xs text-gray-500 mt-1">
          Controls randomness. Lower values make output more focused and
          deterministic.
        </p>
      </div>

      {/* Max Tokens */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Max Tokens
          </label>
          <span className="text-sm text-gray-500">
            {parameters.maxTokens?.toLocaleString() ?? '2,000'}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="4000"
          step="100"
          value={parameters.maxTokens ?? 2000}
          onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Max Tokens"
        />
        <p className="text-xs text-gray-500 mt-1">
          Maximum length of the generated response.
        </p>
      </div>

      {/* Top P */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Top P
          </label>
          <span className="text-sm text-gray-500">
            {parameters.topP?.toFixed(2) ?? '1.00'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={parameters.topP ?? 1.0}
          onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Top P"
        />
        <p className="text-xs text-gray-500 mt-1">
          Nucleus sampling. Lower values make output more focused.
        </p>
      </div>

      {/* Frequency Penalty */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Frequency Penalty
          </label>
          <span className="text-sm text-gray-500">
            {parameters.frequencyPenalty?.toFixed(2) ?? '0.00'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={parameters.frequencyPenalty ?? 0.0}
          onChange={(e) =>
            handleChange('frequencyPenalty', parseFloat(e.target.value))
          }
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Frequency Penalty"
        />
        <p className="text-xs text-gray-500 mt-1">
          Reduces repetition of tokens based on their frequency.
        </p>
      </div>

      {/* Presence Penalty */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Presence Penalty
          </label>
          <span className="text-sm text-gray-500">
            {parameters.presencePenalty?.toFixed(2) ?? '0.00'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={parameters.presencePenalty ?? 0.0}
          onChange={(e) =>
            handleChange('presencePenalty', parseFloat(e.target.value))
          }
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Presence Penalty"
        />
        <p className="text-xs text-gray-500 mt-1">
          Reduces repetition of tokens based on their presence.
        </p>
      </div>
    </div>
  );
};

export default ParameterControls;
