/**
 * Development Utilities Demo Script
 *
 * Demonstrates the usage of development utilities including factories.
 * Run with: tsx scripts/dev-utils-demo.ts
 *
 * Requirements: 2.5
 */

import { PrismaClient } from '@prisma/client';
import {
  // createFactories,
  // createTestScenario,
  cleanupTestData,
} from '../src/lib/testing';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Development Utilities Demo\n');

  // Clean up first
  console.log('🧹 Cleaning up existing test data...');
  await cleanupTestData(prisma);
  console.log('✅ Cleanup complete\n');

  // Demo 1: Using factories directly
  console.log('📦 Demo 1: Using Factories Directly');
  console.log('─'.repeat(50));

  // const factories = createFactories(prisma);
  // const { user, password } = await factories.user.create({
  //   email: 'demo@example.com',
  //   firstName: 'Demo',
  //   lastName: 'User',
  // });
  // console.log(`✅ Created user: ${user.email} (password: ${password})`);
  // const workspace = await factories.workspace.create({
  //   name: 'Demo Workspace',
  //   ownerId: user.id,
  //   creditCount: 500,
  // });
  // console.log(
  //   `✅ Created workspace: ${workspace.name} (${workspace.creditCount} credits)\n`
  // );

  // Demo 2: Creating a complete test scenario
  console.log('🎬 Demo 2: Creating Complete Test Scenario');
  console.log('─'.repeat(50));

  await cleanupTestData(prisma);

  // const scenario = await createTestScenario(prisma);
  // console.log(
  //   `✅ Admin: ${scenario.admin.user.email} (password: ${scenario.admin.password})`
  // );
  // console.log(
  //   `   Workspace: ${scenario.admin.workspace.name} (${scenario.admin.workspace.creditCount} credits)`
  // );
  // console.log(
  //   `✅ User: ${scenario.user.user.email} (password: ${scenario.user.password})`
  // );
  // console.log(
  //   `   Workspace: ${scenario.user.workspace.name} (${scenario.user.workspace.creditCount} credits)`
  // );
  // console.log(
  //   `✅ Unverified: ${scenario.unverified.user.email} (password: ${scenario.unverified.password})`
  // );
  // console.log(
  //   `✅ Shared Workspace: ${scenario.sharedWorkspace.name} (${scenario.sharedWorkspace.creditCount} credits)\n`
  // );

  // Demo 3: Batch creation
  console.log('🔢 Demo 3: Batch Creation');
  console.log('─'.repeat(50));

  // const users = await factories.user.createMany(3, { emailVerified: true });
  // console.log(`✅ Created ${users.length} users:`);
  // users.forEach(({ user }) => console.log(`   - ${user.email}`));

  // const workspaces = await factories.workspace.createMany(2, {
  //   creditCount: 1000,
  // });
  // console.log(`✅ Created ${workspaces.length} workspaces:`);
  // workspaces.forEach((ws) =>
  //   console.log(`   - ${ws.name} (${ws.creditCount} credits)`)
  // );

  console.log('\n🎉 Demo complete!');
  console.log('\n💡 Tips:');
  console.log('   - Use factories in your tests for consistent test data');
  console.log('   - Use createTestScenario() for integration tests');
  console.log('   - Use cleanupTestData() in beforeEach hooks');
  console.log('   - Development API routes available at /api/dev/*');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
