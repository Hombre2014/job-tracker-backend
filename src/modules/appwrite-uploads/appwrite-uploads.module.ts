import { Module } from '@nestjs/common';
import { AppwriteUploadsService } from './appwrite-uploads.service';
import { AppwriteUploadsController } from './appwrite-uploads.controller';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [AppwriteUploadsController],
  providers: [AppwriteUploadsService, ConfigService],
})
export class AppwriteUploadsModule {}
