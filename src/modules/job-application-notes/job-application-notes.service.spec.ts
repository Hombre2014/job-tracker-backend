import { JobApplicationNotesService } from './job-application-notes.service';
import { JobApplicationNoteMapper } from './job-application-notes.mapper';
import { Test, TestingModule } from '@nestjs/testing';
import { JobApplicationNote } from './entities/job-application-note.entity';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobApplicationNoteDto } from './dtos/create-job-application-note.dto';
import { UpdateJobApplicationNote } from './dtos/update-job-application-note.dto';

type MockRepo = Partial<Record<string, jest.Mock>> & { [key: string]: jest.Mock };

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
    softDelete: jest.fn(),
    existsBy: jest.fn(),
  };
}

describe('JobApplicationNotesService', () => {
  let mapper: JobApplicationNoteMapper;
  let service: JobApplicationNotesService;
  let notesRepository: Repository<JobApplicationNote>;
  let jobApplicationRepository: Repository<JobApplication>;

  const validUserId = '8167a958-5d55-476a-8bd2-f5fcdb8e9c5b';
  const validNote = {
    id: '75e7509c-7406-41fc-9552-e4aa55a54a5a',
    jobApplication: {
      id: '7728dbbc-cfa9-471a-a9f7-49acc5455510',
    },
    content: '',
    order: 0,
  } as JobApplicationNote;

  beforeEach(async () => {
    const notesMock = createMockRepo();
    const jobAPplicationMock = createMockRepo();
    mapper = new JobApplicationNoteMapper();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobApplicationNotesService,
        { provide: getRepositoryToken(JobApplicationNote), useValue: notesMock },
        { provide: getRepositoryToken(JobApplication), useValue: jobAPplicationMock },
        { provide: JobApplicationNoteMapper, useValue: mapper },
      ],
    }).compile();

    service = module.get<JobApplicationNotesService>(JobApplicationNotesService);
    notesRepository = module.get<Repository<JobApplicationNote>>(
      getRepositoryToken(JobApplicationNote),
    );
    jobApplicationRepository = module.get<Repository<JobApplication>>(
      getRepositoryToken(JobApplication),
    );
  });

  afterEach(() => jest.resetAllMocks());

  describe('create', () => {
    it('create validates job application and returns dto', async () => {
      // Arrange
      const dto: CreateJobApplicationNoteDto = {
        jobApplicationId: validNote.jobApplication.id,
        content: 'hello world',
      };
      jest.spyOn(jobApplicationRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(notesRepository, 'countBy').mockResolvedValue(2);
      jest.spyOn(notesRepository, 'create').mockReturnValue(validNote);
      jest.spyOn(notesRepository, 'save').mockResolvedValue({ ...validNote, content: dto.content });

      // Act
      const res = await service.create(dto, validUserId);

      // Assert
      expect(jobApplicationRepository.existsBy).toHaveBeenCalledWith({
        id: validNote.jobApplication.id,
        column: { board: { user: { id: validUserId } } },
      });
      expect(notesRepository.countBy).toHaveBeenCalled();
      expect(notesRepository.save).toHaveBeenCalled();
      expect(res).toHaveProperty('id', validNote.id);
      expect(res).toHaveProperty('content', dto.content);
    });

    it('create throws when job application id missing', async () => {
      // Arrange
      const dto: CreateJobApplicationNoteDto = { jobApplicationId: null, content: 'x' };

      // Act & Assert
      await expect(service.create(dto, validUserId)).rejects.toThrow();
    });
  });

  describe('find', () => {
    it('find returns mapped dtos', async () => {
      // Arrange
      const entities = [
        validNote,
        { id: 'd3b328c5-2973-46e4-8c6a-123b04922543', content: 'b', order: 1 },
      ] as JobApplicationNote[];
      jest.spyOn(jobApplicationRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(notesRepository, 'find').mockResolvedValue(entities);

      // Act
      const res = await service.find('ja1', validUserId);

      // Assert
      expect(jobApplicationRepository.existsBy).toHaveBeenCalled();
      expect(res).toHaveLength(2);
      expect(res[0]).toHaveProperty('id', validNote.id);
    });
  });

  describe('update', () => {
    it('update throws when entity not found', async () => {
      // Arrange
      const randomId = '12e2f567-1cd2-4847-b09e-d4bf6ef7e9df';
      jest.spyOn(notesRepository, 'findOneBy').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update(randomId, { content: 'x' } as UpdateJobApplicationNote, validUserId),
      ).rejects.toThrow("JobApplicationNote doesn't exist.");
    });

    it('update saves and returns dto', async () => {
      // Arrange
      jest.spyOn(notesRepository, 'findOneBy').mockResolvedValue(validNote);
      jest.spyOn(notesRepository, 'save').mockResolvedValue({ ...validNote, content: 'updated' });

      // Act
      const res = await service.update(
        validNote.id,
        { content: 'updated' } as UpdateJobApplicationNote,
        validUserId,
      );

      // Assert
      expect(notesRepository.save).toHaveBeenCalled();
      expect(res).toHaveProperty('content', 'updated');
    });
  });

  describe('rearrange', () => {
    it('rearrange validates ids and upserts', async () => {
      // Arrange
      const entities = [
        { id: '75e7509c-7406-41fc-9552-e4aa55a54a5a' },
        { id: 'd3b328c5-2973-46e4-8c6a-123b04922543' },
        { id: '12e2f567-1cd2-4847-b09e-d4bf6ef7e9df' },
      ] as JobApplicationNote[];
      jest.spyOn(jobApplicationRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(notesRepository, 'findBy').mockResolvedValue(entities);

      // Act
      await service.rearrange(
        validNote.jobApplication.id,
        [entities[2].id, entities[1].id, entities[0].id],
        validUserId,
      );

      // Assert
      expect(notesRepository.upsert).toHaveBeenCalled();
    });

    it('rearrange throws on duplicate ids', async () => {
      // Arrange
      const entities = [
        { id: '75e7509c-7406-41fc-9552-e4aa55a54a5a' },
        { id: 'd3b328c5-2973-46e4-8c6a-123b04922543' },
      ] as JobApplicationNote[];
      jest.spyOn(jobApplicationRepository, 'existsBy').mockResolvedValue(true);
      jest.spyOn(notesRepository, 'findBy').mockResolvedValue(entities);

      // Act & Assert
      await expect(
        service.rearrange(
          validNote.jobApplication.id,
          [entities[0].id, entities[0].id],
          validUserId,
        ),
      ).rejects.toThrow('List has duplicated Id.');
    });
  });

  describe('delete', () => {
    it('delete throws when not found', async () => {
      // Arrange
      const randomId = 'a2a1638b-e35b-445a-894f-e46a059f50c5;';
      jest.spyOn(notesRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(randomId, validUserId)).rejects.toThrow(
        "JobApplicationNote doesn't exist.",
      );
    });

    it('delete soft deletes and calls rearrangeAfterDelete', async () => {
      // Arrange
      jest.spyOn(notesRepository, 'findOne').mockResolvedValue(validNote);
      jest.spyOn(notesRepository, 'find').mockResolvedValue([]);

      // Act
      await service.delete(validNote.id, validUserId);

      // Assert
      expect(notesRepository.softDelete).toHaveBeenCalledWith(validNote.id);
      expect(notesRepository.upsert).toHaveBeenCalled();
    });
  });
});
