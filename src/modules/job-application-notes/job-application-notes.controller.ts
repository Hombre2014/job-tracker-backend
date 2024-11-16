import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { JobApplicationNotesService } from './job-application-notes.service';
import { AuthUser } from '../auth/user.decorator';
import { AuthUserDto } from '../auth/dtos/auth.user.dto';
import { CreateJobApplicationNoteDto } from './dtos/create-job-application-note.dto';
import { UpdateJobApplicationNote } from './dtos/update-job-application-note.dto';

@Controller('job-application-notes')
export class JobApplicationNotesController {
  constructor(private readonly jobApplicationNotesService: JobApplicationNotesService) {}

  @Get('/:id')
  find(@Param('id', ParseUUIDPipe) jobApplicationId: string, @AuthUser() { userId }: AuthUserDto) {
    return this.jobApplicationNotesService.find(jobApplicationId, userId);
  }

  @Post()
  create(
    @Body() jobApplicationNote: CreateJobApplicationNoteDto,
    @AuthUser() { userId }: AuthUserDto,
  ) {
    return this.jobApplicationNotesService.create(jobApplicationNote, userId);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobApplicationNote,
    @AuthUser() { userId }: AuthUserDto,
  ) {
    return this.jobApplicationNotesService.update(id, dto, userId);
  }

  @Put('/:id/rearrange')
  async rearrange(
    @Param('id', ParseUUIDPipe) jobApplicationId: string,
    @Body() noteIds: string[],
    @AuthUser() { userId }: AuthUserDto,
  ) {
    await this.jobApplicationNotesService.rearrange(jobApplicationId, noteIds, userId);
  }

  @Delete('/:id')
  async delete(@Param('id', ParseUUIDPipe) id: string, @AuthUser() { userId }: AuthUserDto) {
    await this.jobApplicationNotesService.delete(id, userId);
  }
}
