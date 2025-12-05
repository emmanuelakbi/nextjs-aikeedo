/**
 * Document Repository Implementation
 * Requirements: Content Management 2.1, 2.2, 2.3
 */

import { PrismaClient } from '@prisma/client';
import {
  DocumentEntity,
  DocumentType,
} from '../../domain/document/entities/Document';
import {
  DocumentRepositoryInterface,
  DocumentSearchOptions,
} from '../../domain/document/repositories/DocumentRepositoryInterface';
import { prisma } from '../../lib/db';

export class DocumentRepository implements DocumentRepositoryInterface {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    const data = {
      id: document.getId(),
      workspaceId: document.getWorkspaceId(),
      userId: document.getUserId(),
      title: document.getTitle(),
      content: document.getContent(),
      type: document.getType(),
      fileId: document.getFileId(),
      generationId: document.getGenerationId(),
      createdAt: document.getCreatedAt(),
      updatedAt: document.getUpdatedAt(),
    };

    const record = await this.prisma.document.upsert({
      where: { id: document.getId() },
      create: data,
      update: {
        title: data.title,
        content: data.content,
        type: data.type,
        fileId: data.fileId,
        generationId: data.generationId,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapToEntity(record);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const record = await this.prisma.document.findUnique({
      where: { id },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    options?: DocumentSearchOptions
  ): Promise<DocumentEntity[]> {
    const where: any = {
      workspaceId,
      ...(options?.userId && { userId: options.userId }),
      ...(options?.type && { type: options.type }),
    };

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async countByWorkspaceId(
    workspaceId: string,
    options?: Omit<DocumentSearchOptions, 'limit' | 'offset'>
  ): Promise<number> {
    const where: any = {
      workspaceId,
      ...(options?.userId && { userId: options.userId }),
      ...(options?.type && { type: options.type }),
    };

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.document.count({ where });
  }

  async search(
    workspaceId: string,
    query: string,
    options?: Omit<DocumentSearchOptions, 'search'>
  ): Promise<DocumentEntity[]> {
    return this.findByWorkspaceId(workspaceId, {
      ...options,
      search: query,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.document.count({
      where: { id },
    });
    return count > 0;
  }

  async findByGenerationId(generationId: string): Promise<DocumentEntity[]> {
    const records = await this.prisma.document.findMany({
      where: { generationId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async findByFileId(fileId: string): Promise<DocumentEntity[]> {
    const records = await this.prisma.document.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  private mapToEntity(record: {
    id: string;
    workspaceId: string;
    userId: string;
    title: string;
    content: string;
    type: string;
    fileId: string | null;
    generationId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentEntity {
    return new DocumentEntity({
      id: record.id,
      workspaceId: record.workspaceId,
      userId: record.userId,
      title: record.title,
      content: record.content,
      type: record.type as DocumentType,
      fileId: record.fileId,
      generationId: record.generationId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
