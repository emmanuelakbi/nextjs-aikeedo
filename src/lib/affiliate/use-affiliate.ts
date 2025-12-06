/**
 * Affiliate React Hook
 * Requirements: Affiliate 1, 4
 *
 * Client-side hook for affiliate operations
 */

'use client';

import { useState, useEffect } from 'react';
import type { Affiliate, AffiliateStats, Referral } from '@/types/affiliate';

interface UseAffiliateReturn {
  affiliate: Affiliate | null;
  stats: AffiliateStats | null;
  referrals: Referral[];
  loading: boolean;
  error: string | null;
  createAffiliate: (data?: { code?: string }) => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshReferrals: () => Promise<void>;
}

export function useAffiliate(): UseAffiliateReturn {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/affiliate/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        return true;
      } else if (response.status === 404) {
        // No affiliate account
        setStats(null);
        return false;
      }
      throw new Error('Failed to fetch stats');
    } catch (err) {
      console.error('Error fetching affiliate stats:', err);
      return false;
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/affiliate/referrals');
      if (response.ok) {
        const data = await response.json();
        setReferrals(data.data);
      } else if (response.status === 404) {
        setReferrals([]);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    }
  };

  const createAffiliate = async (data?: { code?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/affiliate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to create affiliate account'
        );
      }

      const result = await response.json();
      setAffiliate(result.data);

      // Refresh stats after creating affiliate
      await fetchStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setLoading(true);
    await fetchStats();
    setLoading(false);
  };

  const refreshReferrals = async () => {
    setLoading(true);
    await fetchReferrals();
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const hasAffiliate = await fetchStats();
      if (hasAffiliate) {
        await fetchReferrals();
      }
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    affiliate,
    stats,
    referrals,
    loading,
    error,
    createAffiliate,
    refreshStats,
    refreshReferrals,
  };
}
