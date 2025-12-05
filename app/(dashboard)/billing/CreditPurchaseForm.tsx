'use client';

/**
 * Credit Purchase Form Component
 * Requirements: 4.1, 4.2, 4.3
 */

import { useState } from 'react';
import { startCreditCheckout } from '@/lib/billing/checkout';

interface CreditPurchaseFormProps {
  workspaceId: string;
}

const CREDIT_PACKAGES = [
  { credits: 100, price: 10, pricePerCredit: 0.10 },
  { credits: 500, price: 45, pricePerCredit: 0.09 },
  { credits: 1000, price: 80, pricePerCredit: 0.08 },
  { credits: 5000, price: 350, pricePerCredit: 0.07 },
] as const;

type CreditPackage = { credits: number; price: number; pricePerCredit: number };

export default function CreditPurchaseForm({ workspaceId }: CreditPurchaseFormProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[0]);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const creditAmount = isCustom && customAmount ? customAmount : selectedPackage?.credits ?? 0;
      const pricePerCredit = isCustom ? 0.10 : selectedPackage?.pricePerCredit ?? 0.10;

      // Requirements: 4.1 - Process payment via Stripe
      await startCreditCheckout({
        workspaceId,
        creditAmount,
        pricePerCredit,
      });
    } catch (err) {
      // Requirements: 4.3 - Show error without adding credits
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Package Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select a package
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.credits}
              type="button"
              onClick={() => {
                setSelectedPackage(pkg);
                setIsCustom(false);
              }}
              disabled={isLoading}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                !isCustom && selectedPackage?.credits === pkg.credits
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-2xl font-bold text-gray-900">
                {pkg.credits.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">credits</div>
              <div className="text-lg font-semibold text-blue-600 mt-2">
                ${pkg.price}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ${pkg.pricePerCredit.toFixed(2)} per credit
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <input
            type="checkbox"
            checked={isCustom}
            onChange={(e) => setIsCustom(e.target.checked)}
            disabled={isLoading}
            className="rounded border-gray-300"
          />
          Custom amount
        </label>
        {isCustom && (
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max="1000000"
              value={customAmount || ''}
              onChange={(e) => setCustomAmount(parseInt(e.target.value) || null)}
              placeholder="Enter credit amount"
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-sm text-gray-600">
              {customAmount && (
                <span className="font-medium">
                  ${(customAmount * 0.10).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Purchase Button */}
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading || (isCustom && !customAmount)}
        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Purchase ${isCustom && customAmount ? customAmount.toLocaleString() : selectedPackage?.credits.toLocaleString() ?? '0'} Credits`
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You will be redirected to Stripe for secure payment processing
      </p>
    </div>
  );
}
