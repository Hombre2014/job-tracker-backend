import { NestFactory } from '@nestjs/core';

import './utils/array.extensions';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://online-job-trackr.vercel.app',
    ],
  });

  await app.listen(3000);
}
bootstrap();
