/**
 * Optimized User Repository
 *
 * Extended UserRepository with query optimizations:
 * - Field selection to reduce data transfer
 * - Query batching for multiple operations
 * - Efficient pagination
 *
 * Requirements: Performance considerations
 */

import { UserRepository } from './UserRepository';
import { prisma } from '../../lib/db';
import {
  UserSelect,
  getPaginationParams,
  getCursorPaginationParams,
} from '../../lib/db/query-optimizer';
import { User } from '../../domain/user/entities/User';

export class OptimizedUserRepository extends UserRepository {
  /**
   * Find user with minimal fields (for lists)
   * More efficient than fetching full user object
   */
  async findByIdMinimal(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: UserSelect.minimal,
    });

    return user;
  }

  /**
   * Find user with workspace info
   * Efficiently loads user with their current workspace in one query
   */
  async findByIdWithWorkspace(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: UserSelect.withWorkspace,
    });

    return user;
  }

  /**
   * Find multiple users by IDs efficiently
   * Uses a single query instead of multiple findById calls
   */
  async findByIds(ids: string[]): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return users.map((u) => this['toDomain'](u));
  }

  /**
   * List users with pagination
   * Efficient offset-based pagination
   */
  async list(page: number = 1, pageSize: number = 20) {
    const { skip, take } = getPaginationParams(page, pageSize);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: UserSelect.profile,
      }),
      prisma.user.count(),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * List users with cursor-based pagination
   * More efficient for large datasets
   */
  async listCursor(cursor: string | null = null, pageSize: number = 20) {
    const params = getCursorPaginationParams(cursor, pageSize);

    const users = await prisma.user.findMany({
      ...params,
      orderBy: { createdAt: 'desc' },
      select: UserSelect.profile,
    });

    const lastUser = users[users.length - 1];

    return {
      users,
      nextCursor: users.length === pageSize && lastUser ? lastUser.id : null,
      hasMore: users.length === pageSize,
    };
  }

  /**
   * Search users by email or name
   * Optimized with proper indexing
   */
  async search(query: string, limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: Math.min(limit, 50), // Max 50 results
      select: UserSelect.minimal,
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Count users by status
   * Efficient aggregation query
   */
  async countByStatus() {
    const counts = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    return counts.reduce(
      (acc, item) => {
        const count = item._count?.id;
        if (count !== undefined) {
          acc[item.status] = count;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Get recently active users
   * Optimized query with index on lastSeenAt
   */
  async getRecentlyActive(limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        lastSeenAt: {
          not: null,
        },
      },
      take: Math.min(limit, 50),
      orderBy: { lastSeenAt: 'desc' },
      select: UserSelect.minimal,
    });

    return users;
  }
}
