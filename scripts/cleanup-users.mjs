import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUsers() {
  try {
    // Keep the dev user
    const devUserEmail = 'fox-author@dev.no';
    
    // Get count before deletion
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true }
    });
    
    console.log(`Found ${allUsers.length} users in database`);
    
    // Delete all users except the dev user
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          not: devUserEmail
        }
      }
    });
    
    console.log(`✅ Deleted ${result.count} users`);
    console.log(`✅ Kept dev user: ${devUserEmail}`);
    
    // Verify
    const remainingUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    
    console.log(`\nRemaining users (${remainingUsers.length}):`);
    remainingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error cleaning up users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers();

