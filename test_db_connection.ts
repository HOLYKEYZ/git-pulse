import { prisma } from './apps/web/src/lib/prisma';

async function testConnection() {
  console.log('🚀 [Test] Starting Prisma connection test...');
  try {
    const userCount = await prisma.user.count();
    console.log('✅ [Test] Database connection successful!');
    console.log(`📊 [Test] Total users in database: ${userCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ [Test] Database connection failed:', err);
    process.exit(1);
  }
}

testConnection();
