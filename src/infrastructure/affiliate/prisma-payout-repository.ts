/**
 * Prisma Payout Repository Implementation
 * Requirements: Affiliate 3 - Payout Processing
 */

import prisma from '@/lib/db/prisma';
import type { PayoutRepository } from '@/domain/affiliate/repositories/payout-repository';
import type { Payout, PayoutMethod, PayoutStatus } from '@/types/affiliate';

export class PrismaPayoutRepository implements PayoutRepository {
  async create(data: {
    affiliateId: string;
    amount: number;
    method: PayoutMethod;
    notes?: string;
  }): Promise<Payout> {
    return await prisma.payout.create({
      data: {
        affiliateId: data.affiliateId,
        amount: data.amount,
        method: data.method,
        status: 'PENDING',
        notes: data.notes,
      },
    });
  }

  async findById(id: string): Promise<Payout | null> {
    return await prisma.payout.findUnique({
      where: { id },
    });
  }

  async findByAffiliateId(affiliateId: string): Promise<Payout[]> {
    return await prisma.payout.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending(): Promise<Payout[]> {
    return await prisma.payout.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(
    id: string,
    status: PayoutStatus,
    processedAt?: Date,
    notes?: string
  ): Promise<Payout> {
    return await prisma.payout.update({
      where: { id },
      data: {
        status,
        processedAt: processedAt || (status === 'PAID' ? new Date() : undefined),
        notes,
      },
    });
  }

  async getStats(affiliateId: string): Promise<{
    totalRequested: number;
    totalPaid: number;
    totalPending: number;
    totalRejected: number;
    payoutCount: number;
  }> {
    const payouts = await prisma.payout.findMany({
      where: { affiliateId },
    });

    const stats = payouts.reduce(
      (acc, payout) => {
        acc.payoutCount++;
        acc.totalRequested += payout.amount;

        switch (payout.status) {
          case 'PAID':
            acc.totalPaid += payout.amount;
            break;
          case 'PENDING':
          case 'APPROVED':
            acc.totalPending += payout.amount;
            break;
          case 'REJECTED':
          case 'FAILED':
            acc.totalRejected += payout.amount;
            break;
        }

        return acc;
      },
      {
        totalRequested: 0,
        totalPaid: 0,
        totalPending: 0,
        totalRejected: 0,
        payoutCount: 0,
      }
    );

    return stats;
  }
}
