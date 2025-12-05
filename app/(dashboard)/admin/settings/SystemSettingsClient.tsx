'use client';

import { useState, useEffect } from 'react';

/**
 * System Settings Client Component
 *
 * Requirements: Admin Dashboard 4 - System Settings
 */

interface SystemSetting {
  key: string;
  value: any;
  description: string | null;
  category: string;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
  updater: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export function SystemSettingsClient() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<Record<string, SystemSetting[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: 'general',
    isPublic: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
        setGroupedSettings(data.groupedSettings);
      } else {
        console.error('Failed to fetch settings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Parse value as JSON if it looks like JSON
      let parsedValue = formData.value;
      try {
        parsedValue = JSON.parse(formData.value);
      } catch {
        // If not valid JSON, keep as string
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parsedValue,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setEditingSetting(null);
        setFormData({
          key: '',
          value: '',
          description: '',
          category: 'general',
          isPublic: false,
        });
        fetchSettings();
      } else {
        const data = await response.json();
        alert(`Failed to save setting: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('Failed to save setting');
    }
  };

  const handleEditSetting = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: typeof setting.value === 'string' 
        ? setting.value 
        : JSON.stringify(setting.value, null, 2),
      description: setting.description || '',
      category: setting.category,
      isPublic: setting.isPublic,
    });
    setShowAddModal(true);
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSettings();
      } else {
        const data = await response.json();
        alert(`Failed to delete setting: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting setting:', error);
      alert('Failed to delete setting');
    }
  };

  const categories = ['all', ...Object.keys(groupedSettings)];
  const displayedSettings = selectedCategory === 'all' 
    ? settings 
    : groupedSettings[selectedCategory] || [];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setEditingSetting(null);
            setFormData({
              key: '',
              value: '',
              description: '',
              category: 'general',
              isPublic: false,
            });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Setting
        </button>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading settings...</p>
          </div>
        ) : displayedSettings.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No settings found in this category
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedSettings.map((setting) => (
              <div key={setting.key} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {setting.key}
                      </h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {setting.category}
                      </span>
                      {setting.isPublic && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {setting.description}
                      </p>
                    )}
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Value:</p>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                        {typeof setting.value === 'string'
                          ? setting.value
                          : JSON.stringify(setting.value, null, 2)}
                      </pre>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Last updated by {setting.updater.firstName}{' '}
                      {setting.updater.lastName} on{' '}
                      {new Date(setting.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditSetting(setting)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSetting(setting.key)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {editingSetting ? 'Edit Setting' : 'Add Setting'}
            </h3>
            <form onSubmit={handleSaveSetting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  disabled={!!editingSetting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                  required
                  placeholder="e.g., ai.openai.api_key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use dot notation for nested keys (e.g., category.subcategory.key)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                <textarea
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  required
                  placeholder='String value or JSON: {"key": "value"}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a string value or valid JSON
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Brief description of this setting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="general">General</option>
                  <option value="ai">AI Providers</option>
                  <option value="billing">Billing</option>
                  <option value="email">Email</option>
                  <option value="security">Security</option>
                  <option value="features">Features</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Public (accessible to non-admin users)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingSetting ? 'Update Setting' : 'Create Setting'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSetting(null);
                    setFormData({
                      key: '',
                      value: '',
                      description: '',
                      category: 'general',
                      isPublic: false,
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
