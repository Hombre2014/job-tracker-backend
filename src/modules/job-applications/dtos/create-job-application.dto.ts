import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { CreateContactDto } from '../../contacts/dtos/create-contact.dto';
import { Type } from 'class-transformer';
import { CreateCompanyDto } from '../../companies/dtos/create-company.dto';
import { CreateJobApplicationNoteDto } from '../../job-application-notes/dtos/create-job-application-note.dto';

export class CreateJobApplicationDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsUUID()
  columnId: string;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJobApplicationNoteDto)
  notes?: CreateJobApplicationNoteDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  company?: CreateCompanyDto;
}
