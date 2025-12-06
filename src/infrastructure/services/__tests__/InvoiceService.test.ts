import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoiceService } from '../InvoiceService';
import { prisma } from '../../../lib/db';
import { stripeService } from '../StripeService';
import Stripe from 'stripe';

// Mock dependencies
vi.mock('../../../lib/db', () => ({
  prisma: {
    invoice: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    workspace: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../StripeService', () => ({
  stripeService: {
    retrieveInvoice: vi.fn(),
    retrieveCustomer: vi.fn(),
  },
}));

vi.mock('../../../lib/email', () => ({
  sendInvoiceEmail: vi.fn(),
}));

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;

  beforeEach(() => {
    vi.clearAllMocks();
    invoiceService = new InvoiceService();
  });

  describe('getInvoiceById', () => {
    it('should retrieve an invoice by ID', async () => {
      const mockInvoice = {
        id: 'invoice_123',
        workspaceId: 'workspace_123',
        subscriptionId: 'sub_123',
        stripeInvoiceId: 'in_123',
        amount: 2000,
        currency: 'usd',
        status: 'PAID',
        paidAt: new Date(),
        invoiceUrl: 'https://invoice.stripe.com/...',
        invoicePdfUrl: 'https://invoice.stripe.com/.../pdf',
        description: 'Test invoice',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(
        mockInvoice as any
      );

      const result = await invoiceService.getInvoiceById('invoice_123');

      expect(result).toEqual(mockInvoice);
      expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'invoice_123' },
      });
    });

    it('should return null if invoice not found', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);

      const result = await invoiceService.getInvoiceById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listInvoicesByWorkspace', () => {
    it('should list invoices for a workspace', async () => {
      const mockInvoices = [
        {
          id: 'invoice_1',
          workspaceId: 'workspace_123',
          amount: 2000,
          status: 'PAID',
        },
        {
          id: 'invoice_2',
          workspaceId: 'workspace_123',
          amount: 3000,
          status: 'PAID',
        },
      ];

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
      vi.mocked(prisma.invoice.count).mockResolvedValue(2);

      const result = await invoiceService.listInvoicesByWorkspace(
        'workspace_123',
        {
          limit: 10,
          offset: 0,
        }
      );

      expect(result.invoices).toEqual(mockInvoices);
      expect(result.total).toBe(2);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace_123' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('should filter invoices by status', async () => {
      const mockInvoices = [
        {
          id: 'invoice_1',
          workspaceId: 'workspace_123',
          status: 'PAID',
        },
      ];

      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
      vi.mocked(prisma.invoice.count).mockResolvedValue(1);

      await invoiceService.listInvoicesByWorkspace('workspace_123', {
        status: 'PAID',
      });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace_123', status: 'PAID' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });
  });

  describe('getInvoicePdfUrl', () => {
    it('should return cached PDF URL if available', async () => {
      const mockInvoice = {
        id: 'invoice_123',
        invoicePdfUrl: 'https://cached-pdf-url.com',
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(
        mockInvoice as any
      );

      const result = await invoiceService.getInvoicePdfUrl('invoice_123');

      expect(result).toBe('https://cached-pdf-url.com');
      expect(stripeService.retrieveInvoice).not.toHaveBeenCalled();
    });

    it('should fetch PDF URL from Stripe if not cached', async () => {
      const mockInvoice = {
        id: 'invoice_123',
        stripeInvoiceId: 'in_123',
        invoicePdfUrl: null,
      };

      const mockStripeInvoice = {
        id: 'in_123',
        invoice_pdf: 'https://stripe-pdf-url.com',
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(
        mockInvoice as any
      );
      vi.mocked(stripeService.retrieveInvoice).mockResolvedValue(
        mockStripeInvoice as any
      );
      vi.mocked(prisma.invoice.update).mockResolvedValue({
        ...mockInvoice,
        invoicePdfUrl: 'https://stripe-pdf-url.com',
      } as any);

      const result = await invoiceService.getInvoicePdfUrl('invoice_123');

      expect(result).toBe('https://stripe-pdf-url.com');
      expect(stripeService.retrieveInvoice).toHaveBeenCalledWith('in_123');
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'invoice_123' },
        data: { invoicePdfUrl: 'https://stripe-pdf-url.com' },
      });
    });
  });

  describe('isInvoicePaid', () => {
    it('should return true for paid invoice', async () => {
      const mockInvoice = {
        id: 'invoice_123',
        status: 'PAID',
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(
        mockInvoice as any
      );

      const result = await invoiceService.isInvoicePaid('invoice_123');

      expect(result).toBe(true);
    });

    it('should return false for unpaid invoice', async () => {
      const mockInvoice = {
        id: 'invoice_123',
        status: 'OPEN',
      };

      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(
        mockInvoice as any
      );

      const result = await invoiceService.isInvoicePaid('invoice_123');

      expect(result).toBe(false);
    });

    it('should return false if invoice not found', async () => {
      vi.mocked(prisma.invoice.findUnique).mockResolvedValue(null);

      const result = await invoiceService.isInvoicePaid('nonexistent');

      expect(result).toBe(false);
    });
  });
});
