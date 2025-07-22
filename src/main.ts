import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import './utils/array.extensions';
import { AppModule } from './app.module';
import { CacheControlMiddleware } from './cache-control.middleware';

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

  app.use(new CacheControlMiddleware().use);

  return app.init();
};

// For local development
if (require.main === module) {
  createNestServer(expressServer)
    .then(async () => {
      console.log('Nest Ready');
      const port = process.env.PORT || 3000;
      expressServer.listen(port, () => {
        console.log(`Application is running on: http://localhost:${port}`);
      });
    })
    .catch((err) => console.error('Nest broken', err));
} else {
  // For serverless deployment
  createNestServer(expressServer)
    .then(() => console.log('Nest Ready'))
    .catch((err) => console.error('Nest broken', err));
}

export default expressServer;
