import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * Admin Reports API Tests
 *
 * Requirements: Admin Dashboard 5 - Analytics and Reporting
 */

vi.mock('@/lib/admin', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1', role: 'ADMIN' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    invoice: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    creditTransaction: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    generation: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

describe('Admin Reports API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when dates are missing', async () => {
    const request = new NextRequest('http://localhost/api/admin/reports?type=revenue');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Start date and end date are required');
  });

  it('should return error for invalid report type', async () => {
    const request = new NextRequest(
      'http://localhost/api/admin/reports?type=invalid&startDate=2024-01-01&endDate=2024-01-31'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid report type');
  });

  it('should generate revenue report', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        amount: 10000,
        currency: 'usd',
        status: 'PAID',
        paidAt: new Date('2024-01-15'),
        workspace: {
          id: 'ws-1',
          name: 'Test Workspace',
          owner: { email: 'test@example.com' },
        },
        description: 'Test invoice',
      },
    ];

    const mockSubscriptions = [
      {
        id: 'sub-1',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-10'),
        plan: {
          name: 'Pro Plan',
          price: 5000,
          interval: 'MONTH',
        },
        workspace: {
          name: 'Test Workspace',
        },
      },
    ];

    const mockCreditTransactions = [
      {
        id: 'tx-1',
        amount: 1000,
        type: 'PURCHASE',
        createdAt: new Date('2024-01-20'),
        workspace: {
          name: 'Test Workspace',
        },
        description: 'Credit purchase',
      },
    ];

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
    vi.mocked(prisma.subscription.findMany).mockResolvedValue(mockSubscriptions as any);
    vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue(mockCreditTransactions as any);

    const request = new NextRequest(
      'http://localhost/api/admin/reports?type=revenue&startDate=2024-01-01&endDate=2024-01-31'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBeDefined();
    expect(data.summary.totalRevenue).toBe(15000);
    expect(data.summary.invoiceRevenue).toBe(10000);
    expect(data.summary.subscriptionRevenue).toBe(5000);
    expect(data.invoices).toHaveLength(1);
    expect(data.subscriptions).toHaveLength(1);
  });

  it('should generate user growth report', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-15'),
        lastSeenAt: new Date('2024-01-20'),
        _count: {
          ownedWorkspaces: 2,
          generations: 10,
        },
      },
    ];

    const mockDailyGrowth = [
      { createdAt: new Date('2024-01-15'), _count: 1 },
    ];

    const mockStatusBreakdown = [
      { status: 'ACTIVE', _count: 1 },
    ];

    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user.groupBy)
      .mockResolvedValueOnce(mockDailyGrowth as any)
      .mockResolvedValueOnce(mockStatusBreakdown as any);

    const request = new NextRequest(
      'http://localhost/api/admin/reports?type=user-growth&startDate=2024-01-01&endDate=2024-01-31'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBeDefined();
    expect(data.summary.totalNewUsers).toBe(1);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].name).toBe('John Doe');
  });

  it('should generate AI usage report', async () => {
    const mockGenerations = [
      {
        id: 'gen-1',
        type: 'TEXT',
        provider: 'openai',
        model: 'gpt-4',
        credits: 100,
        tokens: 500,
        status: 'COMPLETED',
        createdAt: new Date('2024-01-15'),
        completedAt: new Date('2024-01-15'),
        workspace: { name: 'Test Workspace' },
        user: { email: 'test@example.com' },
      },
    ];

    const mockByType = [
      { type: 'TEXT', _count: 1, _sum: { credits: 100, tokens: 500 } },
    ];

    const mockByProvider = [
      { provider: 'openai', _count: 1, _sum: { credits: 100, tokens: 500 } },
    ];

    const mockByStatus = [
      { status: 'COMPLETED', _count: 1 },
    ];

    vi.mocked(prisma.generation.findMany).mockResolvedValue(mockGenerations as any);
    vi.mocked(prisma.generation.groupBy)
      .mockResolvedValueOnce(mockByType as any)
      .mockResolvedValueOnce(mockByProvider as any)
      .mockResolvedValueOnce(mockByStatus as any);

    const request = new NextRequest(
      'http://localhost/api/admin/reports?type=ai-usage&startDate=2024-01-01&endDate=2024-01-31'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toBeDefined();
    expect(data.summary.totalGenerations).toBe(1);
    expect(data.summary.totalCredits).toBe(100);
    expect(data.summary.totalTokens).toBe(500);
    expect(data.generations).toHaveLength(1);
  });

  it('should export report as CSV', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        amount: 10000,
        currency: 'usd',
        status: 'PAID',
        paidAt: new Date('2024-01-15'),
        workspace: {
          id: 'ws-1',
          name: 'Test Workspace',
          owner: { email: 'test@example.com' },
        },
        description: 'Test invoice',
      },
    ];

    vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
    vi.mocked(prisma.subscription.findMany).mockResolvedValue([]);
    vi.mocked(prisma.creditTransaction.findMany).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost/api/admin/reports?type=revenue&startDate=2024-01-01&endDate=2024-01-31&format=csv'
    );

    const response = await GET(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('revenue-report');
    expect(text).toContain('SUMMARY');
    expect(text).toContain('INVOICES');
  });
});
