import { BadRequestException } from '../../exceptions/bad-request.exception';
import { Injectable } from '@nestjs/common';
import { JobApplication } from './entities/job-application.entity';
import { BoardColumn } from '../board-columns/entities/board-column.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateJobApplicationDto } from './dtos/create-job-application.dto';
import { UpdateJobApplicationDto } from './dtos/update-job-application.dto';
import { ExceptionMessages } from '../../exceptions/exception-messages';
import { ArgumentInvalidException } from '../../exceptions/argument-invalid.exceptions';
import { Contact } from '../contacts/entities/contact.entity';
import { Company } from '../companies/entities/company.entity';
import { JobApplicationNote } from '../job-application-notes/entities/job-application-note.entity';
import { ContactsService } from '../contacts/contacts.service';
import * as _ from 'lodash';
import { JobApplicationNotesService } from '../job-application-notes/job-application-notes.service';

@Injectable()
export class JobApplicationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(JobApplication)
    private readonly jobApplicationsRepository: Repository<JobApplication>,
    @InjectRepository(BoardColumn)
    private readonly boardColumnsRepository: Repository<BoardColumn>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
    private readonly contactsService: ContactsService,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(JobApplicationNote)
    private readonly jobApplicationNotesRepository: Repository<JobApplicationNote>,
    private readonly jobApplicationNotesService: JobApplicationNotesService,
  ) {}

  async findBy(columnId: string, userId: string): Promise<JobApplication[]> {
    const boardColumnExist = await this.boardColumnsRepository.existsBy({
      id: columnId,
      board: { user: { id: userId } },
    });

    if (!boardColumnExist) {
      throw new BadRequestException(ExceptionMessages.doesNotExist(BoardColumn.name));
    }

    const jobApplicationEntities = await this.jobApplicationsRepository.find({
      where: { column: { id: columnId } },
      relations: {
        notes: true,
        contacts: { emails: true, phones: true },
        company: true,
        documents: true,
      },
      order: { notes: { order: 'ASC' } },
    });

    return jobApplicationEntities;
  }

  async findOneById(id: string, userId: string): Promise<JobApplication> {
    return this.jobApplicationsRepository.findOneOrFail({
      where: { id, column: { board: { user: { id: userId } } } },
      relations: {
        column: true,
        notes: true,
        contacts: true,
        company: { contacts: true },
        documents: { jobApplications: true },
      },
    });
  }

  async create(dto: CreateJobApplicationDto, userId: string): Promise<JobApplication> {
    await this.validateBoardColumn(dto.columnId, userId);

    const jobApplication = this.jobApplicationsRepository.create({
      ..._.omit(dto, ['contacts', 'notes', 'company']),
      column: { id: dto.columnId },
      company: { id: dto.companyId },
    });

    const jobApplicationEntity = await this.jobApplicationsRepository.save(jobApplication);

    if (dto.contacts) {
      jobApplicationEntity.contacts = await Promise.all(
        dto.contacts.map((contactDto) => this.contactsService.create(userId, contactDto)),
      );
    }

    if (dto.notes) {
      jobApplicationEntity.notes = await Promise.all(
        dto.notes.map(async (noteDto) => {
          noteDto.jobApplicationId = jobApplication.id;
          const noteMapped = await this.jobApplicationNotesService.create(noteDto, userId);
          return this.jobApplicationNotesRepository.findOneBy({ id: noteMapped.id });
        }),
      );
    }

    const { id } = await this.jobApplicationsRepository.save(jobApplicationEntity);

    return await this.findOneById(id, userId);
  }

  async update(id: string, dto: UpdateJobApplicationDto, userId: string): Promise<JobApplication> {
    const jobApplication = await this.findOneById(id, userId);

    // Updates the column_id field
    if (dto.columnId && jobApplication.column.id !== dto.columnId) {
      const boardColumnExists = await this.boardColumnsRepository.existsBy({ id: dto.columnId });
      if (!boardColumnExists) {
        throw new BadRequestException(`Board column with id '${dto.columnId}' does not exists`);
      }
      jobApplication.column.id = dto.columnId;
    }

    if (dto.companyId && jobApplication?.company?.id !== dto.companyId) {
      const company = await this.companiesRepository.findOneBy({ id: dto.companyId });
      if (company) {
        jobApplication.company = company;
      } else {
        throw new BadRequestException(`Company with id '${dto.companyId}' does not exist`);
      }
    }

    if (dto.status) {
      jobApplication.statusChangedAt = new Date().toISOString();
    }

    // Updates the rest fields
    Object.assign(jobApplication, dto);

    return this.jobApplicationsRepository.save(jobApplication);
  }

  async delete(id: string, userId: string) {
    const jobApplication = await this.findOneById(id, userId);

    return this.dataSource.transaction(async (m) => {
      if (jobApplication.company) {
        if (jobApplication.company.contacts?.length === 1) {
          await m.remove(jobApplication.company);
        }
      }
      for (const document of jobApplication.documents || []) {
        if (document.jobApplications.length === 1) {
          await m.remove(document);
        }
      }
      await m.remove(jobApplication);
    });
  }

  async attachContact(id: string, contactId: string, userId: string) {
    const jobApplication = await this.jobApplicationsRepository.findOneByOrFail({
      id,
      column: { board: { user: { id: userId } } },
    });
    const contact = await this.contactsRepository.findOneByOrFail({
      id: contactId,
      board: { user: { id: userId } },
    });

    const containsContact = jobApplication.contacts.filter(({ id }) => id === contactId).length > 0;

    if (!containsContact) {
      jobApplication.contacts.push(contact);

      await this.jobApplicationsRepository.save(jobApplication);
    }
  }

  async attachCompany(id: string, companyId: string, userId: string) {
    const jobApplication = await this.jobApplicationsRepository.findOneByOrFail({
      id,
      column: { board: { user: { id: userId } } },
    });
    const company = await this.companiesRepository.findOneByOrFail({
      id: companyId,
    });

    if (jobApplication.company) {
      await this.companiesRepository.delete({ id: jobApplication.company.id });
    }

    jobApplication.company = company;

    await this.jobApplicationsRepository.save(jobApplication);
  }

  private async validateBoardColumn(boardColumnId: string | null, userId: string) {
    if (!boardColumnId) {
      throw new ArgumentInvalidException(ExceptionMessages.fieldIsRequired('boardColumnId'));
    }

    const boardColumnExists = await this.boardColumnsRepository.existsBy({
      id: boardColumnId,
      board: { user: { id: userId } },
    });

    if (!boardColumnExists) {
      throw new BadRequestException(ExceptionMessages.doesNotExist(BoardColumn.name));
    }
  }
}
