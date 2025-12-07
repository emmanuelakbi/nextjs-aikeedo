/**
 * Optimized API Route Example
 *
 * Demonstrates API performance optimizations:
 * - Query optimization with field selection
 * - Caching layer
 * - Performance monitoring
 * - Batch loading
 *
 * This is an example file showing how to use the performance utilities.
 * Requirements: Performance considerations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, UserSelect, withQueryOptimization } from '@/lib/db';
import { getCacheWrapper, CacheKeys, CacheTags } from '@/lib/cache';
import {
  withPerformanceMonitoring,
  withOptimizations,
} from '@/lib/middleware/performance-middleware';

export const dynamic = 'force-dynamic';



/**
 * GET /api/users/optimized-example
 *
 * Example of an optimized API route that:
 * 1. Uses field selection to limit data transfer
 * 2. Implements caching to reduce database load
 * 3. Monitors performance
 * 4. Adds appropriate cache headers
 */
async function handleGetUsers(_req: NextRequest) {
  const cache = getCacheWrapper();

  // Get or compute users list with caching
  const users = await cache.getOrCompute(
    CacheKeys.user('list'),
    async () => {
      // Use query optimization wrapper
      return withQueryOptimization('getUsersList', async () => {
        // Use predefined field selection to limit data transfer
        return prisma.user.findMany({
          select: UserSelect.minimal,
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
        });
      });
    },
    {
      ttl: 300, // Cache for 5 minutes
      tags: [CacheTags.users],
    }
  );

  return NextResponse.json({
    users,
    cached: true,
  });
}

/**
 * GET /api/users/optimized-example/:id
 *
 * Example of fetching a single user with caching
 */
async function handleGetUser(_req: NextRequest, userId: string) {
  const cache = getCacheWrapper();

  // Get or compute user with caching
  const user = await cache.getOrCompute(
    CacheKeys.userProfile(userId),
    async () => {
      return withQueryOptimization('getUserProfile', async () => {
        // Use profile field selection
        return prisma.user.findUnique({
          where: { id: userId },
          select: UserSelect.profile,
        });
      });
    },
    {
      ttl: 300, // Cache for 5 minutes
      tags: [CacheTags.user(userId)],
    }
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

/**
 * Example of batch loading users
 * Prevents N+1 query problem
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleBatchGetUsers(userIds: string[]) {
  return withQueryOptimization('batchGetUsers', async () => {
    // Single query to fetch all users
    return prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: UserSelect.minimal,
    });
  });
}

/**
 * Example of optimized user search with pagination
 */
async function handleSearchUsers(
  _req: NextRequest,
  query: string,
  page: number = 1,
  pageSize: number = 20
) {
  const cache = getCacheWrapper();
  const cacheKey = `users:search:${query}:${page}:${pageSize}`;

  const result = await cache.getOrCompute(
    cacheKey,
    async () => {
      return withQueryOptimization('searchUsers', async () => {
        const skip = (page - 1) * pageSize;

        // Parallel queries for data and count
        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where: {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: UserSelect.minimal,
            skip,
            take: pageSize,
            orderBy: {
              createdAt: 'desc',
            },
          }),
          prisma.user.count({
            where: {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
              ],
            },
          }),
        ]);

        return {
          users,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      });
    },
    {
      ttl: 60, // Cache search results for 1 minute
      tags: [CacheTags.users],
    }
  );

  return NextResponse.json(result);
}

// Export the route handler with optimizations
export const GET = withOptimizations(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');

    if (userId) {
      return handleGetUser(req, userId);
    }

    if (query) {
      return handleSearchUsers(req, query, page);
    }

    return handleGetUsers(req);
  },
  {
    cache: true,
    cacheMaxAge: 60,
    monitoring: true,
    deduplication: true,
  }
);

/**
 * Example of optimized POST with cache invalidation
 */
export const POST = withPerformanceMonitoring(async (req: NextRequest) => {
  const data = await req.json();

  // Create user
  const user = await withQueryOptimization('createUser', async () => {
    return prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: data.passwordHash,
      },
      select: UserSelect.profile,
    });
  });

  // Invalidate users list cache
  const cache = getCacheWrapper();
  await cache.getCache().delete(CacheKeys.user('list'));

  return NextResponse.json({ user }, { status: 201 });
});
