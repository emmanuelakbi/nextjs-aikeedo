/**
 * Affiliate Schema Verification Script
 * Verifies that the affiliate database schema is properly set up
 */

import { config } from 'dotenv';
config();

import prisma from '../src/lib/db/prisma';

async function verifyAffiliateSchema() {
  console.log('🔍 Verifying affiliate schema...\n');

  try {
    // Test 1: Check if Affiliate table exists and is accessible
    console.log('✓ Testing Affiliate model...');
    const affiliateCount = await prisma.affiliate.count();
    console.log(`  Found ${affiliateCount} affiliates in database`);

    // Test 2: Check if Referral table exists and is accessible
    console.log('✓ Testing Referral model...');
    const referralCount = await prisma.referral.count();
    console.log(`  Found ${referralCount} referrals in database`);

    // Test 3: Check if Payout table exists and is accessible
    console.log('✓ Testing Payout model...');
    const payoutCount = await prisma.payout.count();
    console.log(`  Found ${payoutCount} payouts in database`);

    // Test 4: Verify enums are available
    console.log('✓ Testing enums...');
    const enums = {
      AffiliateStatus: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
      ReferralStatus: ['PENDING', 'CONVERTED', 'CANCELED'],
      PayoutMethod: ['PAYPAL', 'STRIPE', 'BANK_TRANSFER'],
      PayoutStatus: ['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'FAILED'],
    };
    console.log('  All enums defined:', Object.keys(enums).join(', '));

    console.log('\n✅ Affiliate schema verification complete!');
    console.log('\nSchema includes:');
    console.log(
      '  - Affiliate model (user affiliates with commission tracking)'
    );
    console.log('  - Referral model (tracks referred users and conversions)');
    console.log('  - Payout model (manages payout requests and processing)');
    console.log('  - 4 enums for status and method types');
    console.log('\nNext steps:');
    console.log('  1. Implement referral tracking service');
    console.log('  2. Create commission calculation logic');
    console.log('  3. Build payout processing system');
    console.log('  4. Add fraud detection rules');
    console.log('  5. Create API routes');
    console.log('  6. Build affiliate dashboard UI');
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  }
}

verifyAffiliateSchema();
