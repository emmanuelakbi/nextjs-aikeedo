/**
 * useCheckout Hook
 *
 * React hook for managing Stripe checkout flows
 * Requirements: 2.1, 2.3, 4.1, 4.3
 */

import { useState, useCallback } from 'react';
import {
  createSubscriptionCheckout,
  createCreditCheckout,
  type CreateSubscriptionCheckoutParams,
  type CreateCreditCheckoutParams,
} from '../billing/checkout';

interface UseCheckoutState {
  isLoading: boolean;
  error: string | null;
}

interface UseCheckoutReturn {
  isLoading: boolean;
  error: string | null;
  startSubscriptionCheckout: (
    params: CreateSubscriptionCheckoutParams
  ) => Promise<void>;
  startCreditCheckout: (params: CreateCreditCheckoutParams) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing checkout flows
 *
 * @returns Checkout state and functions
 */
export function useCheckout(): UseCheckoutReturn {
  const [state, setState] = useState<UseCheckoutState>({
    isLoading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const startSubscriptionCheckout = useCallback(
    async (params: CreateSubscriptionCheckoutParams) => {
      setState({ isLoading: true, error: null });

      try {
        const session = await createSubscriptionCheckout(params);

        // Redirect to Stripe checkout
        window.location.href = session.url;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start checkout';

        setState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
    []
  );

  const startCreditCheckout = useCallback(
    async (params: CreateCreditCheckoutParams) => {
      setState({ isLoading: true, error: null });

      try {
        const session = await createCreditCheckout(params);

        // Redirect to Stripe checkout
        window.location.href = session.url;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to start credit checkout';

        setState({ isLoading: false, error: errorMessage });
        throw error;
      }
    },
    []
  );

  return {
    isLoading: state.isLoading,
    error: state.error,
    startSubscriptionCheckout,
    startCreditCheckout,
    clearError,
  };
}
