import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ContactPhoneDto } from './contact-method/contact-phone.dto';
import { ContactEmailDto } from './contact-method/contact-email.dto';
import { Type } from 'class-transformer';

export class CreateContactDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  jobTitle: string;

  @IsUUID()
  boardId: string;

  @IsArray()
  @IsUUID('all', { each: true })
  companyIds: string[];

  @IsString()
  @IsOptional()
  twitterUrl?: string;

  @IsString()
  @IsOptional()
  facebookUrl?: string;

  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @IsString()
  @IsOptional()
  githubUrl?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactPhoneDto)
  phones?: ContactPhoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactEmailDto)
  emails?: ContactEmailDto[];
}
