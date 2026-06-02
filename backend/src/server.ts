import 'dotenv/config';
import './instrument'; // must precede app import so Sentry instruments it
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { startScheduler } from './jobs/scheduler';

async function bootstrap() {
  try {
    await prisma.$connect();
    startScheduler();

    const server = app.listen(env.PORT, () => {
      console.log(`CampusFlow API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
