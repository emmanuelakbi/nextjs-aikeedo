/**
 * Billing Module Type Definitions
 *
 * These types align with the Prisma schema and design document
 * for the billing module.
 */

import {
  Plan as PrismaPlan,
  Subscription as PrismaSubscription,
  Invoice as PrismaInvoice,
  PaymentMethod as PrismaPaymentMethod,
  CreditTransaction as PrismaCreditTransaction,
  PlanInterval,
  SubscriptionStatus,
  InvoiceStatus,
  CreditTransactionType,
} from '@prisma/client';

// Re-export Prisma enums
export {
  PlanInterval,
  SubscriptionStatus,
  InvoiceStatus,
  CreditTransactionType,
};

// Plan types
export type Plan = PrismaPlan;

export type PlanFeatures = {
  [key: string]: boolean | string | number;
};

export type PlanLimits = {
  maxUsers?: number;
  maxGenerations?: number;
  maxStorage?: number;
  [key: string]: number | undefined;
};

export type CreatePlanInput = {
  name: string;
  description: string;
  price: number;
  currency?: string;
  interval: PlanInterval;
  creditCount: number | null;
  features?: PlanFeatures;
  limits?: PlanLimits;
  stripeProductId: string;
  stripePriceId: string;
};

export type UpdatePlanInput = Partial<
  Omit<CreatePlanInput, 'stripeProductId' | 'stripePriceId'>
> & {
  isActive?: boolean;
};

// Subscription types
export type Subscription = PrismaSubscription;

export type CreateSubscriptionInput = {
  workspaceId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date | null;
};

export type UpdateSubscriptionInput = {
  planId?: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  trialEnd?: Date | null;
};

// Invoice types
export type Invoice = PrismaInvoice;

export type CreateInvoiceInput = {
  workspaceId: string;
  subscriptionId?: string | null;
  stripeInvoiceId: string;
  amount: number;
  currency?: string;
  status: InvoiceStatus;
  paidAt?: Date | null;
  invoiceUrl?: string | null;
  invoicePdfUrl?: string | null;
  description?: string | null;
};

export type UpdateInvoiceInput = {
  status?: InvoiceStatus;
  paidAt?: Date | null;
  invoiceUrl?: string | null;
  invoicePdfUrl?: string | null;
};

// Payment Method types
export type PaymentMethod = PrismaPaymentMethod;

export type CreatePaymentMethodInput = {
  workspaceId: string;
  stripePaymentMethodId: string;
  type: string;
  last4?: string | null;
  brand?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault?: boolean;
};

export type UpdatePaymentMethodInput = {
  isDefault?: boolean;
};

// Credit Transaction types
export type CreditTransaction = PrismaCreditTransaction;

export type CreateCreditTransactionInput = {
  workspaceId: string;
  amount: number;
  type: CreditTransactionType;
  description?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  balanceBefore: number;
  balanceAfter: number;
};

// Billing dashboard types
export type BillingDashboard = {
  currentPlan: Plan | null;
  subscription: Subscription | null;
  creditBalance: number;
  allocatedCredits: number;
  usageThisPeriod: number;
  recentInvoices: Invoice[];
  paymentMethods: PaymentMethod[];
};

// Proration calculation types
export type ProrationCalculation = {
  currentPlanPrice: number;
  newPlanPrice: number;
  daysRemaining: number;
  totalDaysInPeriod: number;
  proratedAmount: number;
  creditAmount: number;
};

// Stripe webhook event types
export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: any;
  };
};
