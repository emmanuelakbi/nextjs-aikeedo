import { describe, it, expect } from 'vitest';
import React from 'react';
import {
  PresetCard,
  PresetSelector,
  PresetForm,
  PresetCategory,
} from '../presets';

describe('Preset Components', () => {
  describe('PresetCard', () => {
    it('should render with required props', () => {
      const component = (
        <PresetCard
          id="test-1"
          name="Test Preset"
          description="Test description"
          category="Test"
          model="gpt-4"
          usageCount={10}
          isPublic={true}
        />
      );
      expect(component.props.name).toBe('Test Preset');
      expect(component.props.category).toBe('Test');
    });

    it('should accept action callbacks', () => {
      const onSelect = () => {};
      const component = (
        <PresetCard
          id="test-1"
          name="Test"
          description="Desc"
          category="Cat"
          model="gpt-4"
          usageCount={5}
          isPublic={false}
          onSelect={onSelect}
        />
      );
      expect(component.props.onSelect).toBe(onSelect);
    });
  });

  describe('PresetSelector', () => {
    const mockPresets = [
      {
        id: '1',
        name: 'Preset 1',
        description: 'Description 1',
        category: 'Category 1',
        model: 'gpt-4',
        template: 'Template 1',
        parameters: {},
        isPublic: true,
        usageCount: 5,
      },
    ];

    it('should render with presets', () => {
      const onSelect = () => {};
      const component = (
        <PresetSelector presets={mockPresets} onSelect={onSelect} />
      );
      expect(component.props).toHaveProperty('presets');
      expect(component.props.presets).toEqual(mockPresets);
    });

    it('should accept selected preset ID', () => {
      const component = (
        <PresetSelector
          presets={mockPresets}
          selectedPresetId="1"
          onSelect={() => {}}
        />
      );
      expect(component.props.selectedPresetId).toBe('1');
    });
  });

  describe('PresetForm', () => {
    it('should render with onSubmit callback', () => {
      const onSubmit = () => {};
      const component = <PresetForm onSubmit={onSubmit} />;
      expect(component.props.onSubmit).toBe(onSubmit);
    });

    it('should accept initial data', () => {
      const initialData = {
        name: 'Test',
        description: 'Test desc',
        category: 'Test cat',
        template: 'Test template',
        model: 'gpt-4',
        parameters: {},
        isPublic: false,
      };
      const component = (
        <PresetForm initialData={initialData} onSubmit={() => {}} />
      );
      expect(component.props.initialData).toEqual(initialData);
    });

    it('should show loading state', () => {
      const component = <PresetForm onSubmit={() => {}} isLoading={true} />;
      expect(component.props.isLoading).toBe(true);
    });
  });

  describe('PresetCategory', () => {
    it('should render with category and count', () => {
      const component = <PresetCategory category="Test" count={5} />;
      expect(component.props.category).toBe('Test');
      expect(component.props.count).toBe(5);
    });

    it('should accept active state', () => {
      const component = (
        <PresetCategory category="Test" count={5} isActive={true} />
      );
      expect(component.props.isActive).toBe(true);
    });

    it('should accept onClick callback', () => {
      const onClick = () => {};
      const component = (
        <PresetCategory category="Test" count={5} onClick={onClick} />
      );
      expect(component.props.onClick).toBe(onClick);
    });
  });
});
