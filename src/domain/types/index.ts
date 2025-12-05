/**
 * Domain Types
 * 
 * Central location for all domain-level type definitions.
 * These types are independent of infrastructure (Prisma, Stripe, etc.)
 * and can be safely imported in any layer including client components.
 */

// ============================================================================
// User Domain Types
// ============================================================================

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// ============================================================================
// Generation/AI Domain Types
// ============================================================================

export enum GenerationType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  SPEECH = 'SPEECH',
  TRANSCRIPTION = 'TRANSCRIPTION',
  CHAT = 'CHAT',
}

export enum GenerationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ============================================================================
// Billing Domain Types
// ============================================================================

export enum PlanInterval {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  UNPAID = 'UNPAID',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  VOID = 'VOID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
}

export enum CreditTransactionType {
  PURCHASE = 'PURCHASE',
  USAGE = 'USAGE',
  REFUND = 'REFUND',
  BONUS = 'BONUS',
  SUBSCRIPTION_ALLOCATION = 'SUBSCRIPTION_ALLOCATION',
}

// ============================================================================
// Affiliate Domain Types
// ============================================================================

export enum AffiliateStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
}

export enum PayoutMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

// ============================================================================
// Type Guards
// ============================================================================

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

export function isUserStatus(value: string): value is UserStatus {
  return Object.values(UserStatus).includes(value as UserStatus);
}

export function isGenerationType(value: string): value is GenerationType {
  return Object.values(GenerationType).includes(value as GenerationType);
}

export function isPlanInterval(value: string): value is PlanInterval {
  return Object.values(PlanInterval).includes(value as PlanInterval);
}

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return Object.values(SubscriptionStatus).includes(value as SubscriptionStatus);
}
