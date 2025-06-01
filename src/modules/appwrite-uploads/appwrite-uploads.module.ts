import { Module } from '@nestjs/common';
import { AppwriteUploadsService } from './appwrite-uploads.service';
import { AppwriteUploadsController } from './appwrite-uploads.controller';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [AppwriteUploadsController],
  providers: [AppwriteUploadsService, ConfigService],
  exports: [AppwriteUploadsService],
})
export class AppwriteUploadsModule {}
