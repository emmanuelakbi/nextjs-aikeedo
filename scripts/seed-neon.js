const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Neon...');

  const hashedPassword = await bcrypt.hashSync('password123', 12);

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@aikeedo.com' }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    
    // Check workspace
    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: existingAdmin.id }
    });
    
    if (workspace) {
      console.log('✅ Admin workspace already exists');
      
      // Update current workspace if not set
      if (!existingAdmin.currentWorkspaceId) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { currentWorkspaceId: workspace.id }
        });
        console.log('✅ Set current workspace for admin');
      }
    }
    
    console.log('\n📝 Test Credentials:');
    console.log('   Admin: admin@aikeedo.com / password123');
    return;
  }

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

  // Create admin workspace
  const adminWorkspace = await prisma.workspace.create({
    data: {
      name: 'Personal',
      ownerId: admin.id,
      creditCount: 10000,
    },
  });

  // Add admin as workspace member
  await prisma.workspaceMember.create({
    data: {
      workspaceId: adminWorkspace.id,
      userId: admin.id,
      role: 'OWNER',
    },
  });

  // Set admin's current workspace
  await prisma.user.update({
    where: { id: admin.id },
    data: { currentWorkspaceId: adminWorkspace.id }
  });

  console.log('✅ Created admin workspace with 10,000 credits');
  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin: admin@aikeedo.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
