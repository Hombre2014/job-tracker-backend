import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { JobApplicationStatus } from '../job-application-status.enum';

export class UpdateJobApplicationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  columnId?: string;

  @IsString()
  @IsOptional()
  postUrl?: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsEnum(JobApplicationStatus)
  @IsOptional()
  status?: JobApplicationStatus;
}
