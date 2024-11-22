import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { CreateJobApplicationDto } from './dtos/create-job-application.dto';
import { UpdateJobApplicationDto } from './dtos/update-job-application.dto';
import { JobApplicationMapper } from './job-applications.mapper';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { AuthUser } from '../auth/user.decorator';

@Controller('job-applications')
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
    private readonly mapper: JobApplicationMapper,
  ) {}

  @Get('/column/:columnId')
  async findJobsByColumn(
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    const entities = await this.jobApplicationsService.findBy(columnId, user.userId);
    return entities.map((e) => this.mapper.toDto(e));
  }

  @Post()
  async create(@Body() dto: CreateJobApplicationDto, @AuthUser() user: AuthUserDto) {
    const entity = await this.jobApplicationsService.create(dto, user.userId);
    return this.mapper.toDto(entity);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobApplicationDto,
    @AuthUser() user: AuthUserDto,
  ) {
    const entity = await this.jobApplicationsService.update(jobId, dto, user.userId);
    return this.mapper.toDto(entity);
  }

  @Delete('/:id')
  async delete(@Param('id', ParseUUIDPipe) jobId: string, @AuthUser() user: AuthUserDto) {
    await this.jobApplicationsService.delete(jobId, user.userId);
  }

  @Get('/:id')
  async getOne(@Param('id', ParseUUIDPipe) jobId: string, @AuthUser() user: AuthUserDto) {
    return this.jobApplicationsService.findOneById(jobId, user.userId);
  }
}
