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
import { Repository } from 'typeorm';
import { BrandfetchService } from './brandfetch.service';

describe('CompaniesService', () => {
  let repository: Repository<Company>;
  let jobApplicationRepository: Repository<JobApplication>;
  let service: CompaniesService;
  let brandfetchService: BrandfetchService;
  
  const validUserDto: AuthUserDto = { userId: newGuid(), email: 'user@example.com' };
  const validCompany = { id: newGuid(), name: 'Test Company', url: 'test.com', jobApplications: [] } as Company;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

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
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const jobAppsRepositoryMock = {
      existsBy: jest.fn(),
    };

    const brandfetchServiceMock = {
      validateDomain: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: companiesRepositoryMock },
        { provide: getRepositoryToken(JobApplication), useValue: jobAppsRepositoryMock },
        { provide: BrandfetchService, useValue: brandfetchServiceMock },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    repository = module.get(getRepositoryToken(Company));
    jobApplicationRepository = module.get(getRepositoryToken(JobApplication));
    brandfetchService = module.get<BrandfetchService>(BrandfetchService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a company without jobApplicationId', async () => {
    // Arrange
    const dto = { name: 'Acme' } as CreateCompanyDto;
    mockQueryBuilder.getOne.mockResolvedValue(null); // No existing company
    jest.spyOn(repository, 'create').mockReturnValue({ ...dto } as Company);
    jest.spyOn(repository, 'save').mockResolvedValue(validCompany);
    jest.spyOn(repository, 'findOne').mockResolvedValue(validCompany);

    // Act
    const res = await service.create(dto, validUserDto);

    // Assert
    expect(repository.createQueryBuilder).toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith({ ...dto });
    expect(repository.save).toHaveBeenCalled();
    expect(res).toEqual(validCompany);
    expect(jobApplicationRepository.existsBy).not.toHaveBeenCalled();
  });

  it('returns existing company if found by name or domain', async () => {
    // Arrange
    const dto = { name: 'Test Company', url: 'test.com' } as CreateCompanyDto;
    mockQueryBuilder.getOne.mockResolvedValue(validCompany); // Found existing company

    // Act
    const res = await service.create(dto, validUserDto);

    // Assert
    expect(repository.createQueryBuilder).toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled(); // Should NOT create new
    expect(res).toEqual(validCompany);
  });

  it('updates existing company url if different', async () => {
    // Arrange
    const dto = { name: 'Test Company', url: 'new-url.com' } as CreateCompanyDto;
    const existingCompany = { ...validCompany, url: 'old-url.com' };
    mockQueryBuilder.getOne.mockResolvedValue(existingCompany);
    jest.spyOn(repository, 'save').mockResolvedValue({ ...existingCompany, url: 'new-url.com' });

    // Act
    const res = await service.create(dto, validUserDto);

    // Assert
    expect(repository.save).toHaveBeenCalledWith({ ...existingCompany, url: 'new-url.com' });
    expect(res.url).toBe('new-url.com');
  });

  it('findByNameOrDomain constructs correct query', async () => {
    // Act
    await service.findByNameOrDomain('Test', 'test.com');

    // Assert
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('company');
    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'LOWER(company.name) = LOWER(:name) OR LOWER(company.url) = LOWER(:domain)',
      { name: 'Test', domain: 'test.com' },
    );
  });

  it('throws when creating with jobApplicationId that does not belong to user', async () => {
    // Arrange
    const dto: CreateCompanyDto = { name: 'Test company', jobApplicationId: newGuid() } as any;
    jest.spyOn(jobApplicationRepository, 'existsBy').mockResolvedValue(false);

    // Act
    await expect(service.create(dto, validUserDto)).rejects.toThrow(NotFoundException);

    // Assert
    expect(jobApplicationRepository.existsBy).toHaveBeenCalledWith({
      id: dto.jobApplicationId,
      column: { board: { user: { id: validUserDto.userId } } },
    });
  });

  it('findOne returns company when there are no job applications', async () => {
    // Arrange
    jest.spyOn(repository, 'findOne').mockResolvedValue(validCompany);

    // Act
    const res = await service.findOne(validCompany.id, validUserDto);

    // Assert
    expect(repository.findOne).toHaveBeenCalledWith({
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
    jest.spyOn(repository, 'findOne').mockResolvedValue(companyWithJobApplications);

    // Act
    const res = await service.findOne(companyWithJobApplications.id, validUserDto);

    // Assert
    expect(repository.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: companyWithJobApplications.id },
      relations: { jobApplications: true },
    });
    expect(repository.findOne).toHaveBeenNthCalledWith(2, {
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
    const companyWithJobApplications = structuredClone(validCompany);
    companyWithJobApplications.jobApplications = [
      { id: newGuid(), title: 'Test Job Application' },
    ] as JobApplication[];
    jest
      .spyOn(repository, 'findOne')
      .mockResolvedValueOnce(companyWithJobApplications)
      .mockResolvedValueOnce(null);

    // Act & Assert
    await expect(service.findOne(companyWithJobApplications.id, validUserDto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('update merges and saves then returns updated entity', async () => {
    // Arrange
    const dto: UpdateCompanyDto = { name: 'New' } as any;
    const updatedCompany = { ...structuredClone(validCompany), name: dto.name };
    jest
      .spyOn(repository, 'findOne')
      .mockResolvedValueOnce(validCompany)
      .mockResolvedValueOnce(updatedCompany);
    jest.spyOn(repository, 'save').mockResolvedValue(updatedCompany);

    // Act
    const res = await service.update(validCompany.id, dto, validUserDto);

    // Assert
    expect(repository.save).toHaveBeenCalled();
    expect(res).toEqual(updatedCompany);
  });

  it('remove removes the entity after verifying ownership', async () => {
    // Arrange
    jest.spyOn(repository, 'findOne').mockResolvedValue(validCompany);
    jest.spyOn(repository, 'remove').mockResolvedValue(validCompany);

    // Act
    const res = await service.remove(validCompany.id, validUserDto);

    // Assert
    expect(repository.remove).toHaveBeenCalledWith(validCompany);
    expect(res).toBe(validCompany);
  });
});
