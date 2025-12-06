/**
 * Check if admin user exists in database
 */

import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@aikeedo.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        passwordHash: true,
      },
    });

    if (user) {
      console.log('✅ Admin user found:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Name:', user.firstName, user.lastName);
      console.log('  Role:', user.role);
      console.log('  Status:', user.status);
      console.log('  Email Verified:', user.emailVerified ? 'Yes' : 'No');
      console.log('  Password Hash:', user.passwordHash ? 'Set' : 'Not set');
    } else {
      console.log('❌ Admin user not found');
      console.log('\nCreating admin user...');
      
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@aikeedo.com',
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: new Date(),
          language: 'en-US',
        },
      });
      
      console.log('✅ Admin user created:', newUser.id);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
