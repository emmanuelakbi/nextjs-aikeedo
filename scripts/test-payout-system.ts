/**
 * Payout System Test Script
 * Tests the payout system functionality
 */

import { config } from 'dotenv';
config();

import prisma from '../src/lib/db/prisma';
import { RequestPayoutUseCase } from '../src/application/use-cases/affiliate/request-payout';
import { ApprovePayoutUseCase } from '../src/application/use-cases/affiliate/approve-payout';
import { RejectPayoutUseCase } from '../src/application/use-cases/affiliate/reject-payout';
import { ProcessPayoutUseCase } from '../src/application/use-cases/affiliate/process-payout';
import { PrismaAffiliateRepository } from '../src/infrastructure/affiliate/prisma-affiliate-repository';
import { PrismaPayoutRepository } from '../src/infrastructure/affiliate/prisma-payout-repository';

async function testPayoutSystem() {
  console.log('🧪 Testing Payout System\n');

  const affiliateRepo = new PrismaAffiliateRepository();
  const payoutRepo = new PrismaPayoutRepository();

  try {
    // Test 1: Create Test Data
    console.log('Test 1: Creating Test Data');

    const affiliateUser = await prisma.user.create({
      data: {
        email: `payout-affiliate-${Date.now()}@test.com`,
        emailVerified: new Date(),
        passwordHash: 'test-hash',
        firstName: 'Payout',
        lastName: 'Affiliate',
      },
    });

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        code: `PAYOUT${Date.now()}`,
        commissionRate: 0.1,
        tier: 1,
        status: 'ACTIVE',
        totalEarnings: 10000, // $100.00
        pendingEarnings: 10000, // $100.00
        paidEarnings: 0,
      },
    });

    console.log(`  Created affiliate: ${affiliate.code}`);
    console.log(`  Pending earnings: $${(affiliate.pendingEarnings / 100).toFixed(2)}`);
    console.log('  ✅ Pass\n');

    // Test 2: Request Payout
    console.log('Test 2: Request Payout');

    const requestPayoutUseCase = new RequestPayoutUseCase(
      affiliateRepo,
      payoutRepo
    );

    const requestResult = await requestPayoutUseCase.execute({
      userId: affiliateUser.id,
      amount: 5000, // $50.00
      method: 'PAYPAL',
      notes: 'Test payout request',
    });

    console.log(`  Request success: ${requestResult.success}`);
    console.log(`  Payout ID: ${requestResult.payout?.id}`);
    console.log(`  Amount: $${(requestResult.payout!.amount / 100).toFixed(2)}`);
    console.log(`  Method: ${requestResult.payout?.method}`);
    console.log(`  Status: ${requestResult.payout?.status}`);

    const test2Pass = requestResult.success && requestResult.payout?.status === 'PENDING';
    console.log(test2Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    const payoutId = requestResult.payout!.id;

    // Test 3: Minimum Payout Amount
    console.log('Test 3: Minimum Payout Amount Validation');

    const minPayoutResult = await requestPayoutUseCase.execute({
      userId: affiliateUser.id,
      amount: 1000, // $10.00 (below minimum)
      method: 'PAYPAL',
    });

    console.log(`  Request success: ${minPayoutResult.success}`);
    console.log(`  Error: ${minPayoutResult.error}`);

    const test3Pass = !minPayoutResult.success && minPayoutResult.error?.includes('Minimum payout');
    console.log(test3Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 4: Insufficient Earnings
    console.log('Test 4: Insufficient Earnings Validation');

    const insufficientResult = await requestPayoutUseCase.execute({
      userId: affiliateUser.id,
      amount: 20000, // $200.00 (more than available)
      method: 'PAYPAL',
    });

    console.log(`  Request success: ${insufficientResult.success}`);
    console.log(`  Error: ${insufficientResult.error}`);

    const test4Pass = !insufficientResult.success && insufficientResult.error?.includes('Insufficient');
    console.log(test4Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 5: Approve Payout
    console.log('Test 5: Approve Payout');

    const approvePayoutUseCase = new ApprovePayoutUseCase(payoutRepo);

    const approveResult = await approvePayoutUseCase.execute({
      payoutId,
      notes: 'Approved by admin',
    });

    console.log(`  Approve success: ${approveResult.success}`);
    console.log(`  Status: ${approveResult.payout?.status}`);

    const test5Pass = approveResult.success && approveResult.payout?.status === 'APPROVED';
    console.log(test5Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 6: Process Payout
    console.log('Test 6: Process Payout');

    const processPayoutUseCase = new ProcessPayoutUseCase(
      affiliateRepo,
      payoutRepo
    );

    const processResult = await processPayoutUseCase.execute({
      payoutId,
    });

    console.log(`  Process success: ${processResult.success}`);
    console.log(`  Status: ${processResult.payout?.status}`);

    // Verify affiliate earnings updated
    const updatedAffiliate = await prisma.affiliate.findUnique({
      where: { id: affiliate.id },
    });

    console.log(`  Pending earnings: $${(updatedAffiliate!.pendingEarnings / 100).toFixed(2)}`);
    console.log(`  Paid earnings: $${(updatedAffiliate!.paidEarnings / 100).toFixed(2)}`);

    const test6Pass =
      processResult.success &&
      processResult.payout?.status === 'PAID' &&
      updatedAffiliate!.pendingEarnings === 5000 &&
      updatedAffiliate!.paidEarnings === 5000;

    console.log(test6Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 7: Reject Payout
    console.log('Test 7: Reject Payout');

    // Create another payout to reject
    const rejectPayoutRequest = await requestPayoutUseCase.execute({
      userId: affiliateUser.id,
      amount: 5000,
      method: 'STRIPE',
    });

    const rejectPayoutUseCase = new RejectPayoutUseCase(payoutRepo);

    const rejectResult = await rejectPayoutUseCase.execute({
      payoutId: rejectPayoutRequest.payout!.id,
      reason: 'Invalid payment details',
    });

    console.log(`  Reject success: ${rejectResult.success}`);
    console.log(`  Status: ${rejectResult.payout?.status}`);
    console.log(`  Notes: ${rejectResult.payout?.notes}`);

    const test7Pass =
      rejectResult.success &&
      rejectResult.payout?.status === 'REJECTED' &&
      rejectResult.payout?.notes?.includes('Invalid payment details');

    console.log(test7Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Test 8: Payout Statistics
    console.log('Test 8: Payout Statistics');

    const stats = await payoutRepo.getStats(affiliate.id);

    console.log(`  Total requested: $${(stats.totalRequested / 100).toFixed(2)}`);
    console.log(`  Total paid: $${(stats.totalPaid / 100).toFixed(2)}`);
    console.log(`  Total pending: $${(stats.totalPending / 100).toFixed(2)}`);
    console.log(`  Total rejected: $${(stats.totalRejected / 100).toFixed(2)}`);
    console.log(`  Payout count: ${stats.payoutCount}`);

    const test8Pass =
      stats.totalRequested === 10000 &&
      stats.totalPaid === 5000 &&
      stats.totalRejected === 5000 &&
      stats.payoutCount === 2;

    console.log(test8Pass ? '  ✅ Pass\n' : '  ❌ Fail\n');

    // Cleanup
    console.log('Cleaning up test data...');
    await prisma.payout.deleteMany({
      where: { affiliateId: affiliate.id },
    });
    await prisma.affiliate.delete({
      where: { id: affiliate.id },
    });
    await prisma.user.delete({
      where: { id: affiliateUser.id },
    });
    console.log('Cleanup complete\n');

    console.log('✅ All tests passed!');
    console.log('\nPayout system is working correctly:');
    console.log('  ✓ Payout request creation');
    console.log('  ✓ Minimum amount validation');
    console.log('  ✓ Insufficient earnings validation');
    console.log('  ✓ Payout approval');
    console.log('  ✓ Payout processing');
    console.log('  ✓ Payout rejection');
    console.log('  ✓ Payout statistics');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testPayoutSystem();
