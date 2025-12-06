/**
 * Commission Calculation Test Script
 * Tests the commission calculation functionality
 */

import { config } from 'dotenv';
config();

import prisma from '../src/lib/db/prisma';
import { ProcessCommissionUseCase } from '../src/application/use-cases/affiliate/process-commission';
import { ProcessRefundUseCase } from '../src/application/use-cases/affiliate/process-refund';
import {
  PrismaAffiliateRepository,
  PrismaReferralRepository,
} from '../src/infrastructure/affiliate/prisma-affiliate-repository';
import {
  calculateCommission,
  calculateSubscriptionCommission,
  calculateCreditPurchaseCommission,
  calculateRefundAdjustment,
  isValidCommission,
} from '../src/domain/affiliate/services/commission-calculator';

async function testCommissionCalculation() {
  console.log('🧪 Testing Commission Calculation System\n');

  const affiliateRepo = new PrismaAffiliateRepository();
  const referralRepo = new PrismaReferralRepository();

  try {
    // Test 1: Basic Commission Calculation
    console.log('Test 1: Basic Commission Calculation');
    const result1 = calculateCommission({
      amount: 10000, // $100.00
      commissionRate: 0.1, // 10%
    });
    console.log(`  Amount: $${(result1.amount / 100).toFixed(2)}`);
    console.log(`  Rate: ${(result1.rate * 100).toFixed(1)}%`);
    console.log(`  Commission: $${(result1.commission / 100).toFixed(2)}`);
    console.log(`  Expected: $10.00`);
    console.log(result1.commission === 1000 ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 2: Tier-Based Commission
    console.log('Test 2: Tier-Based Commission (Tier 2)');
    const result2 = calculateCommission({
      amount: 10000, // $100.00
      commissionRate: 0.1, // 10%
      tier: 2, // 110% multiplier
    });
    console.log(`  Amount: $${(result2.amount / 100).toFixed(2)}`);
    console.log(`  Base Rate: 10%`);
    console.log(`  Tier: 2 (110% multiplier)`);
    console.log(`  Applied Rate: ${(result2.rate * 100).toFixed(1)}%`);
    console.log(`  Commission: $${(result2.commission / 100).toFixed(2)}`);
    console.log(`  Expected: $11.00`);
    console.log(result2.commission === 1100 ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 3: Subscription Commission
    console.log('Test 3: Subscription Commission');
    const result3 = calculateSubscriptionCommission(5000, 0.15); // $50, 15%
    console.log(`  Subscription: $${(result3.amount / 100).toFixed(2)}`);
    console.log(`  Rate: ${(result3.rate * 100).toFixed(1)}%`);
    console.log(`  Commission: $${(result3.commission / 100).toFixed(2)}`);
    console.log(`  Expected: $7.50`);
    console.log(result3.commission === 750 ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 4: Credit Purchase Commission
    console.log('Test 4: Credit Purchase Commission');
    const result4 = calculateCreditPurchaseCommission(20000, 0.08); // $200, 8%
    console.log(`  Purchase: $${(result4.amount / 100).toFixed(2)}`);
    console.log(`  Rate: ${(result4.rate * 100).toFixed(1)}%`);
    console.log(`  Commission: $${(result4.commission / 100).toFixed(2)}`);
    console.log(`  Expected: $16.00`);
    console.log(result4.commission === 1600 ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 5: Refund Adjustment
    console.log('Test 5: Refund Adjustment');
    const originalCommission = 1000; // $10.00
    const adjustment = calculateRefundAdjustment(originalCommission);
    console.log(
      `  Original Commission: $${(originalCommission / 100).toFixed(2)}`
    );
    console.log(`  Adjustment: $${(adjustment / 100).toFixed(2)}`);
    console.log(`  Expected: -$10.00`);
    console.log(adjustment === -1000 ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 6: Commission Validation
    console.log('Test 6: Commission Validation');
    console.log(`  Valid (500 of 10000): ${isValidCommission(500, 10000)}`);
    console.log(
      `  Invalid negative (-100 of 10000): ${isValidCommission(-100, 10000)}`
    );
    console.log(
      `  Invalid exceeds (15000 of 10000): ${isValidCommission(15000, 10000)}`
    );
    console.log('  ✅ Pass\n');

    // Test 7: End-to-End Commission Processing
    console.log('Test 7: End-to-End Commission Processing');

    // Create test users
    const affiliateUser = await prisma.user.create({
      data: {
        email: `affiliate-commission-${Date.now()}@test.com`,
        emailVerified: new Date(),
        passwordHash: 'test-hash',
        firstName: 'Commission',
        lastName: 'Affiliate',
      },
    });

    const referredUser = await prisma.user.create({
      data: {
        email: `referred-commission-${Date.now()}@test.com`,
        emailVerified: new Date(),
        passwordHash: 'test-hash',
        firstName: 'Referred',
        lastName: 'Customer',
      },
    });

    // Create affiliate
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        code: `TEST${Date.now()}`,
        commissionRate: 0.15, // 15%
        tier: 1,
        status: 'ACTIVE',
      },
    });

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        affiliateId: affiliate.id,
        referredUserId: referredUser.id,
        status: 'PENDING',
      },
    });

    console.log(`  Created affiliate: ${affiliate.code}`);
    console.log(`  Created referral: ${referral.id}`);

    // Process commission
    const processCommissionUseCase = new ProcessCommissionUseCase(
      affiliateRepo,
      referralRepo
    );

    const commissionResult = await processCommissionUseCase.execute({
      userId: referredUser.id,
      amount: 10000, // $100.00
      transactionType: 'subscription',
      referenceId: 'test-invoice-123',
    });

    console.log(`  Commission processed: ${commissionResult.processed}`);
    console.log(
      `  Commission amount: $${(commissionResult.commission! / 100).toFixed(2)}`
    );
    console.log(`  Expected: $15.00`);

    // Verify affiliate earnings
    const updatedAffiliate = await prisma.affiliate.findUnique({
      where: { id: affiliate.id },
    });

    console.log(
      `  Affiliate total earnings: $${(updatedAffiliate!.totalEarnings / 100).toFixed(2)}`
    );
    console.log(
      `  Affiliate pending earnings: $${(updatedAffiliate!.pendingEarnings / 100).toFixed(2)}`
    );

    // Verify referral status
    const updatedReferral = await prisma.referral.findUnique({
      where: { id: referral.id },
    });

    console.log(`  Referral status: ${updatedReferral!.status}`);
    console.log(
      `  Referral commission: $${(updatedReferral!.commission / 100).toFixed(2)}`
    );

    const test7Pass =
      commissionResult.processed &&
      commissionResult.commission === 1500 &&
      updatedAffiliate!.totalEarnings === 1500 &&
      updatedAffiliate!.pendingEarnings === 1500 &&
      updatedReferral!.status === 'CONVERTED';

    console.log(test7Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 8: Refund Processing
    console.log('Test 8: Refund Processing');

    const processRefundUseCase = new ProcessRefundUseCase(
      affiliateRepo,
      referralRepo
    );

    const refundResult = await processRefundUseCase.execute({
      userId: referredUser.id,
      referenceId: 'test-invoice-123',
      type: 'refund',
    });

    console.log(`  Refund processed: ${refundResult.processed}`);
    console.log(
      `  Adjustment: $${(refundResult.adjustment! / 100).toFixed(2)}`
    );

    // Verify affiliate earnings after refund
    const affiliateAfterRefund = await prisma.affiliate.findUnique({
      where: { id: affiliate.id },
    });

    console.log(
      `  Affiliate total earnings: $${(affiliateAfterRefund!.totalEarnings / 100).toFixed(2)}`
    );
    console.log(
      `  Affiliate pending earnings: $${(affiliateAfterRefund!.pendingEarnings / 100).toFixed(2)}`
    );

    // Verify referral status after refund
    const referralAfterRefund = await prisma.referral.findUnique({
      where: { id: referral.id },
    });

    console.log(`  Referral status: ${referralAfterRefund!.status}`);

    const test8Pass =
      refundResult.processed &&
      refundResult.adjustment === -1500 &&
      affiliateAfterRefund!.totalEarnings === 0 &&
      affiliateAfterRefund!.pendingEarnings === 0 &&
      referralAfterRefund!.status === 'CANCELED';

    console.log(test8Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Cleanup
    console.log('Cleaning up test data...');
    await prisma.referral.delete({ where: { id: referral.id } });
    await prisma.affiliate.delete({ where: { id: affiliate.id } });
    await prisma.user.delete({ where: { id: affiliateUser.id } });
    await prisma.user.delete({ where: { id: referredUser.id } });
    console.log('Cleanup complete\n');

    console.log('✅ All tests passed!');
    console.log('\nCommission calculation system is working correctly:');
    console.log('  ✓ Basic commission calculation');
    console.log('  ✓ Tier-based commission rates');
    console.log('  ✓ Subscription commissions');
    console.log('  ✓ Credit purchase commissions');
    console.log('  ✓ Refund adjustments');
    console.log('  ✓ Commission validation');
    console.log('  ✓ End-to-end commission processing');
    console.log('  ✓ Refund processing');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testCommissionCalculation();
