# Preset Components

This directory contains UI components for managing and displaying AI presets.

## Components

### PresetCard

Displays a single preset with its details and action buttons.

**Props:**

- `id`: Unique identifier for the preset
- `name`: Preset name
- `description`: Preset description
- `category`: Category the preset belongs to
- `model`: AI model used by the preset
- `usageCount`: Number of times the preset has been used
- `isPublic`: Whether the preset is public or private
- `onSelect`: Callback when "Use Preset" is clicked
- `onEdit`: Callback when edit button is clicked
- `onDelete`: Callback when delete button is clicked
- `showActions`: Whether to show action buttons (default: true)

**Example:**

```tsx
<PresetCard
  id="preset-1"
  name="Blog Post Writer"
  description="Generate engaging blog posts on any topic"
  category="Content Writing"
  model="gpt-4"
  usageCount={42}
  isPublic={true}
  onSelect={(id) => console.log('Selected:', id)}
  onEdit={(id) => console.log('Edit:', id)}
  onDelete={(id) => console.log('Delete:', id)}
/>
```

### PresetSelector

A dropdown selector for choosing from available presets.

**Props:**

- `presets`: Array of preset objects
- `selectedPresetId`: Currently selected preset ID
- `onSelect`: Callback when a preset is selected
- `onClear`: Callback when selection is cleared
- `showSearch`: Whether to show search input (default: true)
- `filterByCategory`: Filter presets by category

**Example:**

```tsx
<PresetSelector
  presets={presets}
  selectedPresetId={selectedId}
  onSelect={(preset) => setSelectedPreset(preset)}
  onClear={() => setSelectedPreset(null)}
  placeholder="Choose a preset..."
/>
```

### PresetForm

A form for creating or editing presets.

**Props:**

- `initialData`: Initial form data for editing
- `onSubmit`: Callback when form is submitted
- `onCancel`: Callback when cancel button is clicked
- `isLoading`: Whether the form is in loading state
- `submitButtonText`: Text for submit button (default: "Save Preset")

**Example:**

```tsx
<PresetForm
  initialData={existingPreset}
  onSubmit={(data) => savePreset(data)}
  onCancel={() => setShowForm(false)}
  isLoading={isSaving}
  submitButtonText="Update Preset"
/>
```

### PresetCategory

A category button/badge for filtering presets.

**Props:**

- `category`: Category name
- `count`: Number of presets in this category
- `isActive`: Whether this category is currently selected
- `onClick`: Callback when category is clicked
- `icon`: Optional custom icon

**Example:**

```tsx
<PresetCategory
  category="Content Writing"
  count={15}
  isActive={selectedCategory === 'Content Writing'}
  onClick={(cat) => setSelectedCategory(cat)}
/>
```

## Usage Example

Here's a complete example showing how to use these components together:

```tsx
'use client';

import React, { useState } from 'react';
import {
  PresetCard,
  PresetSelector,
  PresetForm,
  PresetCategory,
} from '@/components/ui/presets';

export default function PresetsPage() {
  const [presets, setPresets] = useState([...]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);

  const categories = [
    { name: 'All', count: presets.length },
    { name: 'Content Writing', count: 15 },
    { name: 'Marketing', count: 8 },
    { name: 'Code', count: 12 },
  ];

  const filteredPresets = selectedCategory === 'All'
    ? presets
    : presets.filter(p => p.category === selectedCategory);

  return (
    <div className="container mx-auto p-6">
      {/* Category filters */}
      <div className="mb-6 flex gap-3">
        {categories.map((cat) => (
          <PresetCategory
            key={cat.name}
            category={cat.name}
            count={cat.count}
            isActive={selectedCategory === cat.name}
            onClick={setSelectedCategory}
          />
        ))}
      </div>

      {/* Preset selector */}
      <div className="mb-6">
        <PresetSelector
          presets={presets}
          selectedPresetId={selectedPreset?.id}
          onSelect={setSelectedPreset}
          onClear={() => setSelectedPreset(null)}
        />
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => (
          <PresetCard
            key={preset.id}
            {...preset}
            onSelect={(id) => handleUsePreset(id)}
            onEdit={(id) => handleEditPreset(id)}
            onDelete={(id) => handleDeletePreset(id)}
          />
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <PresetForm
              onSubmit={handleSavePreset}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Requirements Validation

These components satisfy the following requirements from the AI Services specification:

- **Requirement 9.1**: Display categorized preset templates
- **Requirement 9.2**: Pre-fill prompts with selected preset templates
- **Requirement 9.3**: Create and save presets for reuse
