import { prisma } from '../../lib/db';
import { GenerationType } from '@prisma/client';

/**
 * UsageLoggingService
 *
 * Handles logging and tracking of AI service usage for analytics and billing.
 * Provides aggregation methods for usage statistics.
 *
 * Requirements: 7.1, 7.2
 */

export interface UsageLogEntry {
  workspaceId: string;
  userId: string;
  type: GenerationType;
  model: string;
  provider: string;
  tokens: number;
  credits: number;
  timestamp: Date;
}

export interface UsageStatistics {
  totalGenerations: number;
  totalCredits: number;
  totalTokens: number;
  byType: {
    type: GenerationType;
    count: number;
    credits: number;
    tokens: number;
  }[];
  byModel: {
    model: string;
    count: number;
    credits: number;
    tokens: number;
  }[];
  byProvider: {
    provider: string;
    count: number;
    credits: number;
    tokens: number;
  }[];
  dailyUsage: {
    date: string;
    count: number;
    credits: number;
    tokens: number;
  }[];
}

export interface UsageSummary {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  totalGenerations: number;
  totalCredits: number;
  totalTokens: number;
  averageCreditsPerGeneration: number;
}

export class UsageLoggingService {
  /**
   * Logs a usage event (automatically done when Generation is created)
   * This method is primarily for reference - actual logging happens via Generation entity
   *
   * Requirements: 7.1
   */
  async logUsage(entry: UsageLogEntry): Promise<void> {
    // Usage is automatically logged when Generation records are created
    // This method exists for explicit logging if needed
    await prisma.generation.create({
      data: {
        workspaceId: entry.workspaceId,
        userId: entry.userId,
        type: entry.type,
        model: entry.model,
        provider: entry.provider,
        prompt: '', // Empty for logging purposes
        tokens: entry.tokens,
        credits: entry.credits,
        status: 'COMPLETED',
        createdAt: entry.timestamp,
        completedAt: entry.timestamp,
      },
    });
  }

  /**
   * Gets comprehensive usage statistics for a workspace
   *
   * Requirements: 7.2
   */
  async getUsageStatistics(
    workspaceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageStatistics> {
    const whereClause: any = {
      workspaceId,
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = startDate;
      }
      if (endDate) {
        whereClause.createdAt.lte = endDate;
      }
    }

    // Get all generations for the period
    const generations = await prisma.generation.findMany({
      where: whereClause,
      select: {
        type: true,
        model: true,
        provider: true,
        tokens: true,
        credits: true,
        createdAt: true,
      },
    });

    // Calculate totals
    const totalGenerations = generations.length;
    const totalCredits = generations.reduce((sum: number, gen: any) => sum + gen.credits, 0);
    const totalTokens = generations.reduce((sum: number, gen: any) => sum + gen.tokens, 0);

    // Aggregate by type
    const byTypeMap = new Map<
      GenerationType,
      { count: number; credits: number; tokens: number }
    >();
    generations.forEach((gen) => {
      const existing = byTypeMap.get(gen.type) || {
        count: 0,
        credits: 0,
        tokens: 0,
      };
      byTypeMap.set(gen.type, {
        count: existing.count + 1,
        credits: existing.credits + gen.credits,
        tokens: existing.tokens + gen.tokens,
      });
    });

    const byType = Array.from(byTypeMap.entries()).map(([type, stats]) => ({
      type,
      ...stats,
    }));

    // Aggregate by model
    const byModelMap = new Map<
      string,
      { count: number; credits: number; tokens: number }
    >();
    generations.forEach((gen) => {
      const existing = byModelMap.get(gen.model) || {
        count: 0,
        credits: 0,
        tokens: 0,
      };
      byModelMap.set(gen.model, {
        count: existing.count + 1,
        credits: existing.credits + gen.credits,
        tokens: existing.tokens + gen.tokens,
      });
    });

    const byModel = Array.from(byModelMap.entries()).map(([model, stats]) => ({
      model,
      ...stats,
    }));

    // Aggregate by provider
    const byProviderMap = new Map<
      string,
      { count: number; credits: number; tokens: number }
    >();
    generations.forEach((gen) => {
      const existing = byProviderMap.get(gen.provider) || {
        count: 0,
        credits: 0,
        tokens: 0,
      };
      byProviderMap.set(gen.provider, {
        count: existing.count + 1,
        credits: existing.credits + gen.credits,
        tokens: existing.tokens + gen.tokens,
      });
    });

    const byProvider = Array.from(byProviderMap.entries()).map(
      ([provider, stats]) => ({
        provider,
        ...stats,
      })
    );

    // Aggregate by day
    const byDayMap = new Map<
      string,
      { count: number; credits: number; tokens: number }
    >();
    generations.forEach((gen) => {
      const dateKey = gen.createdAt.toISOString().split('T')[0];
      const existing = byDayMap.get(dateKey) || {
        count: 0,
        credits: 0,
        tokens: 0,
      };
      byDayMap.set(dateKey, {
        count: existing.count + 1,
        credits: existing.credits + gen.credits,
        tokens: existing.tokens + gen.tokens,
      });
    });

    const dailyUsage = Array.from(byDayMap.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalGenerations,
      totalCredits,
      totalTokens,
      byType,
      byModel,
      byProvider,
      dailyUsage,
    };
  }

  /**
   * Gets usage summary for a specific period
   *
   * Requirements: 7.2
   */
  async getUsageSummary(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<UsageSummary> {
    const endDate = new Date();
    const startDate = new Date();

    // Calculate start date based on period
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const result = await prisma.generation.aggregate({
      where: {
        workspaceId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
      _sum: {
        credits: true,
        tokens: true,
      },
    });

    const totalGenerations = result._count;
    const totalCredits = result._sum.credits || 0;
    const totalTokens = result._sum.tokens || 0;
    const averageCreditsPerGeneration =
      totalGenerations > 0 ? totalCredits / totalGenerations : 0;

    return {
      period,
      startDate,
      endDate,
      totalGenerations,
      totalCredits,
      totalTokens,
      averageCreditsPerGeneration,
    };
  }

  /**
   * Gets recent usage activity
   *
   * Requirements: 7.2
   */
  async getRecentActivity(
    workspaceId: string,
    limit: number = 10
  ): Promise<
    Array<{
      id: string;
      type: GenerationType;
      model: string;
      provider: string;
      credits: number;
      tokens: number;
      createdAt: Date;
      status: string;
    }>
  > {
    const generations = await prisma.generation.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        type: true,
        model: true,
        provider: true,
        credits: true,
        tokens: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return generations;
  }

  /**
   * Gets usage by user within a workspace
   *
   * Requirements: 7.2
   */
  async getUserUsageInWorkspace(
    workspaceId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalGenerations: number;
    totalCredits: number;
    totalTokens: number;
    byType: {
      type: GenerationType;
      count: number;
      credits: number;
    }[];
  }> {
    const whereClause: any = {
      workspaceId,
      userId,
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = startDate;
      }
      if (endDate) {
        whereClause.createdAt.lte = endDate;
      }
    }

    const result = await prisma.generation.aggregate({
      where: whereClause,
      _count: true,
      _sum: {
        credits: true,
        tokens: true,
      },
    });

    // Get breakdown by type
    const byTypeData = await prisma.generation.groupBy({
      by: ['type'],
      where: whereClause,
      _count: true,
      _sum: {
        credits: true,
      },
    });

    const byType = byTypeData.map((item) => ({
      type: item.type,
      count: item._count,
      credits: item._sum.credits || 0,
    }));

    return {
      totalGenerations: result._count,
      totalCredits: result._sum.credits || 0,
      totalTokens: result._sum.tokens || 0,
      byType,
    };
  }

  /**
   * Gets credit usage trend over time
   *
   * Requirements: 7.2
   */
  async getCreditUsageTrend(
    workspaceId: string,
    days: number = 30
  ): Promise<
    Array<{
      date: string;
      credits: number;
      generations: number;
    }>
  > {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const generations = await prisma.generation.findMany({
      where: {
        workspaceId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        credits: true,
        createdAt: true,
      },
    });

    // Group by date
    const byDateMap = new Map<string, { credits: number; count: number }>();

    // Initialize all dates in range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = d.toISOString().split('T')[0];
      byDateMap.set(dateKey, { credits: 0, count: 0 });
    }

    // Aggregate data
    generations.forEach((gen) => {
      const dateKey = gen.createdAt.toISOString().split('T')[0];
      const existing = byDateMap.get(dateKey) || { credits: 0, count: 0 };
      byDateMap.set(dateKey, {
        credits: existing.credits + gen.credits,
        count: existing.count + 1,
      });
    });

    return Array.from(byDateMap.entries())
      .map(([date, data]) => ({
        date,
        credits: data.credits,
        generations: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
