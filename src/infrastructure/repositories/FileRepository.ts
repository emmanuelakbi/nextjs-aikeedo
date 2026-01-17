/**
 * File Repository Implementation
 * Requirements: Content Management 1.1
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { FileEntity } from '../../domain/file/entities/File';
import { FileRepositoryInterface } from '../../domain/file/repositories/FileRepositoryInterface';
import { prisma } from '../../lib/db/prisma';

export class FileRepository implements FileRepositoryInterface {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async save(file: FileEntity): Promise<FileEntity> {
    // Cast metadata to Prisma.InputJsonValue for JSON field compatibility
    const metadata = file.getMetadata() as Prisma.InputJsonValue;

    const data = {
      id: file.getId(),
      workspaceId: file.getWorkspaceId(),
      userId: file.getUserId(),
      name: file.getName(),
      type: file.getType(),
      size: file.getSize(),
      url: file.getUrl(),
      storageKey: file.getStorageKey(),
      metadata,
      createdAt: file.getCreatedAt(),
    };

    const record = await this.prisma.file.upsert({
      where: { id: file.getId() },
      create: data,
      update: data,
    });

    return this.mapToEntity(record);
  }

  async findById(id: string): Promise<FileEntity | null> {
    const record = await this.prisma.file.findUnique({
      where: { id },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    options?: {
      userId?: string;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<FileEntity[]> {
    const records = await this.prisma.file.findMany({
      where: {
        workspaceId,
        ...(options?.userId && { userId: options.userId }),
        ...(options?.type && { type: options.type }),
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
      userId?: string;
      type?: string;
    }
  ): Promise<number> {
    return this.prisma.file.count({
      where: {
        workspaceId,
        ...(options?.userId && { userId: options.userId }),
        ...(options?.type && { type: options.type }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.file.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.file.count({
      where: { id },
    });
    return count > 0;
  }

  private mapToEntity(record: {
    id: string;
    workspaceId: string;
    userId: string;
    name: string;
    type: string;
    size: number;
    url: string;
    storageKey: string;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }): FileEntity {
    // Safely convert Prisma JsonValue to Record<string, unknown>
    const metadata =
      record.metadata !== null &&
      typeof record.metadata === 'object' &&
      !Array.isArray(record.metadata)
        ? (record.metadata as Record<string, unknown>)
        : {};

    return new FileEntity({
      id: record.id,
      workspaceId: record.workspaceId,
      userId: record.userId,
      name: record.name,
      type: record.type,
      size: record.size,
      url: record.url,
      storageKey: record.storageKey,
      metadata,
      createdAt: record.createdAt,
    });
  }
}
