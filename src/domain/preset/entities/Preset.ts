import { Id } from '../../user/value-objects/Id';

/**
 * Preset Entity
 *
 * Represents a pre-configured AI settings template.
 * Requirements: 9.1, 9.2, 9.3
 */

export interface PresetProps {
  id: Id;
  workspaceId: string | null;
  name: string;
  description: string;
  category: string;
  template: string;
  model: string;
  parameters: Record<string, any>;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePresetProps {
  workspaceId?: string | null;
  name: string;
  description: string;
  category: string;
  template: string;
  model: string;
  parameters?: Record<string, any>;
  isPublic?: boolean;
}

export class Preset {
  private readonly props: PresetProps;

  private constructor(props: PresetProps) {
    this.props = props;
  }

  /**
   * Creates a new Preset entity
   * Requirements: 9.1
   */
  static create(createProps: CreatePresetProps): Preset {
    // Validate required fields
    if (!createProps.name?.trim()) {
      throw new Error('Preset name is required');
    }

    if (!createProps.description?.trim()) {
      throw new Error('Preset description is required');
    }

    if (!createProps.category?.trim()) {
      throw new Error('Preset category is required');
    }

    if (!createProps.template?.trim()) {
      throw new Error('Preset template is required');
    }

    if (!createProps.model?.trim()) {
      throw new Error('Model is required');
    }

    const now = new Date();
    const props: PresetProps = {
      id: Id.generate(),
      workspaceId: createProps.workspaceId || null,
      name: createProps.name.trim(),
      description: createProps.description.trim(),
      category: createProps.category.trim(),
      template: createProps.template.trim(),
      model: createProps.model,
      parameters: createProps.parameters || {},
      isPublic: createProps.isPublic ?? false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return new Preset(props);
  }

  /**
   * Reconstitutes a Preset entity from persistence
   */
  static fromPersistence(props: PresetProps): Preset {
    return new Preset(props);
  }

  /**
   * Updates the preset details
   * Requirements: 9.4
   */
  update(data: {
    name?: string;
    description?: string;
    category?: string;
    template?: string;
    model?: string;
    parameters?: Record<string, any>;
    isPublic?: boolean;
  }): void {
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) {
        throw new Error('Preset name cannot be empty');
      }
      this.props.name = trimmed;
    }

    if (data.description !== undefined) {
      const trimmed = data.description.trim();
      if (!trimmed) {
        throw new Error('Preset description cannot be empty');
      }
      this.props.description = trimmed;
    }

    if (data.category !== undefined) {
      const trimmed = data.category.trim();
      if (!trimmed) {
        throw new Error('Preset category cannot be empty');
      }
      this.props.category = trimmed;
    }

    if (data.template !== undefined) {
      const trimmed = data.template.trim();
      if (!trimmed) {
        throw new Error('Preset template cannot be empty');
      }
      this.props.template = trimmed;
    }

    if (data.model !== undefined) {
      if (!data.model.trim()) {
        throw new Error('Model cannot be empty');
      }
      this.props.model = data.model;
    }

    if (data.parameters !== undefined) {
      this.props.parameters = data.parameters;
    }

    if (data.isPublic !== undefined) {
      this.props.isPublic = data.isPublic;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Increments the usage count
   * Requirements: 9.5
   */
  incrementUsageCount(): void {
    this.props.usageCount += 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Checks if preset is a system preset (no workspace)
   * Requirements: 9.1
   */
  isSystemPreset(): boolean {
    return this.props.workspaceId === null;
  }

  /**
   * Checks if preset belongs to a workspace
   * Requirements: 9.1
   */
  belongsToWorkspace(workspaceId: string): boolean {
    return this.props.workspaceId === workspaceId;
  }

  /**
   * Checks if preset is accessible to a workspace
   * Requirements: 9.2, 9.4
   */
  isAccessibleToWorkspace(workspaceId: string): boolean {
    // System presets are accessible to all
    if (this.isSystemPreset() && this.props.isPublic) {
      return true;
    }

    // Workspace-specific presets are only accessible to their workspace
    return this.belongsToWorkspace(workspaceId);
  }

  // Getters
  getId(): Id {
    return this.props.id;
  }

  getWorkspaceId(): string | null {
    return this.props.workspaceId;
  }

  getName(): string {
    return this.props.name;
  }

  getDescription(): string {
    return this.props.description;
  }

  getCategory(): string {
    return this.props.category;
  }

  getTemplate(): string {
    return this.props.template;
  }

  getModel(): string {
    return this.props.model;
  }

  getParameters(): Record<string, any> {
    return this.props.parameters;
  }

  getIsPublic(): boolean {
    return this.props.isPublic;
  }

  getUsageCount(): number {
    return this.props.usageCount;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  toPersistence(): PresetProps {
    return { ...this.props };
  }
}
