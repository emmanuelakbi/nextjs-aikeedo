/**
 * Cleanup script to remove empty messages from conversations
 * Run with: npx tsx scripts/cleanup-empty-messages.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding empty messages...');
  
  const emptyMessages = await prisma.message.findMany({
    where: {
      content: ''
    },
    select: {
      id: true,
      role: true,
      content: true,
      conversationId: true,
    }
  });
  
  console.log(`Found ${emptyMessages.length} empty messages`);
  
  if (emptyMessages.length > 0) {
    console.log('Deleting empty messages...');
    const result = await prisma.message.deleteMany({
      where: {
        content: ''
      }
    });
    console.log(`Deleted ${result.count} empty messages`);
  }
  
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
