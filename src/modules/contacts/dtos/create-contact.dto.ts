import { IsArray, IsOptional, IsString, IsUrl, IsUUID, ValidateNested } from 'class-validator';
import { ContactPhoneDto } from './contact-method/contact-phone.dto';
import { ContactEmailDto } from './contact-method/contact-email.dto';
import { Type } from 'class-transformer';

export class CreateContactDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsUUID()
  boardId: string;

  @IsOptional()
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

  @IsString()
  @IsOptional()
  location?: string;

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

  @IsUrl()
  @IsOptional()
  photoUrl?: string;
}
