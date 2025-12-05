/**
 * Billing Checkout Utilities
 * 
 * Client-side utilities for initiating Stripe checkout flows
 * Requirements: 2.1, 4.1
 */

export interface CreateSubscriptionCheckoutParams {
  planId: string;
  workspaceId: string;
  successUrl?: string;
  cancelUrl?: string;
  trialDays?: number;
}

export interface CreateCreditCheckoutParams {
  workspaceId: string;
  creditAmount: number;
  pricePerCredit: number;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
  trialOffered?: boolean;
  trialDays?: number;
  creditAmount?: number;
  totalAmount?: number;
  amountInCents?: number;
}

export interface CheckoutSuccessResponse {
  success: boolean;
  sessionId: string;
  paymentStatus: string;
  customerEmail: string | null;
  amountTotal: number | null;
  currency: string | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    trialEnd: string | null;
  } | null;
}

/**
 * Create a checkout session for subscription
 * Requirements: 2.1
 * 
 * @param params - Checkout parameters
 * @returns Checkout session with redirect URL
 */
export async function createSubscriptionCheckout(
  params: CreateSubscriptionCheckoutParams
): Promise<CheckoutSessionResponse> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Create a checkout session for credit purchase
 * Requirements: 4.1
 * 
 * @param params - Credit purchase parameters
 * @returns Checkout session with redirect URL
 */
export async function createCreditCheckout(
  params: CreateCreditCheckoutParams
): Promise<CheckoutSessionResponse> {
  const response = await fetch('/api/billing/credits/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create credit checkout session');
  }

  return response.json();
}

/**
 * Retrieve checkout session details after success
 * Requirements: 2.2
 * 
 * @param sessionId - Stripe checkout session ID
 * @returns Checkout session details
 */
export async function getCheckoutSuccess(
  sessionId: string
): Promise<CheckoutSuccessResponse> {
  const response = await fetch(
    `/api/billing/checkout/success?session_id=${encodeURIComponent(sessionId)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to retrieve checkout session');
  }

  return response.json();
}

/**
 * Redirect to Stripe checkout
 * Requirements: 2.1
 * 
 * @param checkoutUrl - Stripe checkout URL
 */
export function redirectToCheckout(checkoutUrl: string): void {
  window.location.href = checkoutUrl;
}

/**
 * Start subscription checkout flow
 * Requirements: 2.1
 * 
 * @param params - Checkout parameters
 */
export async function startSubscriptionCheckout(
  params: CreateSubscriptionCheckoutParams
): Promise<void> {
  const session = await createSubscriptionCheckout(params);
  redirectToCheckout(session.url);
}

/**
 * Start credit purchase checkout flow
 * Requirements: 4.1
 * 
 * @param params - Credit purchase parameters
 */
export async function startCreditCheckout(
  params: CreateCreditCheckoutParams
): Promise<void> {
  const session = await createCreditCheckout(params);
  redirectToCheckout(session.url);
}

/**
 * Extract session ID from URL query parameters
 * 
 * @param url - URL or search params string
 * @returns Session ID or null
 */
export function extractSessionId(url?: string): string | null {
  const searchParams = new URLSearchParams(
    url || (typeof window !== 'undefined' ? window.location.search : '')
  );
  return searchParams.get('session_id');
}

/**
 * Check if checkout was successful from URL
 * 
 * @param url - URL or search params string
 * @returns True if success parameter is present
 */
export function isCheckoutSuccess(url?: string): boolean {
  const searchParams = new URLSearchParams(
    url || (typeof window !== 'undefined' ? window.location.search : '')
  );
  return searchParams.get('success') === 'true';
}

/**
 * Check if checkout was canceled from URL
 * 
 * @param url - URL or search params string
 * @returns True if canceled parameter is present
 */
export function isCheckoutCanceled(url?: string): boolean {
  const searchParams = new URLSearchParams(
    url || (typeof window !== 'undefined' ? window.location.search : '')
  );
  return searchParams.get('canceled') === 'true';
}

/**
 * Check if credit purchase was successful from URL
 * 
 * @param url - URL or search params string
 * @returns True if credit_purchase=success parameter is present
 */
export function isCreditPurchaseSuccess(url?: string): boolean {
  const searchParams = new URLSearchParams(
    url || (typeof window !== 'undefined' ? window.location.search : '')
  );
  return searchParams.get('credit_purchase') === 'success';
}

/**
 * Check if credit purchase was canceled from URL
 * 
 * @param url - URL or search params string
 * @returns True if credit_purchase=canceled parameter is present
 */
export function isCreditPurchaseCanceled(url?: string): boolean {
  const searchParams = new URLSearchParams(
    url || (typeof window !== 'undefined' ? window.location.search : '')
  );
  return searchParams.get('credit_purchase') === 'canceled';
}
