import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AppwriteUploadsModule } from '../appwrite-uploads/appwrite-uploads.module';
import { Document } from './entities/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { User } from '../users/entities/user.entity';
import { Board } from '../boards/entities/board.entity';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { memoryStorage } from 'multer';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  imports: [
    AppwriteUploadsModule,
    TypeOrmModule.forFeature([Document, User, Board, JobApplication]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
})
export class DocumentsModule {}
