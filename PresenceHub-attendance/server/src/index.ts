// ============================================
// Server Entry Point
// ============================================

import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

async function main() {
  // Test database connection (non-blocking — server starts regardless)
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.warn('⚠️  Database connection failed — server will start without DB.');
    console.warn('   Prisma will retry automatically on the first request.');
    console.warn('   Error:', (error as Error).message);
  }

  // Start server regardless of DB status
  app.listen(env.PORT, () => {
    console.log(`\n🚀 College ERP Server running on http://localhost:${env.PORT}`);
    console.log(`📊 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Client URL: ${env.CLIENT_URL}`);
    console.log(`❤️  Health: http://localhost:${env.PORT}/api/health\n`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();

