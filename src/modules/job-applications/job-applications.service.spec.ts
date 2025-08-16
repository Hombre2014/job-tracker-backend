import { BadRequestException } from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { Repository } from 'typeorm';
import { JobApplication } from './entities/job-application.entity';
import { BoardColumn } from '../board-columns/entities/board-column.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Company } from '../companies/entities/company.entity';
import { JobApplicationNote } from '../job-application-notes/entities/job-application-note.entity';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  [key: string]: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    existsBy: jest.fn(),
    find: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

describe('JobApplicationsService', () => {
  let jobAppsRepo: MockRepo<JobApplication>;
  let boardColumnsRepo: MockRepo<BoardColumn>;
  let contactsRepo: MockRepo<Contact>;
  let companiesRepo: MockRepo<Company>;
  let jobAppNotesRepo: MockRepo<JobApplicationNote>;
  let contactsService: { create: jest.Mock };
  let jobAppNotesService: { create: jest.Mock };
  let service: JobApplicationsService;

  beforeEach(() => {
    jobAppsRepo = createMockRepo();
    boardColumnsRepo = createMockRepo();
    contactsRepo = createMockRepo();
    companiesRepo = createMockRepo();
    jobAppNotesRepo = createMockRepo();

    contactsService = { create: jest.fn() };
    jobAppNotesService = { create: jest.fn() };

    service = new JobApplicationsService(
      jobAppsRepo as any,
      boardColumnsRepo as any,
      contactsRepo as any,
      contactsService as any,
      companiesRepo as any,
      jobAppNotesRepo as any,
      jobAppNotesService as any,
    );
  });

  afterEach(() => jest.resetAllMocks());

  it('findBy throws BadRequestException when board column does not exist', async () => {
    (boardColumnsRepo.existsBy as jest.Mock).mockResolvedValue(false);

    await expect(service.findBy('col-1', 'user-1')).rejects.toThrow(BadRequestException);
    expect(boardColumnsRepo.existsBy).toHaveBeenCalledWith({
      id: 'col-1',
      board: { user: { id: 'user-1' } },
    });
  });

  it('findBy returns job applications when board column exists', async () => {
    (boardColumnsRepo.existsBy as jest.Mock).mockResolvedValue(true);
    const jobs = [{ id: 'ja1' }, { id: 'ja2' }];
    (jobAppsRepo.find as jest.Mock).mockResolvedValue(jobs);

    const res = await service.findBy('col-1', 'user-1');

    expect(jobAppsRepo.find).toHaveBeenCalled();
    expect(res).toBe(jobs);
  });

  it('findOneById delegates to repository findOneOrFail', async () => {
    const ent = { id: 'ja1' } as any;
    (jobAppsRepo.findOneOrFail as jest.Mock).mockResolvedValue(ent);

    const res = await service.findOneById('ja1', 'user-1');

    expect(jobAppsRepo.findOneOrFail).toHaveBeenCalled();
    expect(res).toBe(ent);
  });

  it('create saves entity and returns full entity (no contacts/notes)', async () => {
    const dto: any = { columnId: 'col-1', title: 'T' };
    (boardColumnsRepo.existsBy as jest.Mock).mockResolvedValue(true);
    (jobAppsRepo.create as jest.Mock).mockReturnValue({ ...dto, column: { id: 'col-1' } });
    (jobAppsRepo.save as jest.Mock).mockResolvedValue({ id: 'ja-1' });
    (jobAppsRepo.findOneOrFail as jest.Mock).mockResolvedValue({ id: 'ja-1', title: 'T' });

    const res = await service.create(dto, 'user-1');

    expect(boardColumnsRepo.existsBy).toHaveBeenCalled();
    expect(jobAppsRepo.create).toHaveBeenCalled();
    expect(jobAppsRepo.save).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ id: 'ja-1', title: 'T' });
  });

  it('create calls contactsService when contacts provided', async () => {
    const dto: any = {
      columnId: 'col-1',
      title: 'T',
      contacts: [{ firstName: 'A' }, { firstName: 'B' }],
    };
    (boardColumnsRepo.existsBy as jest.Mock).mockResolvedValue(true);
    (jobAppsRepo.create as jest.Mock).mockReturnValue({ ...dto, column: { id: 'col-1' } });
    (jobAppsRepo.save as jest.Mock).mockResolvedValue({ id: 'ja-2' });
    contactsService.create.mockResolvedValueOnce({ id: 'c1' }).mockResolvedValueOnce({ id: 'c2' });
    (jobAppsRepo.findOneOrFail as jest.Mock).mockResolvedValue({
      id: 'ja-2',
      title: 'T',
      contacts: [{ id: 'c1' }, { id: 'c2' }],
    });

    const res = await service.create(dto, 'user-1');

    expect(contactsService.create).toHaveBeenCalledTimes(2);
    expect(jobAppsRepo.save).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ id: 'ja-2', title: 'T', contacts: [{ id: 'c1' }, { id: 'c2' }] });
  });

  it('update throws when updating column to non-existing board column', async () => {
    const existing = { id: 'ja1', column: { id: 'col-old' } } as any;
    // first findOneById call used to check existence
    jest
      .spyOn(service, 'findOneById')
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing);

    (boardColumnsRepo.existsBy as jest.Mock).mockResolvedValue(false);

    await expect(service.update('ja1', { columnId: 'col-new' } as any, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('update throws when company id does not exist', async () => {
    const existing = { id: 'ja1', column: { id: 'col-old' }, company: undefined } as any;
    jest
      .spyOn(service, 'findOneById')
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing);

    (companiesRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);

    await expect(service.update('ja1', { companyId: 'comp-1' } as any, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('delete removes company when job application deletion succeeds and company has no contacts', async () => {
    const existing = { id: 'ja1', company: { id: 'comp-1', contacts: [] } } as any;
    jest.spyOn(service, 'findOneById').mockResolvedValue(existing);

    (jobAppsRepo.delete as jest.Mock).mockResolvedValue({});
    (companiesRepo.delete as jest.Mock).mockResolvedValue({});

    await service.delete('ja1', 'user-1');

    expect(jobAppsRepo.delete).toHaveBeenCalledWith({ id: existing.id });
    expect(companiesRepo.delete).toHaveBeenCalledWith({ id: existing.company.id });
  });

  it('delete swallows delete error and does not delete company', async () => {
    const existing = { id: 'ja1', company: { id: 'comp-1', contacts: [] } } as any;
    jest.spyOn(service, 'findOneById').mockResolvedValue(existing);

    (jobAppsRepo.delete as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    const res = await service.delete('ja1', 'user-1');

    expect(jobAppsRepo.delete).toHaveBeenCalled();
    expect(companiesRepo.delete).not.toHaveBeenCalled();
    expect(res).toBeUndefined();
  });

  it('attachContact saves when contact not already attached', async () => {
    const jobApp = { id: 'ja1', contacts: [] } as any;
    (jobAppsRepo.findOneByOrFail as jest.Mock).mockResolvedValue(jobApp);
    (contactsRepo.findOneByOrFail as jest.Mock).mockResolvedValue({ id: 'c1' });
    (jobAppsRepo.save as jest.Mock).mockResolvedValue({});

    await service.attachContact('ja1', 'c1', 'user-1');

    expect(jobAppsRepo.save).toHaveBeenCalled();
  });

  it('attachContact does not save when contact already attached', async () => {
    const jobApp = { id: 'ja1', contacts: [{ id: 'c1' }] } as any;
    (jobAppsRepo.findOneByOrFail as jest.Mock).mockResolvedValue(jobApp);
    (contactsRepo.findOneByOrFail as jest.Mock).mockResolvedValue({ id: 'c1' });

    await service.attachContact('ja1', 'c1', 'user-1');

    expect(jobAppsRepo.save).not.toHaveBeenCalled();
  });

  it('attachCompany replaces existing company and deletes old one', async () => {
    const jobApp = { id: 'ja1', company: { id: 'old' } } as any;
    (jobAppsRepo.findOneByOrFail as jest.Mock).mockResolvedValue(jobApp);
    (companiesRepo.findOneByOrFail as jest.Mock).mockResolvedValue({ id: 'new' });
    (companiesRepo.delete as jest.Mock).mockResolvedValue({});
    (jobAppsRepo.save as jest.Mock).mockResolvedValue({});

    await service.attachCompany('ja1', 'new', 'user-1');

    expect(companiesRepo.delete).toHaveBeenCalledWith({ id: 'old' });
    expect(jobAppsRepo.save).toHaveBeenCalled();
  });
});
