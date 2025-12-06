import { describe, it, expect } from 'vitest';
import {
  getUserStatusVariant,
  getSubscriptionStatusVariant,
  getUserRoleVariant,
} from '../index';

/**
 * Admin UI Components Tests
 *
 * Requirements: Admin Dashboard 14 - Build admin UI components
 *
 * Tests for reusable admin UI components helper functions.
 */

describe('StatusBadge Helper Functions', () => {
  describe('getUserStatusVariant', () => {
    it('returns success for ACTIVE status', () => {
      expect(getUserStatusVariant('ACTIVE')).toBe('success');
    });

    it('returns neutral for INACTIVE status', () => {
      expect(getUserStatusVariant('INACTIVE')).toBe('neutral');
    });

    it('returns error for SUSPENDED status', () => {
      expect(getUserStatusVariant('SUSPENDED')).toBe('error');
    });

    it('returns neutral for unknown status', () => {
      expect(getUserStatusVariant('UNKNOWN')).toBe('neutral');
    });

    it('handles case insensitivity', () => {
      expect(getUserStatusVariant('active')).toBe('success');
      expect(getUserStatusVariant('suspended')).toBe('error');
    });
  });

  describe('getSubscriptionStatusVariant', () => {
    it('returns success for ACTIVE status', () => {
      expect(getSubscriptionStatusVariant('ACTIVE')).toBe('success');
    });

    it('returns info for TRIALING status', () => {
      expect(getSubscriptionStatusVariant('TRIALING')).toBe('info');
    });

    it('returns warning for PAST_DUE status', () => {
      expect(getSubscriptionStatusVariant('PAST_DUE')).toBe('warning');
    });

    it('returns error for CANCELED status', () => {
      expect(getSubscriptionStatusVariant('CANCELED')).toBe('error');
    });

    it('returns error for UNPAID status', () => {
      expect(getSubscriptionStatusVariant('UNPAID')).toBe('error');
    });

    it('returns warning for INCOMPLETE status', () => {
      expect(getSubscriptionStatusVariant('INCOMPLETE')).toBe('warning');
    });

    it('returns warning for INCOMPLETE_EXPIRED status', () => {
      expect(getSubscriptionStatusVariant('INCOMPLETE_EXPIRED')).toBe(
        'warning'
      );
    });

    it('returns neutral for unknown status', () => {
      expect(getSubscriptionStatusVariant('UNKNOWN')).toBe('neutral');
    });

    it('handles case insensitivity', () => {
      expect(getSubscriptionStatusVariant('active')).toBe('success');
      expect(getSubscriptionStatusVariant('canceled')).toBe('error');
    });
  });

  describe('getUserRoleVariant', () => {
    it('returns purple for ADMIN role', () => {
      expect(getUserRoleVariant('ADMIN')).toBe('purple');
    });

    it('returns blue for USER role', () => {
      expect(getUserRoleVariant('USER')).toBe('blue');
    });

    it('returns blue for unknown role', () => {
      expect(getUserRoleVariant('UNKNOWN')).toBe('blue');
    });

    it('handles case insensitivity', () => {
      expect(getUserRoleVariant('admin')).toBe('purple');
      expect(getUserRoleVariant('user')).toBe('blue');
    });
  });
});
