import { Preset, PresetProps } from '../../domain/preset/entities/Preset';
import { Id } from '../../domain/user/value-objects/Id';
import { prisma } from '../../lib/db';
import { Prisma } from '@prisma/client';

/**
 * PresetRepository - Prisma implementation
 *
 * Handles persistence operations for Preset entities.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

export interface CreatePresetData {
  workspaceId?: string | null;
  name: string;
  description: string;
  category: string;
  template: string;
  model: string;
  parameters?: Record<string, any>;
  isPublic?: boolean;
}

export interface UpdatePresetData {
  name?: string;
  description?: string;
  category?: string;
  template?: string;
  model?: string;
  parameters?: Record<string, any>;
  isPublic?: boolean;
}

export interface ListPresetsOptions {
  workspaceId?: string | null;
  category?: string;
  isPublic?: boolean;
  includeSystemPresets?: boolean;
  limit?: number;
  offset?: number;
}

export class PresetRepository {
  /**
   * Creates a new preset in the database
   * Requirements: 9.1
   */
  async create(data: CreatePresetData): Promise<Preset> {
    try {
      const preset = await prisma.preset.create({
        data: {
          workspaceId: data.workspaceId || null,
          name: data.name,
          description: data.description,
          category: data.category,
          template: data.template,
          model: data.model,
          parameters: data.parameters || {},
          isPublic: data.isPublic ?? false,
        },
      });

      return this.toDomain(preset);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Workspace does not exist');
        }
      }
      throw new Error(
        `Failed to create preset: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds a preset by ID
   * Requirements: 9.3
   */
  async findById(id: string): Promise<Preset | null> {
    try {
      const preset = await prisma.preset.findUnique({
        where: { id },
      });

      return preset ? this.toDomain(preset) : null;
    } catch (error) {
      throw new Error(
        `Failed to find preset by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Lists presets with optional filters
   * Requirements: 9.2
   */
  async list(options: ListPresetsOptions = {}): Promise<Preset[]> {
    try {
      const where: Prisma.PresetWhereInput = {};

      if (options.workspaceId !== undefined) {
        where.workspaceId = options.workspaceId;
      }

      if (options.category) {
        where.category = options.category;
      }

      if (options.isPublic !== undefined) {
        where.isPublic = options.isPublic;
      }

      // Include system presets (workspaceId = null) if requested
      if (options.includeSystemPresets && options.workspaceId) {
        where.OR = [
          { workspaceId: options.workspaceId },
          { workspaceId: null, isPublic: true },
        ];
        delete where.workspaceId;
      }

      const presets = await prisma.preset.findMany({
        where,
        orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
        take: options.limit,
        skip: options.offset,
      });

      return presets.map((p) => this.toDomain(p));
    } catch (error) {
      throw new Error(
        `Failed to list presets: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Finds presets by workspace ID (includes system presets)
   * Requirements: 9.2
   */
  async findByWorkspaceId(workspaceId: string): Promise<Preset[]> {
    return this.list({
      workspaceId,
      includeSystemPresets: true,
    });
  }

  /**
   * Finds presets by category
   * Requirements: 9.2
   */
  async findByCategory(
    category: string,
    workspaceId?: string
  ): Promise<Preset[]> {
    return this.list({
      category,
      workspaceId,
      includeSystemPresets: !!workspaceId,
    });
  }

  /**
   * Finds all system presets (public presets with no workspace)
   * Requirements: 9.2
   */
  async findSystemPresets(): Promise<Preset[]> {
    return this.list({
      workspaceId: null,
      isPublic: true,
    });
  }

  /**
   * Updates a preset
   * Requirements: 9.4
   */
  async update(id: string, data: UpdatePresetData): Promise<Preset> {
    try {
      const preset = await prisma.preset.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return this.toDomain(preset);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Preset not found');
        }
      }
      throw new Error(
        `Failed to update preset: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Increments the usage count for a preset
   * Requirements: 9.5
   */
  async incrementUsageCount(id: string): Promise<void> {
    try {
      await prisma.preset.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Preset not found');
        }
      }
      throw new Error(
        `Failed to increment usage count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deletes a preset
   * Requirements: 9.5
   */
  async delete(id: string): Promise<void> {
    try {
      await prisma.preset.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Preset not found');
        }
      }
      throw new Error(
        `Failed to delete preset: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves a Preset entity (create or update)
   */
  async save(preset: Preset): Promise<Preset> {
    const props = preset.toPersistence();
    const id = props.id.getValue();

    try {
      const existingPreset = await prisma.preset.findUnique({
        where: { id },
      });

      if (existingPreset) {
        // Update existing preset
        const updated = await prisma.preset.update({
          where: { id },
          data: {
            name: props.name,
            description: props.description,
            category: props.category,
            template: props.template,
            model: props.model,
            parameters: props.parameters,
            isPublic: props.isPublic,
            usageCount: props.usageCount,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(updated);
      } else {
        // Create new preset
        const created = await prisma.preset.create({
          data: {
            id,
            workspaceId: props.workspaceId,
            name: props.name,
            description: props.description,
            category: props.category,
            template: props.template,
            model: props.model,
            parameters: props.parameters,
            isPublic: props.isPublic,
            usageCount: props.usageCount,
            createdAt: props.createdAt,
            updatedAt: props.updatedAt,
          },
        });

        return this.toDomain(created);
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error('Workspace does not exist');
        }
      }
      throw new Error(
        `Failed to save preset: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Converts Prisma preset model to domain Preset entity
   */
  private toDomain(prismaPreset: any): Preset {
    const props: PresetProps = {
      id: Id.fromString(prismaPreset.id),
      workspaceId: prismaPreset.workspaceId,
      name: prismaPreset.name,
      description: prismaPreset.description,
      category: prismaPreset.category,
      template: prismaPreset.template,
      model: prismaPreset.model,
      parameters: prismaPreset.parameters as Record<string, any>,
      isPublic: prismaPreset.isPublic,
      usageCount: prismaPreset.usageCount,
      createdAt: prismaPreset.createdAt,
      updatedAt: prismaPreset.updatedAt,
    };

    return Preset.fromPersistence(props);
  }
}
