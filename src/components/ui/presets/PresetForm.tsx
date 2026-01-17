'use client';

import React, { useState, FormEvent } from 'react';
import Button from '../Button';
import Input from '../Input';
import Label from '../Label';

export interface PresetFormData {
  name: string;
  description: string;
  category: string;
  template: string;
  model: string;
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  isPublic: boolean;
}

export interface PresetFormProps {
  initialData?: Partial<PresetFormData>;
  onSubmit: (data: PresetFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  className?: string;
}

const PresetForm: React.FC<PresetFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = 'Save Preset',
  className = '',
}) => {
  const [formData, setFormData] = useState<PresetFormData>({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? '',
    template: initialData?.template ?? '',
    model: initialData?.model ?? 'gpt-4',
    parameters: {
      temperature: initialData?.parameters?.temperature ?? 0.7,
      maxTokens: initialData?.parameters?.maxTokens ?? 1000,
      topP: initialData?.parameters?.topP ?? 1,
    },
    isPublic: initialData?.isPublic ?? false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof PresetFormData, string>>
  >({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PresetFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.template.trim()) {
      newErrors.template = 'Template is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    field: keyof PresetFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleParameterChange = (
    param: keyof PresetFormData['parameters'],
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [param]: value,
      },
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="e.g., Blog Post Writer"
              required
              disabled={isLoading}
            />

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what this preset does..."
                rows={3}
                disabled={isLoading}
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-offset-0
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  transition-colors duration-200 text-gray-900 placeholder-gray-400
                  ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }
                `}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.description}
                </p>
              )}
            </div>

            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              error={errors.category}
              placeholder="e.g., Content Writing, Marketing, Code"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Template */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Template</h3>
          <div>
            <Label htmlFor="template">Prompt Template</Label>
            <textarea
              id="template"
              value={formData.template}
              onChange={(e) => handleChange('template', e.target.value)}
              placeholder="Enter your prompt template here..."
              rows={6}
              disabled={isLoading}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm font-mono text-sm
                focus:outline-none focus:ring-2 focus:ring-offset-0
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors duration-200 text-gray-900 placeholder-gray-400
                ${
                  errors.template
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }
              `}
            />
            {errors.template && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.template}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use variables like {'{topic}'} or {'{style}'} in your template
            </p>
          </div>
        </div>

        {/* Model Configuration */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Model Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gemini-pro">Gemini Pro</option>
                <option value="mistral-large">Mistral Large</option>
              </select>
            </div>

            <div>
              <Label htmlFor="temperature">
                Temperature: {formData.parameters.temperature}
              </Label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.parameters.temperature}
                onChange={(e) =>
                  handleParameterChange(
                    'temperature',
                    parseFloat(e.target.value)
                  )
                }
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls randomness: 0 is focused, 2 is creative
              </p>
            </div>

            <div>
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <input
                id="maxTokens"
                type="number"
                min="1"
                max="4000"
                value={formData.parameters.maxTokens}
                onChange={(e) =>
                  handleParameterChange('maxTokens', parseInt(e.target.value))
                }
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <Label htmlFor="topP">Top P: {formData.parameters.topP}</Label>
              <input
                id="topP"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.parameters.topP}
                onChange={(e) =>
                  handleParameterChange('topP', parseFloat(e.target.value))
                }
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls diversity via nucleus sampling
              </p>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Visibility
          </h3>
          <div className="flex items-center">
            <input
              id="isPublic"
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => handleChange('isPublic', e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="isPublic" className="ml-2 mb-0">
              Make this preset public (visible to all workspace members)
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            {submitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PresetForm;
