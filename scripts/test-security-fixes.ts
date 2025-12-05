/**
 * Security Fixes Testing Script
 * Tests all critical bug fixes to ensure they work correctly
 */

import { prisma } from '@/lib/db';
import { RateLimiter } from '@/lib/middleware/rate-limit';
import { validateCreditAmount, validateCreditBalance, validateCreditOperation } from '@/lib/validation/credit-validation';
import { sanitizeText, sanitizeWorkspaceName } from '@/lib/security/sanitize';

async function testWebhookIdempotency() {
  console.log('\n🧪 Testing Webhook Idempotency...');
  
  try {
    const testWorkspaceId = 'test-workspace-id';
    const testPaymentIntentId = 'pi_test_' + Date.now();
    
    // Try to create duplicate credit transactions
    const transaction1 = await prisma.creditTransaction.create({
      data: {
        workspaceId: testWorkspaceId,
        amount: 1000,
        type: 'PURCHASE',
        description: 'Test purchase',
        referenceId: testPaymentIntentId,
        referenceType: 'payment_intent',
        balanceBefore: 0,
        balanceAfter: 1000,
      },
    });
    
    console.log('✅ First transaction created:', transaction1.id);
    
    // Try to create duplicate (should fail)
    try {
      await prisma.creditTransaction.create({
        data: {
          workspaceId: testWorkspaceId,
          amount: 1000,
          type: 'PURCHASE',
          description: 'Test purchase duplicate',
          referenceId: testPaymentIntentId,
          referenceType: 'payment_intent',
          balanceBefore: 0,
          balanceAfter: 1000,
        },
      });
      console.log('❌ FAILED: Duplicate transaction was created');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        console.log('✅ PASSED: Duplicate transaction prevented by unique constraint');
      } else {
        throw error;
      }
    }
    
    // Cleanup
    await prisma.creditTransaction.delete({ where: { id: transaction1.id } });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testRateLimiting() {
  console.log('\n🧪 Testing Rate Limiting...');
  
  const rateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 5,
    keyPrefix: 'test',
  });
  
  const testId = 'test-user-' + Date.now();
  
  // Make 5 requests (should all succeed)
  for (let i = 1; i <= 5; i++) {
    const result = await rateLimiter.checkLimit(testId);
    if (result.allowed) {
      console.log(`✅ Request ${i}/5 allowed, remaining: ${result.remaining}`);
    } else {
      console.log(`❌ FAILED: Request ${i}/5 was blocked unexpectedly`);
    }
  }
  
  // 6th request should be blocked
  const result = await rateLimiter.checkLimit(testId);
  if (!result.allowed) {
    console.log('✅ PASSED: 6th request blocked as expected');
  } else {
    console.log('❌ FAILED: 6th request was allowed');
  }
}

async function testCreditValidation() {
  console.log('\n🧪 Testing Credit Validation...');
  
  const tests = [
    { amount: 100, shouldPass: true, name: 'Valid positive integer' },
    { amount: -100, shouldPass: false, name: 'Negative number' },
    { amount: 0, shouldPass: false, name: 'Zero' },
    { amount: 1.5, shouldPass: false, name: 'Decimal number' },
    { amount: NaN, shouldPass: false, name: 'NaN' },
    { amount: Infinity, shouldPass: false, name: 'Infinity' },
    { amount: 1_000_000_001, shouldPass: false, name: 'Exceeds maximum' },
  ];
  
  for (const test of tests) {
    try {
      validateCreditAmount(test.amount, 'test');
      if (test.shouldPass) {
        console.log(`✅ PASSED: ${test.name} - correctly validated`);
      } else {
        console.log(`❌ FAILED: ${test.name} - should have thrown error`);
      }
    } catch (error) {
      if (!test.shouldPass) {
        console.log(`✅ PASSED: ${test.name} - correctly rejected`);
      } else {
        console.log(`❌ FAILED: ${test.name} - should have passed`);
      }
    }
  }
  
  // Test credit operations
  try {
    validateCreditOperation(1000, 500, 'remove', 'test');
    console.log('✅ PASSED: Valid credit removal');
  } catch (error) {
    console.log('❌ FAILED: Valid credit removal rejected');
  }
  
  try {
    validateCreditOperation(1000, 1500, 'remove', 'test');
    console.log('❌ FAILED: Insufficient credits not detected');
  } catch (error) {
    console.log('✅ PASSED: Insufficient credits detected');
  }
}

async function testInputSanitization() {
  console.log('\n🧪 Testing Input Sanitization...');
  
  const tests = [
    { 
      input: '<script>alert("XSS")</script>Test', 
      expected: 'Test',
      name: 'Script tag removal'
    },
    { 
      input: 'Test<img src=x onerror=alert(1)>', 
      expected: 'Test',
      name: 'Image tag with onerror'
    },
    { 
      input: 'javascript:alert(1)', 
      expected: 'alert(1)',
      name: 'JavaScript protocol'
    },
    { 
      input: 'Normal workspace name', 
      expected: 'Normal workspace name',
      name: 'Normal text'
    },
  ];
  
  for (const test of tests) {
    const result = sanitizeText(test.input);
    if (result === test.expected) {
      console.log(`✅ PASSED: ${test.name}`);
    } else {
      console.log(`❌ FAILED: ${test.name} - got "${result}", expected "${test.expected}"`);
    }
  }
  
  // Test workspace name validation
  try {
    sanitizeWorkspaceName('');
    console.log('❌ FAILED: Empty name should throw error');
  } catch (error) {
    console.log('✅ PASSED: Empty name rejected');
  }
  
  try {
    const longName = 'a'.repeat(101);
    sanitizeWorkspaceName(longName);
    console.log('❌ FAILED: Too long name should throw error');
  } catch (error) {
    console.log('✅ PASSED: Too long name rejected');
  }
}

async function testDatabaseConstraints() {
  console.log('\n🧪 Testing Database Constraints...');
  
  try {
    // Test negative credit count constraint
    try {
      await prisma.$executeRaw`
        INSERT INTO workspaces (id, name, "ownerId", "creditCount", "allocatedCredits")
        VALUES ('test-ws-1', 'Test', 'test-owner', -100, 0)
      `;
      console.log('❌ FAILED: Negative credit count was allowed');
    } catch (error) {
      if (error instanceof Error && error.message.includes('check_credit_count')) {
        console.log('✅ PASSED: Negative credit count prevented');
      } else {
        throw error;
      }
    }
    
    // Test allocated > total constraint
    try {
      await prisma.$executeRaw`
        INSERT INTO workspaces (id, name, "ownerId", "creditCount", "allocatedCredits")
        VALUES ('test-ws-2', 'Test', 'test-owner', 100, 200)
      `;
      console.log('❌ FAILED: Allocated > total was allowed');
    } catch (error) {
      if (error instanceof Error && error.message.includes('check_allocated_credits')) {
        console.log('✅ PASSED: Allocated > total prevented');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testSubscriptionVersioning() {
  console.log('\n🧪 Testing Subscription Optimistic Locking...');
  
  try {
    // Create test subscription
    const testSub = await prisma.subscription.create({
      data: {
        workspaceId: 'test-workspace',
        planId: 'test-plan',
        stripeSubscriptionId: 'sub_test_' + Date.now(),
        stripeCustomerId: 'cus_test',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        version: 0,
      },
    });
    
    console.log('✅ Subscription created with version 0');
    
    // Update with correct version
    const updated = await prisma.subscription.updateMany({
      where: {
        id: testSub.id,
        version: 0,
      },
      data: {
        status: 'PAST_DUE',
        version: 1,
      },
    });
    
    if (updated.count === 1) {
      console.log('✅ PASSED: Update with correct version succeeded');
    } else {
      console.log('❌ FAILED: Update with correct version failed');
    }
    
    // Try to update with old version (should fail)
    const failedUpdate = await prisma.subscription.updateMany({
      where: {
        id: testSub.id,
        version: 0, // Old version
      },
      data: {
        status: 'CANCELED',
        version: 2,
      },
    });
    
    if (failedUpdate.count === 0) {
      console.log('✅ PASSED: Update with old version prevented');
    } else {
      console.log('❌ FAILED: Update with old version succeeded');
    }
    
    // Cleanup
    await prisma.subscription.delete({ where: { id: testSub.id } });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Security Fixes Tests\n');
  console.log('=' .repeat(50));
  
  await testWebhookIdempotency();
  await testRateLimiting();
  await testCreditValidation();
  await testInputSanitization();
  await testDatabaseConstraints();
  await testSubscriptionVersioning();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!\n');
  
  await prisma.$disconnect();
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
