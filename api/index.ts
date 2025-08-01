import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';

let app: any;

async function bootstrap() {
  if (!app) {
    const expressServer = express();
    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressServer));

    nestApp.enableCors({
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://online-job-trackr.vercel.app',
      ],
    });

    await nestApp.init();
    app = expressServer;
    app.use(cookieParser());
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const server = await bootstrap();
  return server(req, res);
}
