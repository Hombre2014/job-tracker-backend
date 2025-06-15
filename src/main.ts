import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './utils/array.extensions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite default port
    ],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
