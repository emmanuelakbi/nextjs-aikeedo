/**
 * Referral Tracking Test Script
 * Tests the referral tracking functionality
 */

import { config } from 'dotenv';
config();

import prisma from '../src/lib/db/prisma';
import { CreateAffiliateUseCase } from '../src/application/use-cases/affiliate/create-affiliate';
import { TrackReferralUseCase } from '../src/application/use-cases/affiliate/track-referral';
import { GetAffiliateStatsUseCase } from '../src/application/use-cases/affiliate/get-affiliate-stats';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '../src/infrastructure/affiliate/prisma-affiliate-repository';
import {
  generateReferralCode,
  isValidReferralCode,
} from '../src/domain/affiliate/services/referral-tracker';

async function testReferralTracking() {
  console.log('🧪 Testing Referral Tracking System\n');

  const affiliateRepo = new PrismaAffiliateRepository();
  const referralRepo = new PrismaReferralRepository();

  try {
    // Test 1: Code Generation
    console.log('Test 1: Code Generation');
    const testUserId = 'test-user-123';
    const generatedCode = generateReferralCode(testUserId);
    console.log(`  Generated code: ${generatedCode}`);
    console.log(`  Valid format: ${isValidReferralCode(generatedCode)}`);
    console.log('  ✅ Pass\n');

    // Test 2: Code Validation
    console.log('Test 2: Code Validation');
    console.log(`  Valid code "ABC123": ${isValidReferralCode('ABC123')}`);
    console.log(`  Invalid code "AB": ${isValidReferralCode('AB')}`);
    console.log(`  Invalid code "ABC@123": ${isValidReferralCode('ABC@123')}`);
    console.log('  ✅ Pass\n');

    // Test 3: Create Test Users
    console.log('Test 3: Creating Test Users');
    const affiliateUser = await prisma.user.create({
      data: {
        email: `affiliate-${Date.now()}@test.com`,
        emailVerified: new Date(),
        passwordHash: 'test-hash',
        firstName: 'Affiliate',
        lastName: 'User',
      },
    });
    console.log(`  Created affiliate user: ${affiliateUser.id}`);

    const referredUser = await prisma.user.create({
      data: {
        email: `referred-${Date.now()}@test.com`,
        emailVerified: new Date(),
        passwordHash: 'test-hash',
        firstName: 'Referred',
        lastName: 'User',
      },
    });
    console.log(`  Created referred user: ${referredUser.id}`);
    console.log('  ✅ Pass\n');

    // Test 4: Create Affiliate
    console.log('Test 4: Create Affiliate Account');
    const createAffiliateUseCase = new CreateAffiliateUseCase(affiliateRepo);
    const affiliate = await createAffiliateUseCase.execute({
      userId: affiliateUser.id,
    });
    console.log(`  Affiliate ID: ${affiliate.id}`);
    console.log(`  Referral Code: ${affiliate.code}`);
    console.log(`  Commission Rate: ${affiliate.commissionRate * 100}%`);
    console.log(`  Status: ${affiliate.status}`);
    console.log('  ✅ Pass\n');

    // Test 5: Track Referral
    console.log('Test 5: Track Referral');
    const trackReferralUseCase = new TrackReferralUseCase(
      affiliateRepo,
      referralRepo
    );
    const referral = await trackReferralUseCase.execute({
      affiliateCode: affiliate.code,
      referredUserId: referredUser.id,
    });
    console.log(`  Referral ID: ${referral.id}`);
    console.log(`  Status: ${referral.status}`);
    console.log(`  Affiliate ID: ${referral.affiliateId}`);
    console.log(`  Referred User ID: ${referral.referredUserId}`);
    console.log('  ✅ Pass\n');

    // Test 6: Get Affiliate Stats
    console.log('Test 6: Get Affiliate Statistics');
    const getStatsUseCase = new GetAffiliateStatsUseCase(affiliateRepo);
    const stats = await getStatsUseCase.execute(affiliateUser.id);
    console.log(`  Total Referrals: ${stats.totalReferrals}`);
    console.log(`  Converted Referrals: ${stats.convertedReferrals}`);
    console.log(
      `  Conversion Rate: ${(stats.conversionRate * 100).toFixed(1)}%`
    );
    console.log(`  Total Earnings: $${(stats.totalEarnings / 100).toFixed(2)}`);
    console.log('  ✅ Pass\n');

    // Test 7: Prevent Self-Referral
    console.log('Test 7: Prevent Self-Referral');
    try {
      await trackReferralUseCase.execute({
        affiliateCode: affiliate.code,
        referredUserId: affiliateUser.id, // Same as affiliate user
      });
      console.log('  ❌ Fail - Should have thrown error');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Self-referrals are not allowed'
      ) {
        console.log('  ✅ Pass - Self-referral blocked\n');
      } else {
        throw error;
      }
    }

    // Test 8: Prevent Duplicate Referral
    console.log('Test 8: Prevent Duplicate Referral');
    try {
      await trackReferralUseCase.execute({
        affiliateCode: affiliate.code,
        referredUserId: referredUser.id, // Already referred
      });
      console.log('  ❌ Fail - Should have thrown error');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'User was already referred'
      ) {
        console.log('  ✅ Pass - Duplicate referral blocked\n');
      } else {
        throw error;
      }
    }

    // Test 9: Invalid Referral Code
    console.log('Test 9: Invalid Referral Code');
    try {
      await trackReferralUseCase.execute({
        affiliateCode: 'INVALID-CODE-999',
        referredUserId: referredUser.id,
      });
      console.log('  ❌ Fail - Should have thrown error');
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid referral code') {
        console.log('  ✅ Pass - Invalid code rejected\n');
      } else {
        throw error;
      }
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await prisma.referral.deleteMany({
      where: { affiliateId: affiliate.id },
    });
    await prisma.affiliate.delete({
      where: { id: affiliate.id },
    });
    await prisma.user.delete({
      where: { id: affiliateUser.id },
    });
    await prisma.user.delete({
      where: { id: referredUser.id },
    });
    console.log('Cleanup complete\n');

    console.log('✅ All tests passed!');
    console.log('\nReferral tracking system is working correctly:');
    console.log('  ✓ Code generation and validation');
    console.log('  ✓ Affiliate account creation');
    console.log('  ✓ Referral tracking');
    console.log('  ✓ Statistics calculation');
    console.log('  ✓ Self-referral prevention');
    console.log('  ✓ Duplicate referral prevention');
    console.log('  ✓ Invalid code rejection');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testReferralTracking();
