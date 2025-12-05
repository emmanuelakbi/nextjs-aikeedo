/**
 * Referral Code Card Component
 * Requirements: Affiliate 4 - Display referral code and link
 */

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface ReferralCodeCardProps {
  affiliate: {
    code: string;
    commissionRate: number;
    tier: number;
    status: string;
  };
}

export default function ReferralCodeCard({ affiliate }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralUrl = `${baseUrl}?ref=${affiliate.code}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Referral Code</h2>
          <p className="text-blue-100">
            Share this code to earn {affiliate.commissionRate}% commission
          </p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
          Tier {affiliate.tier}
        </div>
      </div>

      <div className="space-y-3">
        {/* Referral Code */}
        <div>
          <label className="text-sm text-blue-100 mb-1 block">Referral Code</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 font-mono text-xl font-bold">
              {affiliate.code}
            </div>
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(affiliate.code)}
              className="bg-white/20 hover:bg-white/30 border-0"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Referral URL */}
        <div>
          <label className="text-sm text-blue-100 mb-1 block">Referral Link</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 font-mono text-sm truncate">
              {referralUrl}
            </div>
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(referralUrl)}
              className="bg-white/20 hover:bg-white/30 border-0"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>

      {affiliate.status !== 'ACTIVE' && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
          <p className="text-sm font-medium">
            ⚠️ Your affiliate account is currently {affiliate.status.toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}
