'use client';

/**
 * Preset Management Page
 *
 * Allows users to view, create, edit, and delete AI prompt presets.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PresetCard from '@/components/ui/presets/PresetCard';
import PresetForm, { PresetFormData } from '@/components/ui/presets/PresetForm';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SuccessMessage from '@/components/ui/SuccessMessage';

interface Preset {
  id: string;
  workspaceId: string | null;
  name: string;
  description: string;
  category: string;
  template: string;
  model: string;
  parameters: Record<string, unknown>;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PresetsPage() {
  const router = useRouter();

  // State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [filteredPresets, setFilteredPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_deletingPresetId, setDeletingPresetId] = useState<string | null>(
    null
  );

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  // Load presets on mount
  useEffect(() => {
    void loadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter presets when filters change
  useEffect(() => {
    filterPresets();
  }, [presets, searchQuery, selectedCategory, showPublicOnly]);

  const loadPresets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/presets?includeSystemPresets=true');

      if (!response.ok) {
        throw new Error('Failed to load presets');
      }

      const data = (await response.json()) as { data: Preset[] };
      setPresets(data.data);
    } catch (err) {
      console.error('Error loading presets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load presets');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPresets = () => {
    let filtered = [...presets];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by public status
    if (showPublicOnly) {
      filtered = filtered.filter((p) => p.isPublic);
    }

    setFilteredPresets(filtered);
  };

  const handleCreatePreset = async (data: PresetFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Get workspace ID from session
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      const workspaceId = sessionData?.user?.currentWorkspaceId;

      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId && { 'x-workspace-id': workspaceId }),
        },
        body: JSON.stringify({
          ...data,
          workspaceId,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(errorData.error?.message ?? 'Failed to create preset');
      }

      const result = (await response.json()) as { data: Preset };

      // Add new preset to list
      setPresets((prev) => [result.data, ...prev]);

      // Close form and show success message
      setShowCreateForm(false);
      setSuccessMessage('Preset created successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error creating preset:', err);
      setError(err instanceof Error ? err.message : 'Failed to create preset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePreset = async (data: PresetFormData) => {
    if (!editingPreset) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Get workspace ID from session
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      const workspaceId = sessionData?.user?.currentWorkspaceId;

      const response = await fetch(`/api/presets/${editingPreset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId && { 'x-workspace-id': workspaceId }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(errorData.error?.message ?? 'Failed to update preset');
      }

      const result = (await response.json()) as { data: Preset };

      // Update preset in list
      setPresets((prev) =>
        prev.map((p) => (p.id === editingPreset.id ? result.data : p))
      );

      // Close form and show success message
      setEditingPreset(null);
      setSuccessMessage('Preset updated successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error updating preset:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    try {
      setDeletingPresetId(id);
      setError(null);

      // Get workspace ID from session
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      const workspaceId = sessionData?.user?.currentWorkspaceId;

      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE',
        headers: {
          ...(workspaceId && { 'x-workspace-id': workspaceId }),
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(errorData.error?.message ?? 'Failed to delete preset');
      }

      // Remove preset from list
      setPresets((prev) => prev.filter((p) => p.id !== id));

      setSuccessMessage('Preset deleted successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error deleting preset:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete preset');
    } finally {
      setDeletingPresetId(null);
    }
  };

  const handleEditPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setEditingPreset(preset);
      setShowCreateForm(false);
    }
  };

  const handleUsePreset = (id: string) => {
    // Navigate to generation page with preset selected
    router.push(`/generate?presetId=${id}`);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingPreset(null);
    setError(null);
  };

  // Get unique categories
  const categories = Array.from(new Set(presets.map((p) => p.category))).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Preset Library</h1>
          <p className="mt-2 text-gray-600">
            Manage your AI prompt templates and configurations
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {successMessage && (
          <div className="mb-6">
            <SuccessMessage
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            />
          </div>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingPreset) && (
          <div className="mb-8">
            <PresetForm
              initialData={
                editingPreset
                  ? {
                      name: editingPreset.name,
                      description: editingPreset.description,
                      category: editingPreset.category,
                      template: editingPreset.template,
                      model: editingPreset.model,
                      parameters: editingPreset.parameters,
                      isPublic: editingPreset.isPublic,
                    }
                  : undefined
              }
              onSubmit={editingPreset ? handleUpdatePreset : handleCreatePreset}
              onCancel={handleCancelForm}
              isLoading={isSubmitting}
              submitButtonText={
                editingPreset ? 'Update Preset' : 'Create Preset'
              }
            />
          </div>
        )}

        {/* Filters and Actions */}
        {!showCreateForm && !editingPreset && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search presets..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  {/* Public Filter */}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPublicOnly}
                      onChange={(e) => setShowPublicOnly(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Public only</span>
                  </label>

                  {/* Create Button */}
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    variant="primary"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Preset
                  </Button>
                </div>
              </div>
            </div>

            {/* Preset Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : filteredPresets.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No presets found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedCategory !== 'all' || showPublicOnly
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first preset'}
                </p>
                {!searchQuery &&
                  selectedCategory === 'all' &&
                  !showPublicOnly && (
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="primary"
                    >
                      Create Your First Preset
                    </Button>
                  )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    id={preset.id}
                    name={preset.name}
                    description={preset.description}
                    category={preset.category}
                    model={preset.model}
                    usageCount={preset.usageCount}
                    isPublic={preset.isPublic}
                    onSelect={handleUsePreset}
                    onEdit={
                      preset.workspaceId !== null ? handleEditPreset : undefined
                    }
                    onDelete={
                      preset.workspaceId !== null
                        ? handleDeletePreset
                        : undefined
                    }
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
