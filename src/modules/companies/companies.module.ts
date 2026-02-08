import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Company } from './entities/company.entity';
import { JobApplication } from '../job-applications/entities/job-application.entity';
import { CompanyMapper } from './companies.mapper';
import { BrandfetchService } from './brandfetch.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Company, JobApplication]), HttpModule, ConfigModule],
  providers: [CompaniesService, CompanyMapper, BrandfetchService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}

