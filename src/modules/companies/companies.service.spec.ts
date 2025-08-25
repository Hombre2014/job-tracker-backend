import { NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { newGuid } from '../../utils/guid';

describe('CompaniesService', () => {
  let companiesRepo: any;
  let jobAppsRepo: any;
  let service: CompaniesService;
  const validUserDto: AuthUserDto = { userId: newGuid(), email: 'user@example.com' };
  const validCompany = { id: newGuid(), name: 'Test Company', jobApplications: [] } as Company;

  beforeEach(async () => {
    const companiesRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countBy: jest.fn(),
      findOneByOrFail: jest.fn(),
      remove: jest.fn(),
      existsBy: jest.fn(),
    };

    const jobAppsRepositoryMock = {
      existsBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: companiesRepositoryMock },
        { provide: getRepositoryToken(JobApplication), useValue: jobAppsRepositoryMock },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    companiesRepo = module.get(getRepositoryToken(Company));
    jobAppsRepo = module.get(getRepositoryToken(JobApplication));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a company without jobApplicationId', async () => {
    // Arrange
    const dto = { name: 'Acme' } as CreateCompanyDto;
    jest.spyOn(companiesRepo, 'create').mockReturnValue({ ...dto });
    jest.spyOn(companiesRepo, 'save').mockResolvedValue(validCompany);
    jest.spyOn(companiesRepo, 'findOne').mockResolvedValue(validCompany);

    // Act
    const res = await service.create(dto, validUserDto);

    // Assert
    expect(companiesRepo.create).toHaveBeenCalledWith({ ...dto });
    expect(companiesRepo.save).toHaveBeenCalled();
    expect(res).toEqual(validCompany);
    expect(jobAppsRepo.existsBy).not.toHaveBeenCalled();
  });

  it('throws when creating with jobApplicationId that does not belong to user', async () => {
    // Arrange
    const dto: CreateCompanyDto = { name: 'Test company', jobApplicationId: newGuid() } as any;
    jest.spyOn(jobAppsRepo, 'existsBy').mockResolvedValue(false);

    // Act
    await expect(service.create(dto, validUserDto)).rejects.toThrow(NotFoundException);

    // Assert
    expect(jobAppsRepo.existsBy).toHaveBeenCalledWith({
      id: dto.jobApplicationId,
      column: { board: { user: { id: validUserDto.userId } } },
    });
  });

  it('findOne returns company when there are no job applications', async () => {
    // Arrange
    jest.spyOn(companiesRepo, 'findOne').mockResolvedValue(validCompany);

    // Act
    const res = await service.findOne(validCompany.id, validUserDto);

    // Assert
    expect(companiesRepo.findOne).toHaveBeenCalledWith({
      where: { id: validCompany.id },
      relations: { jobApplications: true },
    });
    expect(res).toBe(validCompany);
  });

  it('findOne refetches when company has jobApplications and checks ownership', async () => {
    // Arrange
    const companyWithJobApplications = structuredClone(validCompany);
    companyWithJobApplications.jobApplications = [
      { id: newGuid(), title: 'Test Job Application' },
    ] as JobApplication[];
    jest.spyOn(companiesRepo, 'findOne').mockResolvedValue(companyWithJobApplications);

    // Act
    const res = await service.findOne(companyWithJobApplications.id, validUserDto);

    // Assert
    expect(companiesRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: companyWithJobApplications.id },
      relations: { jobApplications: true },
    });
    expect(companiesRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: {
        id: companyWithJobApplications.id,
        jobApplications: { column: { board: { user: { id: validUserDto.userId } } } },
      },
      relations: { jobApplications: true },
    });
    expect(res).toBe(companyWithJobApplications);
  });

  it('findOne throws NotFoundException when company does not belongs to user', async () => {
    // Arrange
    (companiesRepo.findOne as jest.Mock)
      .mockResolvedValueOnce({ id: 'x', jobApplications: [1] })
      .mockResolvedValueOnce(null);

    // Act & Assert
    await expect(service.findOne('missing', validUserDto)).rejects.toThrow(NotFoundException);
  });

  it('update merges and saves then returns updated entity', async () => {
    // Arrange
    const existing = { id: 'c3', name: 'Old', jobApplications: [] } as any;
    const dto: UpdateCompanyDto = { name: 'New' } as any;

    (companiesRepo.findOne as jest.Mock)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce({ id: 'c3', name: 'New', jobApplications: [] });
    (companiesRepo.save as jest.Mock).mockResolvedValue({ id: 'c3', name: 'New' });

    // Act
    const res = await service.update('c3', dto, validUserDto);

    // Assert
    expect(companiesRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 'c3', name: 'New', jobApplications: [] });
  });

  it('remove removes the entity after verifying ownership', async () => {
    // Arrange
    const existing = { id: 'c4', name: 'ToRemove', jobApplications: [] } as any;
    (companiesRepo.findOne as jest.Mock).mockResolvedValue(existing);
    (companiesRepo.remove as jest.Mock).mockResolvedValue(existing);

    // Act
    const res = await service.remove('c4', validUserDto);

    // Assert
    expect(companiesRepo.remove).toHaveBeenCalledWith(existing);
    expect(res).toBe(existing);
  });
});
