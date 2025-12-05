import Stripe from 'stripe';
import { stripeService } from './StripeService';
import { prisma } from '../../lib/db';
import { InvoiceStatus } from '@prisma/client';

/**
 * InvoiceService
 *
 * Handles invoice generation, retrieval, and management.
 * Integrates with Stripe for invoice data and provides local storage.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

export interface InvoiceDetails {
  id: string;
  workspaceId: string;
  subscriptionId: string | null;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  paidAt: Date | null;
  invoiceUrl: string | null;
  invoicePdfUrl: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
  quantity: number;
  unitAmount: number;
}

export interface DetailedInvoice extends InvoiceDetails {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerEmail: string | null;
  customerName: string | null;
}

export class InvoiceServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'InvoiceServiceError';
  }
}

export class InvoiceService {
  /**
   * Create or update invoice from Stripe invoice object
   * Requirements: 5.1 - Generate invoice when payment occurs
   *
   * @param stripeInvoice - Stripe invoice object
   * @returns Created or updated invoice
   */
  async syncInvoiceFromStripe(stripeInvoice: Stripe.Invoice): Promise<InvoiceDetails> {
    try {
      // Find workspace by subscription ID
      const subscriptionId = stripeInvoice.subscription as string | undefined;

      let workspaceId: string | null = null;
      let localSubscriptionId: string | null = null;

      if (subscriptionId) {
        const subscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (subscription) {
          workspaceId = subscription.workspaceId;
          localSubscriptionId = subscription.id;
        }
      }

      // If no subscription, try to find workspace from customer metadata
      if (!workspaceId) {
        const customerId = stripeInvoice.customer as string | undefined;

        if (customerId) {
          const subscription = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (subscription) {
            workspaceId = subscription.workspaceId;
            localSubscriptionId = subscription.id;
          }
        }
      }

      if (!workspaceId) {
        throw new InvoiceServiceError(
          'Cannot create invoice: workspace not found',
          'WORKSPACE_NOT_FOUND'
        );
      }

      // Requirements: 5.4 - Include itemized charges
      const invoiceData = {
        workspaceId,
        subscriptionId: localSubscriptionId,
        stripeInvoiceId: stripeInvoice.id,
        amount: stripeInvoice.amount_paid || stripeInvoice.amount_due || 0,
        currency: stripeInvoice.currency,
        status: this.mapStripeInvoiceStatus(stripeInvoice.status),
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : null,
        invoiceUrl: stripeInvoice.hosted_invoice_url || null,
        invoicePdfUrl: stripeInvoice.invoice_pdf || null,
        description: this.generateInvoiceDescription(stripeInvoice),
      };

      const invoice = await prisma.invoice.upsert({
        where: { stripeInvoiceId: stripeInvoice.id },
        create: invoiceData,
        update: {
          ...invoiceData,
          updatedAt: new Date(),
        },
      });

      return invoice;
    } catch (error) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      throw new InvoiceServiceError(
        `Failed to sync invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SYNC_FAILED'
      );
    }
  }

  /**
   * Get invoice by ID
   * Requirements: 5.2 - Display invoice details
   *
   * @param invoiceId - Invoice ID
   * @returns Invoice details
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceDetails | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    return invoice;
  }

  /**
   * Get detailed invoice with line items from Stripe
   * Requirements: 5.4 - Include itemized charges
   *
   * @param invoiceId - Invoice ID
   * @returns Detailed invoice with line items
   */
  async getDetailedInvoice(invoiceId: string): Promise<DetailedInvoice> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);

      if (!invoice) {
        throw new InvoiceServiceError('Invoice not found', 'INVOICE_NOT_FOUND');
      }

      // Fetch full invoice details from Stripe
      const stripeInvoice = await stripeService.retrieveInvoice(invoice.stripeInvoiceId);

      // Extract line items
      // Requirements: 5.4 - Include itemized charges
      const lineItems: InvoiceLineItem[] = stripeInvoice.lines.data.map((line) => ({
        description: line.description || 'No description',
        amount: line.amount,
        quantity: line.quantity || 1,
        unitAmount: (line.price?.unit_amount || line.amount) as number,
      }));

      // Calculate totals
      const subtotal = stripeInvoice.subtotal || 0;
      const tax = (stripeInvoice.tax as number | null) || 0;
      const total = stripeInvoice.total || 0;

      // Get customer details
      const customerId = stripeInvoice.customer as string | undefined;
      const customer = customerId
        ? await stripeService.retrieveCustomer(customerId)
        : null;

      const customerEmail = customer && 'email' in customer ? customer.email : null;
      const customerName = customer && 'name' in customer ? customer.name : null;

      return {
        ...invoice,
        lineItems,
        subtotal,
        tax,
        total,
        customerEmail,
        customerName,
      };
    } catch (error) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      throw new InvoiceServiceError(
        `Failed to get detailed invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_DETAILED_FAILED'
      );
    }
  }

  /**
   * List invoices for a workspace
   * Requirements: 5.2 - Display all past invoices
   *
   * @param workspaceId - Workspace ID
   * @param options - Pagination and filtering options
   * @returns List of invoices
   */
  async listInvoicesByWorkspace(
    workspaceId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: InvoiceStatus;
    }
  ): Promise<{ invoices: InvoiceDetails[]; total: number }> {
    try {
      const where = {
        workspaceId,
        ...(options?.status && { status: options.status }),
      };

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: options?.limit || 50,
          skip: options?.offset || 0,
        }),
        prisma.invoice.count({ where }),
      ]);

      return { invoices, total };
    } catch (error) {
      throw new InvoiceServiceError(
        `Failed to list invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LIST_FAILED'
      );
    }
  }

  /**
   * Get invoice PDF URL
   * Requirements: 5.3 - Provide PDF format
   *
   * @param invoiceId - Invoice ID
   * @returns PDF URL
   */
  async getInvoicePdfUrl(invoiceId: string): Promise<string> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);

      if (!invoice) {
        throw new InvoiceServiceError('Invoice not found', 'INVOICE_NOT_FOUND');
      }

      // If we have a cached PDF URL, return it
      if (invoice.invoicePdfUrl) {
        return invoice.invoicePdfUrl;
      }

      // Otherwise, fetch from Stripe
      const stripeInvoice = await stripeService.retrieveInvoice(invoice.stripeInvoiceId);

      if (!stripeInvoice.invoice_pdf) {
        throw new InvoiceServiceError(
          'Invoice PDF not available',
          'PDF_NOT_AVAILABLE'
        );
      }

      // Update our record with the PDF URL
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { invoicePdfUrl: stripeInvoice.invoice_pdf },
      });

      return stripeInvoice.invoice_pdf;
    } catch (error) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      throw new InvoiceServiceError(
        `Failed to get invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PDF_FAILED'
      );
    }
  }

  /**
   * Get invoice hosted page URL
   * Requirements: 5.2 - Display invoice
   *
   * @param invoiceId - Invoice ID
   * @returns Hosted invoice URL
   */
  async getInvoiceUrl(invoiceId: string): Promise<string> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);

      if (!invoice) {
        throw new InvoiceServiceError('Invoice not found', 'INVOICE_NOT_FOUND');
      }

      // If we have a cached URL, return it
      if (invoice.invoiceUrl) {
        return invoice.invoiceUrl;
      }

      // Otherwise, fetch from Stripe
      const stripeInvoice = await stripeService.retrieveInvoice(invoice.stripeInvoiceId);

      if (!stripeInvoice.hosted_invoice_url) {
        throw new InvoiceServiceError(
          'Invoice URL not available',
          'URL_NOT_AVAILABLE'
        );
      }

      // Update our record with the URL
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { invoiceUrl: stripeInvoice.hosted_invoice_url },
      });

      return stripeInvoice.hosted_invoice_url;
    } catch (error) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      throw new InvoiceServiceError(
        `Failed to get invoice URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_URL_FAILED'
      );
    }
  }

  /**
   * Send invoice email to customer
   * Requirements: 5.5 - Email invoice to billing email
   *
   * @param invoiceId - Invoice ID
   * @returns Success status
   */
  async sendInvoiceEmail(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);

      if (!invoice) {
        throw new InvoiceServiceError('Invoice not found', 'INVOICE_NOT_FOUND');
      }

      // Get workspace and owner details
      const workspace = await prisma.workspace.findUnique({
        where: { id: invoice.workspaceId },
        include: {
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new InvoiceServiceError('Workspace not found', 'WORKSPACE_NOT_FOUND');
      }

      // Get detailed invoice for email
      const detailedInvoice = await this.getDetailedInvoice(invoiceId);

      // Send email using email service
      const { sendInvoiceEmail: sendInvoiceEmailHelper } = await import('../../lib/email');
      await sendInvoiceEmailHelper(workspace.owner.email, {
        firstName: workspace.owner.firstName,
        invoiceNumber: invoice.stripeInvoiceId,
        amount: invoice.amount / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        paidAt: invoice.paidAt,
        invoiceUrl: detailedInvoice.invoiceUrl || '',
        invoicePdfUrl: detailedInvoice.invoicePdfUrl || '',
        lineItems: detailedInvoice.lineItems,
        workspaceName: workspace.name,
      });

      return true;
    } catch (error) {
      if (error instanceof InvoiceServiceError) {
        throw error;
      }
      throw new InvoiceServiceError(
        `Failed to send invoice email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEND_EMAIL_FAILED'
      );
    }
  }

  /**
   * Get recent invoices for a workspace
   * Requirements: 5.2 - Display past invoices
   *
   * @param workspaceId - Workspace ID
   * @param limit - Number of invoices to return
   * @returns Recent invoices
   */
  async getRecentInvoices(
    workspaceId: string,
    limit: number = 10
  ): Promise<InvoiceDetails[]> {
    const { invoices } = await this.listInvoicesByWorkspace(workspaceId, { limit });
    return invoices;
  }

  /**
   * Check if invoice is paid
   *
   * @param invoiceId - Invoice ID
   * @returns True if invoice is paid
   */
  async isInvoicePaid(invoiceId: string): Promise<boolean> {
    const invoice = await this.getInvoiceById(invoiceId);
    return invoice?.status === 'PAID';
  }

  /**
   * Generate a description for the invoice based on line items
   * Requirements: 5.4 - Include itemized charges
   *
   * @param stripeInvoice - Stripe invoice object
   * @returns Invoice description
   */
  private generateInvoiceDescription(stripeInvoice: Stripe.Invoice): string {
    if (stripeInvoice.description) {
      return stripeInvoice.description;
    }

    // Generate description from line items
    const lineItems = stripeInvoice.lines.data;
    if (lineItems.length === 0) {
      return 'Invoice';
    }

    if (lineItems.length === 1) {
      return lineItems[0].description || 'Invoice';
    }

    return `Invoice with ${lineItems.length} items`;
  }

  /**
   * Map Stripe invoice status to our enum
   *
   * @param status - Stripe invoice status
   * @returns Our invoice status
   */
  private mapStripeInvoiceStatus(status: Stripe.Invoice.Status | null): InvoiceStatus {
    if (!status) return 'DRAFT';

    const statusMap: Record<Stripe.Invoice.Status, InvoiceStatus> = {
      draft: 'DRAFT',
      open: 'OPEN',
      paid: 'PAID',
      void: 'VOID',
      uncollectible: 'UNCOLLECTIBLE',
    };

    return statusMap[status] || 'DRAFT';
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
