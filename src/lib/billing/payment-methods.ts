/**
 * Payment Method Management Utilities
 * 
 * Client-side utilities for managing payment methods
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { PaymentMethod } from '@/types/billing';

export interface AddPaymentMethodParams {
  workspaceId: string;
  paymentMethodId: string;
  setAsDefault?: boolean;
}

export interface UpdatePaymentMethodParams {
  paymentMethodId: string;
  workspaceId: string;
  setAsDefault: boolean;
}

export interface RemovePaymentMethodParams {
  paymentMethodId: string;
  workspaceId: string;
}

export interface ListPaymentMethodsParams {
  workspaceId: string;
}

export interface ExpiringPaymentMethodsParams {
  workspaceId: string;
  daysThreshold?: number;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

export interface ExpiringPaymentMethodsResponse {
  expiringPaymentMethods: PaymentMethod[];
  count: number;
  daysThreshold: number;
}

export interface PaymentMethodResponse {
  paymentMethod: PaymentMethod;
  message: string;
}

/**
 * List payment methods for a workspace
 * Requirements: 6.1
 * 
 * @param params - List parameters
 * @returns List of payment methods
 */
export async function listPaymentMethods(
  params: ListPaymentMethodsParams
): Promise<PaymentMethodsResponse> {
  const response = await fetch(
    `/api/billing/payment-methods?workspaceId=${encodeURIComponent(params.workspaceId)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list payment methods');
  }

  return response.json();
}

/**
 * Add a payment method to a workspace
 * Requirements: 6.1
 * 
 * @param params - Payment method parameters
 * @returns Created payment method
 */
export async function addPaymentMethod(
  params: AddPaymentMethodParams
): Promise<PaymentMethodResponse> {
  const response = await fetch('/api/billing/payment-methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add payment method');
  }

  return response.json();
}

/**
 * Update a payment method (set as default)
 * Requirements: 6.2
 * 
 * @param params - Update parameters
 * @returns Updated payment method
 */
export async function updatePaymentMethod(
  params: UpdatePaymentMethodParams
): Promise<PaymentMethodResponse> {
  const response = await fetch(
    `/api/billing/payment-methods/${params.paymentMethodId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId: params.workspaceId,
        setAsDefault: params.setAsDefault,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update payment method');
  }

  return response.json();
}

/**
 * Set a payment method as default
 * Requirements: 6.2
 * 
 * @param paymentMethodId - Payment method ID
 * @param workspaceId - Workspace ID
 * @returns Updated payment method
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string,
  workspaceId: string
): Promise<PaymentMethodResponse> {
  return updatePaymentMethod({
    paymentMethodId,
    workspaceId,
    setAsDefault: true,
  });
}

/**
 * Remove a payment method
 * Requirements: 6.3
 * 
 * @param params - Remove parameters
 * @returns Success message
 */
export async function removePaymentMethod(
  params: RemovePaymentMethodParams
): Promise<{ message: string }> {
  const response = await fetch(
    `/api/billing/payment-methods/${params.paymentMethodId}?workspaceId=${encodeURIComponent(params.workspaceId)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove payment method');
  }

  return response.json();
}

/**
 * Get expiring payment methods
 * Requirements: 6.4
 * 
 * @param params - Expiring check parameters
 * @returns List of expiring payment methods
 */
export async function getExpiringPaymentMethods(
  params: ExpiringPaymentMethodsParams
): Promise<ExpiringPaymentMethodsResponse> {
  const daysParam = params.daysThreshold
    ? `&days=${params.daysThreshold}`
    : '';
  const response = await fetch(
    `/api/billing/payment-methods/expiring?workspaceId=${encodeURIComponent(params.workspaceId)}${daysParam}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get expiring payment methods');
  }

  return response.json();
}

/**
 * Format payment method for display
 * 
 * @param paymentMethod - Payment method
 * @returns Formatted string
 */
export function formatPaymentMethod(paymentMethod: PaymentMethod): string {
  const brand = paymentMethod.brand
    ? paymentMethod.brand.charAt(0).toUpperCase() +
      paymentMethod.brand.slice(1)
    : paymentMethod.type;
  const last4 = paymentMethod.last4 || '****';

  return `${brand} •••• ${last4}`;
}

/**
 * Check if payment method is expired
 * 
 * @param paymentMethod - Payment method
 * @returns True if expired
 */
export function isPaymentMethodExpired(paymentMethod: PaymentMethod): boolean {
  if (!paymentMethod.expiryYear || !paymentMethod.expiryMonth) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    paymentMethod.expiryYear < currentYear ||
    (paymentMethod.expiryYear === currentYear &&
      paymentMethod.expiryMonth < currentMonth)
  );
}

/**
 * Check if payment method is expiring soon
 * 
 * @param paymentMethod - Payment method
 * @param daysThreshold - Days before expiry to consider (default: 30)
 * @returns True if expiring soon
 */
export function isPaymentMethodExpiringSoon(
  paymentMethod: PaymentMethod,
  daysThreshold: number = 30
): boolean {
  if (!paymentMethod.expiryYear || !paymentMethod.expiryMonth) {
    return false;
  }

  if (isPaymentMethodExpired(paymentMethod)) {
    return true;
  }

  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const expiryDate = new Date(
    paymentMethod.expiryYear,
    paymentMethod.expiryMonth - 1,
    1
  );

  return expiryDate <= thresholdDate;
}

/**
 * Get expiry display string
 * 
 * @param paymentMethod - Payment method
 * @returns Expiry string (e.g., "12/2025")
 */
export function getExpiryDisplay(paymentMethod: PaymentMethod): string | null {
  if (!paymentMethod.expiryYear || !paymentMethod.expiryMonth) {
    return null;
  }

  const month = paymentMethod.expiryMonth.toString().padStart(2, '0');
  const year = paymentMethod.expiryYear.toString();

  return `${month}/${year}`;
}

