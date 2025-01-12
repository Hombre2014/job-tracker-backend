import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Repository } from 'typeorm';
import { AppwriteUploadsService } from '../appwrite-uploads/appwrite-uploads.service';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { User } from '../users/entities/user.entity';
import { Board } from '../boards/entities/board.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly documentsRepository: Repository<Document>,
    private readonly appwriteUploadsService: AppwriteUploadsService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Board) private readonly boardsRepository: Repository<Board>,
  ) {}

  async create(file: Express.Multer.File, createDocumentDto: CreateDocumentDto, userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });

    const { url } = await this.appwriteUploadsService.uploadFile(file);

    const createDocumentPayload = { url, user };

    Object.assign(createDocumentPayload, createDocumentDto);

    if (createDocumentDto.boardId) {
      const board = await this.boardsRepository.findOneBy({ id: createDocumentDto.boardId });

      Object.assign(createDocumentPayload, { board });
    }

    const document = await this.documentsRepository.create(createDocumentPayload);

    return this.documentsRepository.save(document);
  }
}
