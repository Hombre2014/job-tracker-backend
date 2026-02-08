import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { CompanyMapper } from './companies.mapper';
import { CompanyNameDto } from './dtos/get-company-by-name.dto';
import { FindCompanyDto } from './dtos/find-company.dto';
import { ValidateDomainDto } from './dtos/validate-domain.dto';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly mapper: CompanyMapper,
  ) {}

  @Post()
  async createCompany(@Body() createCompanyDto: CreateCompanyDto, @AuthUser() user: AuthUserDto) {
    const company = await this.companiesService.create(createCompanyDto, user);
    return this.mapper.toDto(company);
  }

  @Get('/by-name/count')
  async countCompaniesByName(@Body() { name }: CompanyNameDto) {
    return this.companiesService.countByName(name);
  }

  @Post('/starts-with')
  async fetchStartsWith(@Body() { name }: CompanyNameDto) {
    return this.companiesService.fetchStartsWith(name);
  }

  @Get('/by-name')
  async getOneByName(@Body() { name }: CompanyNameDto) {
    return this.companiesService.getOneByName(name);
  }

  @Post('/find-by-name-or-domain')
  async findByNameOrDomain(@Body() { name, domain }: FindCompanyDto) {
    const company = await this.companiesService.findByNameOrDomain(name, domain);
    return company ? this.mapper.toDto(company) : null;
  }

  @Post('/validate-domain')
  async validateDomain(@Body() { domain }: ValidateDomainDto) {
    return this.companiesService.validateDomainOwnership(domain);
  }

  @Get('/:id')
  async getCompany(@Param('id', ParseUUIDPipe) companyId: string, @AuthUser() user: AuthUserDto) {
    const company = await this.companiesService.findOne(companyId, user);
    return this.mapper.toDto(company);
  }

  @Put('/:id')
  async updateCompany(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const company = await this.companiesService.update(companyId, updateCompanyDto, user);
    return this.mapper.toDto(company);
  }

  @Delete('/:id')
  deleteCompany(@Param('id', ParseUUIDPipe) companyId, @AuthUser() user: AuthUserDto) {
    return this.companiesService.remove(companyId, user);
  }
}
