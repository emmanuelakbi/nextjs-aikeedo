/**
 * Voice Repository Implementation
 * Requirements: Content Management 4.1
 */

import { PrismaClient } from '@prisma/client';
import { VoiceEntity, VoiceStatus } from '../../domain/voice/entities/Voice';
import { VoiceRepositoryInterface } from '../../domain/voice/repositories/VoiceRepositoryInterface';
import { prisma } from '../../lib/db/prisma';

export class VoiceRepository implements VoiceRepositoryInterface {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async save(voice: VoiceEntity): Promise<VoiceEntity> {
    const data = {
      id: voice.getId(),
      workspaceId: voice.getWorkspaceId(),
      name: voice.getName(),
      description: voice.getDescription(),
      sampleFileId: voice.getSampleFileId(),
      modelId: voice.getModelId(),
      status: voice.getStatus(),
      createdAt: voice.getCreatedAt(),
    };

    const record = await this.prisma.voice.upsert({
      where: { id: voice.getId() },
      create: data,
      update: data,
    });

    return this.mapToEntity(record);
  }

  async findById(id: string): Promise<VoiceEntity | null> {
    const record = await this.prisma.voice.findUnique({
      where: { id },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    options?: {
      status?: VoiceStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<VoiceEntity[]> {
    const records = await this.prisma.voice.findMany({
      where: {
        workspaceId,
        ...(options?.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async countByWorkspaceId(
    workspaceId: string,
    options?: {
      status?: VoiceStatus;
    }
  ): Promise<number> {
    return this.prisma.voice.count({
      where: {
        workspaceId,
        ...(options?.status && { status: options.status }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.voice.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.voice.count({
      where: { id },
    });
    return count > 0;
  }

  private mapToEntity(record: {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    sampleFileId: string;
    modelId: string | null;
    status: string;
    createdAt: Date;
  }): VoiceEntity {
    return new VoiceEntity({
      id: record.id,
      workspaceId: record.workspaceId,
      name: record.name,
      description: record.description,
      sampleFileId: record.sampleFileId,
      modelId: record.modelId,
      status: record.status as VoiceStatus,
      createdAt: record.createdAt,
    });
  }
}
