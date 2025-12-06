#!/usr/bin/env tsx
/**
 * Add Credits Script
 * 
 * Adds credits to a workspace for testing purposes.
 * Usage: tsx scripts/add-credits.ts <workspace-id> <amount>
 * Or: tsx scripts/add-credits.ts --all <amount>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCredits(workspaceId: string, amount: number) {
  try {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        creditCount: {
          increment: amount,
        },
      },
    });

    console.log(`✅ Added ${amount} credits to workspace "${workspace.name}"`);
    console.log(`   New balance: ${workspace.creditCount} credits`);
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    throw error;
  }
}

async function addCreditsToAll(amount: number) {
  try {
    const result = await prisma.workspace.updateMany({
      data: {
        creditCount: {
          increment: amount,
        },
      },
    });

    console.log(`✅ Added ${amount} credits to ${result.count} workspaces`);
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    throw error;
  }
}

async function listWorkspaces() {
  const workspaces = await prisma.workspace.findMany({
    include: {
      owner: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('\n📋 Available Workspaces:\n');
  workspaces.forEach((ws) => {
    console.log(`  ${ws.id}`);
    console.log(`  Name: ${ws.name}`);
    console.log(`  Owner: ${ws.owner.email} (${ws.owner.firstName} ${ws.owner.lastName})`);
    console.log(`  Credits: ${ws.creditCount}`);
    console.log('');
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage:
  tsx scripts/add-credits.ts <workspace-id> <amount>
  tsx scripts/add-credits.ts --all <amount>
  tsx scripts/add-credits.ts --list

Examples:
  tsx scripts/add-credits.ts abc-123 1000          # Add 1000 credits to workspace abc-123
  tsx scripts/add-credits.ts --all 5000            # Add 5000 credits to all workspaces
  tsx scripts/add-credits.ts --list                # List all workspaces
`);
    process.exit(0);
  }

  if (args[0] === '--list' || args[0] === '-l') {
    await listWorkspaces();
    process.exit(0);
  }

  if (args[0] === '--all' || args[0] === '-a') {
    if (args.length < 2) {
      console.error('❌ Error: Amount is required');
      console.log('Usage: tsx scripts/add-credits.ts --all <amount>');
      process.exit(1);
    }

    const amount = parseInt(args[1], 10);
    if (isNaN(amount) || amount <= 0) {
      console.error('❌ Error: Amount must be a positive number');
      process.exit(1);
    }

    await addCreditsToAll(amount);
    process.exit(0);
  }

  if (args.length < 2) {
    console.error('❌ Error: Workspace ID and amount are required');
    console.log('Usage: tsx scripts/add-credits.ts <workspace-id> <amount>');
    process.exit(1);
  }

  const workspaceId = args[0];
  const amount = parseInt(args[1], 10);

  if (isNaN(amount) || amount <= 0) {
    console.error('❌ Error: Amount must be a positive number');
    process.exit(1);
  }

  await addCredits(workspaceId, amount);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
