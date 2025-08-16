import { JobApplicationNotesService } from './job-application-notes.service';
import { JobApplicationNoteMapper } from './job-application-notes.mapper';

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
  let notesRepo: MockRepo;
  let jobAppsRepo: MockRepo;
  let mapper: JobApplicationNoteMapper;
  let service: JobApplicationNotesService;

  beforeEach(() => {
    notesRepo = createMockRepo();
    jobAppsRepo = createMockRepo();
    mapper = new JobApplicationNoteMapper();

    service = new JobApplicationNotesService(notesRepo as any, jobAppsRepo as any, mapper);
  });

  afterEach(() => jest.resetAllMocks());

  it('create validates job application and returns dto', async () => {
    const dto: any = { jobApplicationId: 'ja1', content: 'hello' };
    (jobAppsRepo.existsBy as jest.Mock).mockResolvedValue(true);
    (notesRepo.countBy as jest.Mock).mockResolvedValue(2);
    (notesRepo.create as jest.Mock).mockReturnValue({ ...dto });
    (notesRepo.save as jest.Mock).mockResolvedValue({ id: 'n1', content: 'hello', order: 2 });

    const res = await service.create(dto, 'user-1');

    expect(jobAppsRepo.existsBy).toHaveBeenCalledWith({
      id: 'ja1',
      column: { board: { user: { id: 'user-1' } } },
    });
    expect(notesRepo.countBy).toHaveBeenCalled();
    expect(notesRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('id', 'n1');
    expect(res).toHaveProperty('content', 'hello');
  });

  it('create throws when job application id missing', async () => {
    const dto: any = { jobApplicationId: null, content: 'x' };

    await expect(service.create(dto, 'user-1')).rejects.toThrow();
  });

  it('find returns mapped dtos', async () => {
    (jobAppsRepo.existsBy as jest.Mock).mockResolvedValue(true);
    const entities = [
      { id: 'n1', content: 'a', order: 0 },
      { id: 'n2', content: 'b', order: 1 },
    ];
    (notesRepo.find as jest.Mock).mockResolvedValue(entities);

    const res = await service.find('ja1', 'user-1');

    expect(jobAppsRepo.existsBy).toHaveBeenCalled();
    expect(res).toHaveLength(2);
    expect(res[0]).toHaveProperty('id', 'n1');
  });

  it('update throws when entity not found', async () => {
    (notesRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);

    await expect(service.update('n1', { content: 'x' } as any, 'user-1')).rejects.toThrow(
      "JobApplicationNote doesn't exist.",
    );
  });

  it('update saves and returns dto', async () => {
    const entity = { id: 'n1', content: 'a', order: 0 } as any;
    (notesRepo.findOneBy as jest.Mock).mockResolvedValue(entity);
    (notesRepo.save as jest.Mock).mockResolvedValue({ ...entity, content: 'updated' });

    const res = await service.update('n1', { content: 'updated' } as any, 'user-1');

    expect(notesRepo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('content', 'updated');
  });

  it('rearrange validates ids and upserts', async () => {
    (jobAppsRepo.existsBy as jest.Mock).mockResolvedValue(true);
    const entities = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    (notesRepo.findBy as jest.Mock).mockResolvedValue(entities);

    await service.rearrange('ja1', ['a', 'b', 'c'], 'user-1');

    expect(notesRepo.upsert).toHaveBeenCalled();
  });

  it('rearrange throws on duplicate ids', async () => {
    (jobAppsRepo.existsBy as jest.Mock).mockResolvedValue(true);
    (notesRepo.findBy as jest.Mock).mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

    await expect(service.rearrange('ja1', ['a', 'a'], 'user-1')).rejects.toThrow(
      'List has duplicated Id.',
    );
  });

  it('delete throws when not found', async () => {
    (notesRepo.findOne as jest.Mock).mockResolvedValue(undefined);

    await expect(service.delete('n1', 'user-1')).rejects.toThrow(
      "JobApplicationNote doesn't exist.",
    );
  });

  it('delete soft deletes and calls rearrangeAfterDelete', async () => {
    const note = { id: 'n1', jobApplication: { id: 'ja1' } } as any;
    (notesRepo.findOne as jest.Mock).mockResolvedValue(note);
    (notesRepo.softDelete as jest.Mock).mockResolvedValue({});
    (notesRepo.find as jest.Mock).mockResolvedValue([]);
    (notesRepo.upsert as jest.Mock).mockResolvedValue({});

    await service.delete('n1', 'user-1');

    expect(notesRepo.softDelete).toHaveBeenCalledWith(note.id);
    expect(notesRepo.upsert).toHaveBeenCalled();
  });
});
