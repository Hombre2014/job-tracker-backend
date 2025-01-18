import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Repository } from 'typeorm';
import { AppwriteUploadsService } from '../appwrite-uploads/appwrite-uploads.service';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { User } from '../users/entities/user.entity';
import { Board } from '../boards/entities/board.entity';
import { Pagination } from './dtos/pagination';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { UpdateDocumentDto } from './dtos/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly documentsRepository: Repository<Document>,
    private readonly appwriteUploadsService: AppwriteUploadsService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Board) private readonly boardsRepository: Repository<Board>,
    @InjectRepository(JobApplication)
    private readonly jobApplicationsRepository: Repository<JobApplication>,
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

  async findOneById(id: string, userId: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: { board: true },
    });

    if (!document) {
      throw new NotFoundException('Document with given id and belonging to given user not found');
    }

    return document;
  }

  async findAndPaginate(
    query: Pagination,
    userId: string,
  ): Promise<{
    items: Document[];
    total: number;
    page: number;
    take: number;
  }> {
    console.log(query);
    const { sort, page, take } = query;
    const skip = page * take;
    const order = {};
    sort.forEach(({ by, dir }: { by: string; dir: 'asc' | 'desc' }) => {
      order[by] = dir;
    });
    const where = { user: { id: userId }, ...query.filter };
    const items = await this.documentsRepository.find({
      skip,
      take,
      order,
      where,
    });

    const total = await this.documentsRepository.countBy(where);

    return {
      items,
      total,
      page,
      take,
    };
  }

  async attachDocumentToJobApplication(
    documentId: string,
    jobApplicationId: string,
    userId: string,
  ) {
    const document = await this.documentsRepository.findOne({
      relations: { jobApplications: true },
      where: {
        id: documentId,
        user: { id: userId },
      },
    });

    if (!document) {
      throw new NotFoundException('Document with given id and belonging to given user not found');
    }

    const jobApplication = await this.jobApplicationsRepository.findOneBy({
      id: jobApplicationId,
      column: { board: { user: { id: userId } } },
    });

    if (!jobApplication) {
      throw new NotFoundException(
        'Job application with given id and belonging to given user not found',
      );
    }

    document.jobApplications.push(jobApplication);

    return this.documentsRepository.save(document);
  }

  async detachDocumentFromJobApplication(
    documentId: string,
    jobApplicationId: string,
    userId: string,
  ) {
    const document = await this.documentsRepository.findOne({
      relations: { jobApplications: true },
      where: {
        id: documentId,
        user: { id: userId },
      },
    });

    if (!document) {
      throw new NotFoundException('Document with given id and belonging to given user not found');
    }

    if (!document.jobApplications.find((job) => job.id === jobApplicationId)) {
      throw new NotFoundException(
        'This document is not found in the list of attachments of this job application',
      );
    }

    document.jobApplications = document.jobApplications.filter(
      (job) => job.id !== jobApplicationId,
    );

    return this.documentsRepository.save(document);
  }

  async update(
    file: Express.Multer.File,
    documentId: string,
    updateDocumentDto: UpdateDocumentDto,
    userId: string,
  ) {
    const document = await this.documentsRepository.findOne({
      where: {
        id: documentId,
        user: { id: userId },
      },
    });

    if (!document) {
      throw new NotFoundException('Document with given id and belonging to given user not found');
    }

    const { url } = await this.appwriteUploadsService.uploadFile(file);

    Object.assign(document, { url, ...updateDocumentDto });

    return this.documentsRepository.save(document);
  }

  async delete(documentId: string, userId: string) {
    const document = await this.documentsRepository.findOne({
      where: {
        id: documentId,
        user: { id: userId },
      },
    });

    if (!document) {
      throw new NotFoundException('Document with given id and belonging to given user not found');
    }

    return this.documentsRepository.remove(document);
  }
}
