import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  console.log('FILE_DRIVER=', process.env.FILE_DRIVER);
  console.log('WORKER_HOST=', process.env.WORKER_HOST);
  console.log('REDIS_URL=', process.env.REDIS_URL);
  const app = await NestFactory.createApplicationContext(WorkerModule);
  // Worker runs as a background process; no HTTP server needed.
  // Keep process alive until terminated.
  console.log('Worker started');
}

bootstrap().catch((err) => {
  console.error('Worker failed to start', err);
  process.exit(1);
});
