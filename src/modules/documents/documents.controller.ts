import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @AuthUser() { userId }: AuthUserDto,
  ) {
    return this.documentsService.create(file, createDocumentDto, userId);
  }
}
