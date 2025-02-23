import { Injectable } from '@nestjs/common';
import { Contact } from '../entities/contact.entity';
import { ContactDto } from '../dtos/contact.dto';
import { BoardMapper } from '../../boards/boards.mapper';
import { JobApplicationMapper } from '../../job-applications/job-applications.mapper';
import { In, Repository } from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
import { Company } from '../../companies/entities/company.entity';

@Injectable()
export class ContactMapper {
  toDto(entity: Contact) {
    // TODO: Replace these initialization with proper DI.
    // For some reason I cannot Inject these mappers here
    const jobApplicationMapper = new JobApplicationMapper();
    const boardMapper = new BoardMapper();

    const dto = new ContactDto();
    dto.id = entity.id;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.jobTitle = entity.jobTitle;
    dto.companies = entity.companies;
    dto.twitterUrl = entity.twitterUrl;
    dto.facebookUrl = entity.facebookUrl;
    dto.linkedinUrl = entity.linkedinUrl;
    dto.githubUrl = entity.githubUrl;
    dto.comment = entity.comment;
    dto.createdAt = entity.createdAt;
    dto.companies = entity.companies;
    dto.updatedAt = entity.updatedAt;
    dto.board = entity.board ? boardMapper.toDto(entity.board) : undefined;
    dto.jobApplications = entity.jobApplications?.map(jobApplicationMapper.toDto);
    dto.emails = entity.emails;
    dto.phones = entity.phones;
    dto.location = entity.location;
    return dto;
  }

  async toEntity(
    dto,
    companiesRepository: Repository<Company>,
    boardsRepository: Repository<Board>,
  ) {
    const entity = new Contact();

    Object.assign(entity, { ...dto, companyIds: undefined, boardId: undefined });

    entity.companies = dto.companyIds
      ? await companiesRepository.findBy({ id: In(dto.companyIds) })
      : entity.companies;

    const board = await boardsRepository.findOneBy({ id: dto.boardId });
    if (board) {
      entity.board = board;
    }

    return entity;
  }
}
