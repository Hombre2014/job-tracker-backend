import { BadRequestException } from '../../exceptions/bad-request.exception';
import { JobApplicationsService } from './job-applications.service';
import { Repository } from 'typeorm';
import { JobApplication } from './entities/job-application.entity';
import { BoardColumn } from '../board-columns/entities/board-column.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Company } from '../companies/entities/company.entity';
import { JobApplicationNote } from '../job-application-notes/entities/job-application-note.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContactsService } from '../contacts/contacts.service';
import { JobApplicationNotesService } from '../job-application-notes/job-application-notes.service';
import { CreateJobApplicationDto } from './dtos/create-job-application.dto';
import { newGuid } from '../../utils/guid';
import { UpdateJobApplicationDto } from './dtos/update-job-application.dto';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  [key: string]: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    countBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    upsert: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    softDelete: jest.fn(),
    existsBy: jest.fn(),
    delete: jest.fn(),
  };
}

describe('JobApplicationsService', () => {
  let service: JobApplicationsService;
  let jobApplicationsRepository: Repository<JobApplication>;
  let boardColumnsRepository: Repository<BoardColumn>;
  let contactsRepository: Repository<Contact>;
  let companiesRepository: Repository<Company>;
  let jobApplicationNotesRepository: Repository<JobApplicationNote>;
  let contactsService: ContactsService;
  let jobApplicationNotesService: JobApplicationNotesService;

  const validUserId = '8167a958-5d55-476a-8bd2-f5fcdb8e9c5b';
  const validBoardId = 'b04d000-77a5-446e-bc84-9531bf312f9b';
  const validColumnId = 'c010000-77a5-446e-bc84-9531bf312f9b';
  const validCompanyId = '22849b46-06a9-4254-9965-fce8964ca40b';
  const validJobApplication = {
    id: '97658a08-3470-43fe-b415-a5d8b3aa57d5',
    title: 'Test Job Application',
    company: {
      id: validCompanyId,
    },
    column: {
      id: validColumnId,
      board: {
        id: validBoardId,
      },
    },
  } as JobApplication;

  beforeEach(async () => {
    const jobApplicationMock = createMockRepo();
    const boardColumnsMock = createMockRepo();
    const contactsMock = createMockRepo();
    const companiesMock = createMockRepo();
    const jobApplicationNotesMock = createMockRepo();
    const contactServiceMock = {
      create: jest.fn(),
    };
    const jobApplicationNotesServiceMock = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobApplicationsService,
        { provide: getRepositoryToken(JobApplication), useValue: jobApplicationMock },
        { provide: getRepositoryToken(BoardColumn), useValue: boardColumnsMock },
        { provide: getRepositoryToken(Contact), useValue: contactsMock },
        { provide: getRepositoryToken(Company), useValue: companiesMock },
        { provide: getRepositoryToken(JobApplicationNote), useValue: jobApplicationNotesMock },
        { provide: ContactsService, useValue: contactServiceMock },
        { provide: JobApplicationNotesService, useValue: jobApplicationNotesServiceMock },
      ],
    }).compile();

    service = module.get<JobApplicationsService>(JobApplicationsService);
    jobApplicationsRepository = module.get<Repository<JobApplication>>(
      getRepositoryToken(JobApplication),
    );
    boardColumnsRepository = module.get<Repository<BoardColumn>>(getRepositoryToken(BoardColumn));
    contactsRepository = module.get<Repository<Contact>>(getRepositoryToken(Contact));
    companiesRepository = module.get<Repository<Company>>(getRepositoryToken(Company));
    jobApplicationNotesRepository = module.get<Repository<JobApplicationNote>>(
      getRepositoryToken(JobApplicationNote),
    );
    contactsService = module.get<ContactsService>(ContactsService);
    jobApplicationNotesService = module.get<JobApplicationNotesService>(JobApplicationNotesService);
  });

  afterEach(() => jest.resetAllMocks());

  describe('findBy', () => {
    it('findBy throws BadRequestException when board column does not exist', async () => {
      // Arrange
      const randomId = 'a2a1638b-e35b-445a-894f-e46a059f50c5;';
      jest.spyOn(boardColumnsRepository, 'existsBy').mockResolvedValue(false);

      // Act & Assert
      await expect(service.findBy(randomId, validUserId)).rejects.toThrow(BadRequestException);
      expect(boardColumnsRepository.existsBy).toHaveBeenCalledWith({
        id: randomId,
        board: { user: { id: validUserId } },
      });
    });

    it('findBy returns job applications when board column exists', async () => {
      // Arrange
      const jobs = [validJobApplication] as JobApplication[];
      jest.spyOn(boardColumnsRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(jobApplicationsRepository, 'find').mockResolvedValue(jobs);

      // Act
      const res = await service.findBy(validColumnId, validUserId);

      // Assert
      expect(jobApplicationsRepository.find).toHaveBeenCalled();
      expect(res).toBe(jobs);
    });

    it('findOneById delegates to repository findOneOrFail', async () => {
      // Arrange
      jest.spyOn(jobApplicationsRepository, 'findOneOrFail').mockResolvedValue(validJobApplication);

      // Act
      const res = await service.findOneById(validJobApplication.id, validUserId);

      // Assert
      expect(jobApplicationsRepository.findOneOrFail).toHaveBeenCalled();
      expect(res).toBe(validJobApplication);
    });
  });

  describe('create', () => {
    it('create saves entity and returns full entity (no contacts/notes)', async () => {
      // Arrange
      const dto: CreateJobApplicationDto = {
        columnId: validColumnId,
        title: validJobApplication.title,
        companyId: validCompanyId,
      };
      jest.spyOn(boardColumnsRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(jobApplicationsRepository, 'create').mockReturnValue(validJobApplication);
      jest.spyOn(jobApplicationsRepository, 'save').mockResolvedValue(validJobApplication);
      jest.spyOn(jobApplicationsRepository, 'findOneOrFail').mockResolvedValue(validJobApplication);

      // Act
      const res = await service.create(dto, validUserId);

      // Assert
      expect(boardColumnsRepository.existsBy).toHaveBeenCalled();
      expect(jobApplicationsRepository.create).toHaveBeenCalled();
      expect(jobApplicationsRepository.save).toHaveBeenCalledTimes(2);
      expect(res).toEqual(validJobApplication);
    });

    it('create calls contactsService when contacts provided', async () => {
      // Arrange
      const newContactId1 = newGuid();
      const newContactId2 = newGuid();
      const dto: CreateJobApplicationDto = {
        columnId: validColumnId,
        companyId: validCompanyId,
        title: validJobApplication.title,
        contacts: [
          { firstName: 'A', lastName: 'A', boardId: validBoardId, companyIds: [validCompanyId] },
          { firstName: 'B', lastName: 'B', boardId: validBoardId, companyIds: [validCompanyId] },
        ],
      };
      jest.spyOn(boardColumnsRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(jobApplicationsRepository, 'create').mockReturnValue(validJobApplication);
      jest.spyOn(jobApplicationsRepository, 'save').mockResolvedValue(validJobApplication);
      jest
        .spyOn(contactsService, 'create')
        .mockResolvedValueOnce({ id: newContactId1 } as Contact)
        .mockResolvedValueOnce({ id: newContactId2 } as Contact);
      jest.spyOn(jobApplicationsRepository, 'findOneOrFail').mockResolvedValue({
        id: validJobApplication.id,
        title: validJobApplication.title,
        contacts: [{ id: newContactId1 }, { id: newContactId2 }] as Contact[],
      } as JobApplication);

      // Act
      const res = await service.create(dto, validUserId);

      // Assert
      expect(contactsService.create).toHaveBeenCalledTimes(2);
      expect(jobApplicationsRepository.save).toHaveBeenCalledTimes(2);
      expect(res).toEqual({
        id: validJobApplication.id,
        title: validJobApplication.title,
        contacts: [{ id: newContactId1 }, { id: newContactId2 }],
      });
    });
  });

  describe('update', () => {
    it('update throws when updating column to non-existing board column', async () => {
      // Arrange
      const dto: UpdateJobApplicationDto = { columnId: newGuid() };
      jest.spyOn(service, 'findOneById').mockResolvedValue(validJobApplication);
      jest.spyOn(boardColumnsRepository, 'existsBy').mockResolvedValue(false);

      // Act & Assert
      await expect(service.update(validJobApplication.id, dto, validUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('update throws when company id does not exist', async () => {
      // Arrange
      const dto: UpdateJobApplicationDto = { columnId: newGuid() };
      jest
        .spyOn(service, 'findOneById')
        .mockResolvedValue({ ...structuredClone(validJobApplication), company: undefined });
      jest.spyOn(companiesRepository, 'findOneBy').mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(validJobApplication.id, dto, validUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('delete removes company when job application deletion succeeds and company has no contacts', async () => {
      // Arrange
      jest.spyOn(service, 'findOneById').mockResolvedValue(validJobApplication);

      // Act
      await service.delete(validJobApplication.id, validUserId);

      // Assert
      expect(jobApplicationsRepository.delete).toHaveBeenCalledWith({ id: validJobApplication.id });
      expect(companiesRepository.delete).toHaveBeenCalledWith({
        id: validJobApplication.company.id,
      });
    });

    it('delete swallows delete error and does not delete company', async () => {
      // Arrange
      jest.spyOn(service, 'findOneById').mockResolvedValue(validJobApplication);
      jest.spyOn(jobApplicationsRepository, 'delete').mockImplementation(() => {
        throw new Error('error');
      });

      // Act
      const res = await service.delete(validJobApplication.id, validUserId);

      // Assert
      expect(jobApplicationsRepository.delete).toHaveBeenCalled();
      expect(companiesRepository.delete).not.toHaveBeenCalled();
      expect(res).toBeUndefined();
    });
  });

  describe('attachContact', () => {
    it('attachContact saves when contact not already attached', async () => {
      // Arrange
      const contactEntity = { id: newGuid() } as Contact;
      jest
        .spyOn(jobApplicationsRepository, 'findOneByOrFail')
        .mockResolvedValue({ ...structuredClone(validJobApplication), contacts: [] });
      jest.spyOn(contactsRepository, 'findOneByOrFail').mockResolvedValue(contactEntity);
      jest.spyOn(jobApplicationsRepository, 'save').mockResolvedValue({} as JobApplication);

      // Act
      await service.attachContact(validJobApplication.id, contactEntity.id, validUserId);

      // Assert
      expect(jobApplicationsRepository.save).toHaveBeenCalled();
    });

    it('attachContact does not save when contact already attached', async () => {
      // Arrange
      const contactEntity = { id: newGuid() } as Contact;
      jest
        .spyOn(jobApplicationsRepository, 'findOneByOrFail')
        .mockResolvedValue({ ...structuredClone(validJobApplication), contacts: [contactEntity] });
      jest.spyOn(contactsRepository, 'findOneByOrFail').mockResolvedValue(contactEntity);

      // Act
      await service.attachContact(validJobApplication.id, contactEntity.id, validUserId);

      // Assert
      expect(jobApplicationsRepository.save).not.toHaveBeenCalled();
    });

    it('attachCompany replaces existing company and deletes old one', async () => {
      // Arrange
      const companyEntity = { id: newGuid() } as Company;
      const newCompanyEntity = { id: newGuid() } as Company;
      const jobApplicationEntity = {
        ...structuredClone(validJobApplication),
        company: companyEntity,
      } as JobApplication;
      jest
        .spyOn(jobApplicationsRepository, 'findOneByOrFail')
        .mockResolvedValue(jobApplicationEntity);
      jest.spyOn(companiesRepository, 'findOneByOrFail').mockResolvedValue(newCompanyEntity);
      jest.spyOn(jobApplicationsRepository, 'save').mockResolvedValue({} as JobApplication);

      // Act
      await service.attachCompany(jobApplicationEntity.id, newCompanyEntity.id, validUserId);

      // Assert
      expect(companiesRepository.delete).toHaveBeenCalledWith({ id: companyEntity.id });
      expect(jobApplicationsRepository.save).toHaveBeenCalled();
    });
  });
});
