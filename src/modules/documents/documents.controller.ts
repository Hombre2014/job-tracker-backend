import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { Pagination } from './dtos/pagination';
import { UpdateDocumentDto } from './dtos/update-document.dto';

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

  @Get('/user')
  async findByUser(@AuthUser() { userId }: AuthUserDto) {
    return this.documentsService.getAllDocumentPerUser(userId);
  }

  @Get('/:id')
  async findOneById(@Param('id') id: string, @AuthUser() { userId }: AuthUserDto) {
    return this.documentsService.findOneById(id, userId);
  }

  @Get()
  async findBy(@Query() query: Pagination, @AuthUser() { userId }: AuthUserDto) {
    return this.documentsService.findAndPaginate(query, userId);
  }

  @Get('/board/:boardId')
  async findByBoardId(@Param('boardId') boardId: string, @AuthUser() { userId }: AuthUserDto) {
    return this.documentsService.getAllDocumentsPerBoard(boardId, userId);
  }

  @Post('/:id/job-application/:jobId/attach')
  async attachToJobApplication(
    @Param('id') documentId: string,
    @Param('jobId') jobApplicationId: string,
    @AuthUser() { userId }: AuthUserDto,
  ) {
    return this.documentsService.attachDocumentToJobApplication(
      documentId,
      jobApplicationId,
      userId,
    );
  }

  @Post('/:id/job-application/:jobId/detach')
  async detachToJobApplication(
    @Param('id') documentId: string,
    @Param('jobId') jobApplicationId: string,
    @AuthUser() { userId }: AuthUserDto,
  ) {
    return this.documentsService.detachDocumentFromJobApplication(
      documentId,
      jobApplicationId,
      userId,
    );
  }

  @Patch('/:id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') documentId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @AuthUser() { userId }: AuthUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    this.documentsService.update(documentId, updateDocumentDto, userId, file);
  }

  @Delete('/:id')
  async delete(@Param('id') documentId: string, @AuthUser() { userId }: AuthUserDto) {
    return this.documentsService.delete(documentId, userId);
  }
}
