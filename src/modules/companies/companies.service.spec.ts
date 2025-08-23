import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  [key: string]: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    countBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    remove: jest.fn(),
    existsBy: jest.fn(),
  };
}

describe('CompaniesService', () => {
  let companiesRepo: MockRepo<Company>;
  let jobAppsRepo: MockRepo<JobApplication>;
  let service: CompaniesService;
  const user: AuthUserDto = { userId: 'user-1', email: 'a@b.com' };

  beforeEach(() => {
    companiesRepo = createMockRepo();
    jobAppsRepo = createMockRepo();
    service = new CompaniesService(companiesRepo as any, jobAppsRepo as any);
  });

  afterEach(() => jest.resetAllMocks());

  it('creates a company without jobApplicationId', async () => {
    const dto: CreateCompanyDto = { name: 'Acme' } as any;

    (companiesRepo.create as jest.Mock).mockReturnValue({ ...dto });
    (companiesRepo.save as jest.Mock).mockResolvedValue({ id: 'c1' });
    (companiesRepo.findOne as jest.Mock).mockResolvedValue({
      id: 'c1',
      name: 'Acme',
      jobApplications: [],
    });

    const res = await service.create(dto, user);

    expect(companiesRepo.create).toHaveBeenCalledWith({ ...dto });
    expect(companiesRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 'c1', name: 'Acme', jobApplications: [] });
    expect(jobAppsRepo.existsBy).not.toHaveBeenCalled();
  });

  it('throws when creating with jobApplicationId that does not belong to user', async () => {
    const dto: CreateCompanyDto = { name: 'X', jobApplicationId: 'ja-1' } as any;

    (jobAppsRepo.existsBy as jest.Mock).mockResolvedValue(false);

    await expect(service.create(dto, user)).rejects.toThrow(NotFoundException);
    expect(jobAppsRepo.existsBy).toHaveBeenCalledWith({
      id: dto.jobApplicationId,
      column: { board: { user: { id: user.userId } } },
    });
  });

  it('findOne returns company when there are no job applications', async () => {
    const company = { id: 'c1', name: 'C', jobApplications: [] };
    (companiesRepo.findOne as jest.Mock).mockResolvedValue(company);

    const res = await service.findOne('c1', user);

    expect(companiesRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'c1' },
      relations: { jobApplications: true },
    });
    expect(res).toBe(company);
  });

  it('findOne refetches when company has jobApplications and checks ownership', async () => {
    const initial = { id: 'c2', name: 'C2', jobApplications: [{ id: 'ja' }] };
    const filtered = { id: 'c2', name: 'C2', jobApplications: [{ id: 'ja' }] };

    (companiesRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(filtered);

    const res = await service.findOne('c2', user);

    expect(companiesRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 'c2' },
      relations: { jobApplications: true },
    });

    expect(companiesRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 'c2', jobApplications: { column: { board: { user: { id: user.userId } } } } },
      relations: { jobApplications: true },
    });

    expect(res).toBe(filtered);
  });

  it('findOne throws NotFoundException when company not found', async () => {
    // service first fetch reads company.jobApplications; to reach the NotFoundException
    // path we return a company with jobApplications (so it refetches) and then
    // return null on the refetch so the NotFoundException is thrown.
    (companiesRepo.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 'x', jobApplications: [1] })
      .mockResolvedValueOnce(null);

    await expect(service.findOne('missing', user)).rejects.toThrow(NotFoundException);
  });

  it('update merges and saves then returns updated entity', async () => {
    const existing = { id: 'c3', name: 'Old', jobApplications: [] } as any;
    const dto: UpdateCompanyDto = { name: 'New' } as any;

    (companiesRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce({ id: 'c3', name: 'New', jobApplications: [] });
    (companiesRepo.save as jest.Mock).mockResolvedValue({ id: 'c3', name: 'New' });

    const res = await service.update('c3', dto, user);

    expect(companiesRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 'c3', name: 'New', jobApplications: [] });
  });

  it('remove removes the entity after verifying ownership', async () => {
    const existing = { id: 'c4', name: 'ToRemove', jobApplications: [] } as any;
    (companiesRepo.findOne as jest.Mock).mockResolvedValue(existing);
    (companiesRepo.remove as jest.Mock).mockResolvedValue(existing);

    const res = await service.remove('c4', user);

    expect(companiesRepo.remove).toHaveBeenCalledWith(existing);
    expect(res).toBe(existing);
  });
});
