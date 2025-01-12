import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AppwriteUploadsModule } from '../appwrite-uploads/appwrite-uploads.module';
import { Document } from './entities/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { User } from '../users/entities/user.entity';
import { Board } from '../boards/entities/board.entity';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  imports: [
    AppwriteUploadsModule,
    TypeOrmModule.forFeature([Document, User, Board]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
})
export class DocumentsModule {}
