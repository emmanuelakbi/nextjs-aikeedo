/**
 * Database Seed Script
 *
 * This script populates the database with test data for development.
 * Run with: npm run db:seed
 *
 * Test credentials:
 * - Admin: admin@aikeedo.com / password123
 * - User: user@example.com / password123
 *
 * Requirements: 2.5
 */

import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

// For seeding, use simple PrismaClient
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password once for all users
  const hashedPassword = await bcryptjs.hash('password123', 12);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@aikeedo.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Created admin user: admin@aikeedo.com');

  // Create admin's personal workspace
  const adminWorkspace = await prisma.workspace.create({
    data: {
      name: 'Personal',
      ownerId: admin.id,
      creditCount: 1000,
    },
  });

  // Add admin as member of their workspace
  await prisma.workspaceMember.create({
    data: {
      workspaceId: adminWorkspace.id,
      userId: admin.id,
      role: 'OWNER',
    },
  });
  console.log('✅ Created admin workspace');

  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Created test user: user@example.com');

  // Create test user's personal workspace
  const userWorkspace = await prisma.workspace.create({
    data: {
      name: 'Personal',
      ownerId: testUser.id,
      creditCount: 100,
    },
  });

  // Add test user as member of their workspace
  await prisma.workspaceMember.create({
    data: {
      workspaceId: userWorkspace.id,
      userId: testUser.id,
      role: 'OWNER',
    },
  });
  console.log('✅ Created test user workspace');

  // Create shared workspace owned by admin
  const sharedWorkspace = await prisma.workspace.create({
    data: {
      name: 'Team Workspace',
      ownerId: admin.id,
      creditCount: 5000,
    },
  });

  // Add admin as owner
  await prisma.workspaceMember.create({
    data: {
      workspaceId: sharedWorkspace.id,
      userId: admin.id,
      role: 'OWNER',
    },
  });

  // Add test user as member of shared workspace
  await prisma.workspaceMember.create({
    data: {
      workspaceId: sharedWorkspace.id,
      userId: testUser.id,
      role: 'MEMBER',
    },
  });
  console.log('✅ Created shared workspace');

  // Create billing plans
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      description: 'Perfect for trying out AIKEEDO',
      price: 0,
      currency: 'usd',
      interval: 'MONTH',
      creditCount: 100,
      features: {
        textGeneration: true,
        imageGeneration: false,
        speechSynthesis: false,
        transcription: false,
        support: 'community',
      },
      limits: {
        maxUsers: 1,
        maxGenerations: 100,
        maxStorage: 1024 * 1024 * 100, // 100MB
      },
      stripeProductId: 'prod_free_test',
      stripePriceId: 'price_free_test',
      isActive: true,
    },
  });
  console.log('✅ Created Free plan');

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      description: 'For professionals and small teams',
      price: 2900, // $29.00
      currency: 'usd',
      interval: 'MONTH',
      creditCount: 1000,
      features: {
        textGeneration: true,
        imageGeneration: true,
        speechSynthesis: true,
        transcription: true,
        support: 'email',
        customPresets: true,
      },
      limits: {
        maxUsers: 5,
        maxGenerations: 1000,
        maxStorage: 1024 * 1024 * 1024 * 5, // 5GB
      },
      stripeProductId: 'prod_pro_test',
      stripePriceId: 'price_pro_test',
      isActive: true,
    },
  });
  console.log('✅ Created Pro plan');

  const businessPlan = await prisma.plan.create({
    data: {
      name: 'Business',
      description: 'For growing businesses and teams',
      price: 9900, // $99.00
      currency: 'usd',
      interval: 'MONTH',
      creditCount: 5000,
      features: {
        textGeneration: true,
        imageGeneration: true,
        speechSynthesis: true,
        transcription: true,
        voiceCloning: true,
        support: 'priority',
        customPresets: true,
        apiAccess: true,
      },
      limits: {
        maxUsers: 20,
        maxGenerations: 5000,
        maxStorage: 1024 * 1024 * 1024 * 50, // 50GB
      },
      stripeProductId: 'prod_business_test',
      stripePriceId: 'price_business_test',
      isActive: true,
    },
  });
  console.log('✅ Created Business plan');

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      description: 'For large organizations with custom needs',
      price: 29900, // $299.00
      currency: 'usd',
      interval: 'MONTH',
      creditCount: null, // Unlimited
      features: {
        textGeneration: true,
        imageGeneration: true,
        speechSynthesis: true,
        transcription: true,
        voiceCloning: true,
        support: 'dedicated',
        customPresets: true,
        apiAccess: true,
        sso: true,
        customIntegrations: true,
      },
      limits: {
        maxUsers: null, // Unlimited
        maxGenerations: null, // Unlimited
        maxStorage: null, // Unlimited
      },
      stripeProductId: 'prod_enterprise_test',
      stripePriceId: 'price_enterprise_test',
      isActive: true,
    },
  });
  console.log('✅ Created Enterprise plan');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin: admin@aikeedo.com / password123');
  console.log('   User:  user@example.com / password123');
  console.log('\n💳 Billing Plans:');
  console.log('   Free: $0/month - 100 credits');
  console.log('   Pro: $29/month - 1,000 credits');
  console.log('   Business: $99/month - 5,000 credits');
  console.log('   Enterprise: $299/month - Unlimited credits');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
