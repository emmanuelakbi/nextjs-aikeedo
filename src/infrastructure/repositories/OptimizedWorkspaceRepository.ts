/**
 * Optimized Workspace Repository
 *
 * Extended WorkspaceRepository with query optimizations:
 * - Field selection to reduce data transfer
 * - Query batching for multiple operations
 * - Efficient pagination and filtering
 *
 * Requirements: Performance considerations
 */

import { WorkspaceRepository } from './WorkspaceRepository';
import { prisma } from '../../lib/db';
import {
  WorkspaceSelect,
  getPaginationParams,
  getCursorPaginationParams,
} from '../../lib/db/query-optimizer';
import { Workspace } from '../../domain/workspace/entities/Workspace';

export class OptimizedWorkspaceRepository extends WorkspaceRepository {
  /**
   * Find workspace with minimal fields
   * More efficient than fetching full workspace object
   */
  async findByIdMinimal(id: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: WorkspaceSelect.minimal,
    });

    return workspace;
  }

  /**
   * Find workspace with owner info
   * Efficiently loads workspace with owner in one query
   */
  async findByIdWithOwner(id: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: WorkspaceSelect.withOwner,
    });

    return workspace;
  }

  /**
   * Find multiple workspaces by IDs efficiently
   * Uses a single query instead of multiple findById calls
   */
  async findByIds(ids: string[]): Promise<Workspace[]> {
    const workspaces = await prisma.workspace.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return workspaces.map((w) => this['toDomain'](w));
  }

  /**
   * Find workspaces by user ID with pagination
   * Efficient query with proper indexing
   */
  async findByUserIdPaginated(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ) {
    const { skip, take } = getPaginationParams(page, pageSize);

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where: { ownerId: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: WorkspaceSelect.withCredits,
      }),
      prisma.workspace.count({
        where: { ownerId: userId },
      }),
    ]);

    return {
      workspaces,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get workspace credit summary
   * Efficient aggregation query
   */
  async getCreditSummary(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        creditCount: true,
        allocatedCredits: true,
        isTrialed: true,
      },
    });

    if (!workspace) {
      return null;
    }

    return {
      available: workspace.creditCount,
      allocated: workspace.allocatedCredits,
      remaining: workspace.creditCount - workspace.allocatedCredits,
      isTrialed: workspace.isTrialed,
    };
  }

  /**
   * List workspaces with low credits
   * Useful for monitoring and alerts
   */
  async findLowCreditWorkspaces(threshold: number = 100, limit: number = 50) {
    const workspaces = await prisma.workspace.findMany({
      where: {
        creditCount: {
          lt: threshold,
        },
      },
      take: Math.min(limit, 100),
      orderBy: { creditCount: 'asc' },
      select: WorkspaceSelect.withOwner,
    });

    return workspaces;
  }

  /**
   * Count workspaces by trial status
   * Efficient aggregation query
   */
  async countByTrialStatus() {
    const counts = await prisma.workspace.groupBy({
      by: ['isTrialed'],
      _count: {
        id: true,
      },
    });

    return {
      trialed: counts.find((c) => c.isTrialed)?._count.id || 0,
      notTrialed: counts.find((c) => !c.isTrialed)?._count.id || 0,
    };
  }

  /**
   * Get workspace statistics
   * Aggregated data for analytics
   */
  async getStatistics() {
    const [totalWorkspaces, totalCredits, avgCredits] = await Promise.all([
      prisma.workspace.count(),
      prisma.workspace.aggregate({
        _sum: {
          creditCount: true,
        },
      }),
      prisma.workspace.aggregate({
        _avg: {
          creditCount: true,
        },
      }),
    ]);

    return {
      total: totalWorkspaces,
      totalCredits: totalCredits._sum.creditCount || 0,
      averageCredits: Math.round(avgCredits._avg.creditCount || 0),
    };
  }

  /**
   * Batch update credits for multiple workspaces
   * More efficient than individual updates
   */
  async batchUpdateCredits(
    updates: Array<{ id: string; creditCount: number }>
  ) {
    const updatePromises = updates.map(({ id, creditCount }) =>
      prisma.workspace.update({
        where: { id },
        data: {
          creditCount,
          creditsAdjustedAt: new Date(),
        },
      })
    );

    return Promise.all(updatePromises);
  }
}
