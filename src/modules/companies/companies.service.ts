import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { ILike, Repository } from 'typeorm';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { ExceptionMessages } from '../../exceptions/exception-messages';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { BrandfetchService } from './brandfetch.service';
import { DomainValidationResultDto } from './dtos/validate-domain.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(JobApplication)
    private readonly jobApplicationsRepository: Repository<JobApplication>,
    private readonly brandfetchService: BrandfetchService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, user: AuthUserDto) {
    if (createCompanyDto.jobApplicationId) {
      await this.jobApplicationBelongsToUser(createCompanyDto.jobApplicationId, user.userId);
    }

    // Check for existing company by name or domain
    const existingCompany = await this.findByNameOrDomain(
      createCompanyDto.name,
      createCompanyDto.url,
    );

    if (existingCompany) {
      // Company already exists, update it if we have newer data
      let shouldSave = false;
      if (createCompanyDto.url && !existingCompany.url) {
        existingCompany.url = createCompanyDto.url;
        shouldSave = true;
      }
      if (createCompanyDto.logo && !existingCompany.logo) {
        existingCompany.logo = createCompanyDto.logo;
        shouldSave = true;
      }
      if (shouldSave) {
        await this.companiesRepository.save(existingCompany);
      }
      return existingCompany;
    }

    // Create new company
    const companyEntity = this.companiesRepository.create({
      ...createCompanyDto,
      ...(createCompanyDto?.jobApplicationId && {
        jobApplication: { id: createCompanyDto?.jobApplicationId },
      }),
    });

    try {
      const { id: companyId } = await this.companiesRepository.save(companyEntity);
      return this.findOne(companyId, user);
    } catch (error: any) {
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        const existing = await this.findByNameOrDomain(createCompanyDto.name, createCompanyDto.url);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async findOne(companyId: string, { userId }: AuthUserDto) {
    let company = await this.companiesRepository.findOne({
      where: {
        id: companyId,
      },
      relations: { jobApplications: true },
    });

    if (company.jobApplications.length) {
      company = await this.companiesRepository.findOne({
        where: {
          id: companyId,
          jobApplications: { column: { board: { user: { id: userId } } } },
        },
        relations: { jobApplications: true },
      });
    }

    if (!company) {
      throw new NotFoundException(ExceptionMessages.doesNotExist(Company.name));
    }

    return company;
  }

  async countByName(name: string) {
    return {
      startsWithCount: await this.companiesRepository.countBy({ name: ILike(`${name}%`) }),
      exactMatchCount: await this.companiesRepository.countBy({ name }),
    };
  }

  async fetchStartsWith(name: string) {
    return this.companiesRepository.find({
      where: { name: ILike(`${name}%`) },
      order: { name: 'ASC' },
    });
  }

  async getOneByName(name: string) {
    return this.companiesRepository.findOneByOrFail({ name });
  }

  async update(companyId: string, updateCompanyDto: UpdateCompanyDto, user: AuthUserDto) {
    const company = await this.findOne(companyId, user);

    Object.assign(company, updateCompanyDto);

    await this.companiesRepository.save(company);

    return this.findOne(companyId, user);
  }

  async remove(companyId: string, user: AuthUserDto) {
    const company = await this.findOne(companyId, user);

    return this.companiesRepository.remove(company);
  }

  /**
   * Find company by name OR domain (case-insensitive)
   * Used to check for duplicates before creating a new company
   */
  async findByNameOrDomain(name?: string, domain?: string): Promise<Company | null> {
    if (!name && !domain) {
      return null;
    }

    // Prefer exact name match first
    if (name) {
      const nameMatch = await this.companiesRepository
        .createQueryBuilder('company')
        .where('LOWER(company.name) = LOWER(:name)', { name })
        .getOne();
      if (nameMatch) {
        return nameMatch;
      }
    }
    // If no name match, try domain match
    if (domain) {
      return this.companiesRepository
        .createQueryBuilder('company')
        .where('LOWER(company.url) = LOWER(:domain)', { domain })
        .getOne();
    }
    return null;
  }

  /**
   * Validate domain ownership against Brandfetch API
   */
  async validateDomainOwnership(domain: string): Promise<DomainValidationResultDto> {
    return this.brandfetchService.validateDomain(domain);
  }

  // Helpers

  private async jobApplicationBelongsToUser(jobApplicationId: string, userId: string) {
    const jobApplicationExists = await this.jobApplicationsRepository.existsBy({
      id: jobApplicationId,
      column: {
        board: {
          user: {
            id: userId,
          },
        },
      },
    });

    if (!jobApplicationExists) {
      throw new NotFoundException(
        'Cannot find JobApplication with given id that belong to the given user',
      );
    }
  }
}
