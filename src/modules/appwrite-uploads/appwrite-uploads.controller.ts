import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppwriteUploadsService } from './appwrite-uploads.service';

@Controller('appwrite-uploads')
export class AppwriteUploadsController {
  constructor(private readonly appwriteUploadsService: AppwriteUploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.appwriteUploadsService.uploadFile(file);
  }
}
