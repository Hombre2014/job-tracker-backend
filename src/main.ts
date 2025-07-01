import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import './utils/array.extensions';
import { AppModule } from './app.module';

const expressServer = express();

const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

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

  return app.init();
};

createNestServer(expressServer)
  .then(() => console.log('Nest Ready'))
  .catch((err) => console.error('Nest broken', err));

export default expressServer;
