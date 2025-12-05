/**
 * Create Affiliate Account Card
 * Requirements: Affiliate 1 - Generate unique referral codes
 */

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CreateAffiliateCard() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!code || code.length < 4) {
      setError('Code must be at least 4 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/affiliate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          commissionRate: 20, // Default 20%
          tier: 1, // Default tier 1
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create affiliate account');
      }

      // Reload page to show dashboard
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold mb-2">Become an Affiliate</h2>
        <p className="text-gray-600">
          Join our affiliate program and earn commissions by referring new users
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            label="Choose Your Referral Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MYCODE123"
            maxLength={20}
            error={error}
            helperText="4-20 characters, letters and numbers only"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Benefits:</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>✓ Earn 20% commission on all referrals</li>
            <li>✓ Track your earnings in real-time</li>
            <li>✓ Access marketing materials</li>
            <li>✓ Monthly payouts via PayPal or Stripe</li>
          </ul>
        </div>

        <Button
          onClick={handleCreate}
          loading={loading}
          disabled={!code || code.length < 4}
          fullWidth
        >
          Create Affiliate Account
        </Button>
      </div>
    </div>
  );
}
