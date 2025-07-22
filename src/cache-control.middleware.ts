// src/cache-control.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CacheControlMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Vercel CDN (takes precedence over Cache-Control)
    res.setHeader('CDN-Cache-Control', 'no-store');
    // Older name still understood by Vercel
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

    next();
  }
}
