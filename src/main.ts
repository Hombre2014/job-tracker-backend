import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './utils/array.extensions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://job-tracker-git-develop-dans-projects-fd64ea5d.vercel.app',
      'https://online-job-trackr.vercel.app',
      'http://localhost:5173', // Vite default port
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
