import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { CompanyMapper } from './companies.mapper';

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
